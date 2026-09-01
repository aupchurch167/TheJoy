/**
 * The scheduled worker, and an in-process timer that drives it.
 *
 * This app runs as an always-on Node server, so it can run its own recurring
 * jobs (sending drip + broadcasts, publishing scheduled posts, roster sync,
 * lifecycle check-ins, recognition) without depending on an external cron. The
 * same work is also reachable at /api/cron for a belt-and-suspenders external
 * trigger or a manual kick; both call runScheduledJobs().
 */

import { hasDatabase } from "./db";
import { runDrip } from "./drip";
import { processDueBroadcasts } from "./broadcast-runner";
import { publishDueScheduledPosts } from "./posts";
import { recordRanks } from "./ranks";
import { syncConnecteamIfDue } from "./connecteam-sync";
import { processScheduledCheckins } from "./employee-lifecycle";
import { sendRecognitionDigestIfDue } from "./recognition";
import { setIntegrationState } from "./integration-state";

export type JobResult = {
  postsPublished: number;
  dripSent: number;
  broadcastSent: number;
  ranksLogged: number | null;
  connecteamSync: unknown;
  checkinsSent: number | null;
  recognition: unknown;
};

/** Run a fn, logging and swallowing errors so one job never sinks the run. */
async function safe<T>(label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (err) {
    console.error(`[scheduler] ${label} failed`, err);
    return null;
  }
}

/**
 * Do one pass of all scheduled work. Core jobs (posts, drip, broadcasts) run
 * first so a later integration error can never delay email. Records a heartbeat
 * so the admin can see the worker is alive.
 */
export async function runScheduledJobs(): Promise<JobResult> {
  const postsPublished = await publishDueScheduledPosts();
  const [dripSent, broadcastSent] = await Promise.all([
    runDrip(),
    processDueBroadcasts(),
  ]);

  const ranksLogged = await safe("recordRanks", () => recordRanks());
  const connecteamSync = await safe("connecteamSync", () =>
    syncConnecteamIfDue(new Date())
  );
  const checkinsSent = await safe("checkins", () =>
    processScheduledCheckins(new Date())
  );
  const recognition = await safe("recognition", () =>
    sendRecognitionDigestIfDue(new Date())
  );

  await safe("heartbeat", () =>
    setIntegrationState("worker_last_run", {
      at: new Date().toISOString(),
      broadcastSent,
      dripSent,
      postsPublished,
      checkinsSent,
    })
  );

  return {
    postsPublished,
    dripSent,
    broadcastSent,
    ranksLogged,
    connecteamSync,
    checkinsSent,
    recognition,
  };
}

/* ------------------------------------------------------------------ */
/* In-process timer                                                    */
/* ------------------------------------------------------------------ */

// Module-level guards so a single process starts at most one timer and never
// overlaps runs with itself.
let started = false;
let running = false;

function intervalMs(): number {
  const mins = Number(process.env.SCHEDULER_INTERVAL_MINUTES);
  const safeMins = Number.isFinite(mins) && mins >= 1 ? mins : 5;
  return safeMins * 60_000;
}

async function tick(): Promise<void> {
  if (running) return; // a previous run is still going; skip this beat
  if (!hasDatabase()) return; // nothing to do without a database
  running = true;
  try {
    await runScheduledJobs();
  } catch (err) {
    console.error("[scheduler] tick failed", err);
  } finally {
    running = false;
  }
}

/**
 * Start the in-process scheduler. Safe to call more than once (only the first
 * call arms the timer). No-op off the Node runtime or when INTERNAL_SCHEDULER
 * is set to "off" (e.g. when you drive it exclusively from an external cron).
 */
export function startInternalScheduler(): void {
  if (started) return;
  if (process.env.NEXT_RUNTIME && process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.INTERNAL_SCHEDULER === "off") return;
  started = true;

  // First pass a little after boot (let the server settle + schema apply), then
  // on the interval. unref() so the timer never blocks a clean shutdown.
  const first = setTimeout(() => void tick(), 20_000);
  const repeat = setInterval(() => void tick(), intervalMs());
  first.unref?.();
  repeat.unref?.();
  console.info(
    `[scheduler] internal worker armed (every ${intervalMs() / 60000} min).`
  );
}
