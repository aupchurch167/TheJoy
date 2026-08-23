/**
 * Orchestrates a Connecteam -> roster sync. Fetches the whole user directory,
 * reconciles each person (add / update / adopt), then deactivates anyone who
 * left Connecteam. The outcome is stored in `integration_state` so the roster
 * screen can show when it last ran and the cron can throttle itself.
 */

import { query } from "./db";
import {
  connecteamEnabled,
  fetchConnecteamUsers,
  ConnecteamError,
} from "./connecteam";
import { upsertFromConnecteam, deactivateMissingConnecteam } from "./employees";

const STATE_KEY = "connecteam_roster";

export type SyncResult = {
  ok: boolean;
  added: number;
  updated: number;
  deactivated: number;
  total: number;
  error?: string;
  at: string;
};

export type ConnecteamStatus = {
  enabled: boolean;
  lastSyncAt: string | null;
  last: SyncResult | null;
};

async function readState(): Promise<SyncResult | null> {
  const rows = await query<{ value: SyncResult }>(
    `SELECT value FROM integration_state WHERE key = $1`,
    [STATE_KEY]
  );
  return rows[0]?.value ?? null;
}

async function writeState(result: SyncResult): Promise<void> {
  await query(
    `INSERT INTO integration_state (key, value, updated_at)
     VALUES ($1, $2::jsonb, now())
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
    [STATE_KEY, JSON.stringify(result)]
  );
}

export async function getConnecteamStatus(): Promise<ConnecteamStatus> {
  const enabled = connecteamEnabled();
  let last: SyncResult | null = null;
  try {
    last = await readState();
  } catch {
    /* table may not exist yet */
  }
  return { enabled, lastSyncAt: last?.at ?? null, last };
}

/** Run a full sync now. `at` is passed in so this stays free of clock calls. */
export async function syncEmployeesFromConnecteam(at: string): Promise<SyncResult> {
  if (!connecteamEnabled()) {
    return {
      ok: false,
      added: 0,
      updated: 0,
      deactivated: 0,
      total: 0,
      error: "CONNECTEAM_API_KEY is not set.",
      at,
    };
  }
  try {
    const users = await fetchConnecteamUsers({ includeArchived: true });
    let added = 0;
    let updated = 0;
    for (const u of users) {
      const outcome = await upsertFromConnecteam({
        externalId: u.externalId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        title: u.title,
        active: !u.archived,
      });
      if (outcome === "added") added++;
      else updated++;
    }
    // Anyone gone from Connecteam entirely is deactivated (not deleted).
    const deactivated = await deactivateMissingConnecteam(
      users.map((u) => u.externalId)
    );

    const result: SyncResult = {
      ok: true,
      added,
      updated,
      deactivated,
      total: users.length,
      at,
    };
    await writeState(result);
    return result;
  } catch (err) {
    const result: SyncResult = {
      ok: false,
      added: 0,
      updated: 0,
      deactivated: 0,
      total: 0,
      error:
        err instanceof ConnecteamError
          ? err.message
          : "The sync failed unexpectedly.",
      at,
    };
    try {
      await writeState(result);
    } catch {
      /* best effort */
    }
    return result;
  }
}

/**
 * For the cron: only sync if enabled and the last successful run is older than
 * `maxAgeHours` (default 12). `now` is passed in so callers control the clock.
 */
export async function syncConnecteamIfDue(
  now: Date,
  maxAgeHours = 12
): Promise<SyncResult | null> {
  if (!connecteamEnabled()) return null;
  let last: SyncResult | null = null;
  try {
    last = await readState();
  } catch {
    return null; // integration_state table not present yet
  }
  if (last?.ok && last.at) {
    const ageMs = now.getTime() - new Date(last.at).getTime();
    if (ageMs < maxAgeHours * 3_600_000) return null; // too soon
  }
  return syncEmployeesFromConnecteam(now.toISOString());
}
