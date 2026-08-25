/**
 * Orchestrates a Connecteam -> roster sync. Fetches the whole user directory,
 * reconciles each person (add / update / adopt), then deactivates anyone who
 * left Connecteam. The outcome is stored in `integration_state` so the roster
 * screen can show when it last ran and the cron can throttle itself.
 */

import {
  connecteamEnabled,
  fetchConnecteamUsers,
  ConnecteamError,
} from "./connecteam";
import { upsertFromConnecteam, deactivateMissingConnecteam } from "./employees";
import { getIntegrationState, setIntegrationState } from "./integration-state";
import { enrollNewHire, enrollExit } from "./employee-lifecycle";

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
  return getIntegrationState<SyncResult>(STATE_KEY);
}

async function writeState(result: SyncResult): Promise<void> {
  await setIntegrationState(STATE_KEY, result);
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
    const newHireIds: string[] = [];
    const departedIds: string[] = [];

    for (const u of users) {
      const res = await upsertFromConnecteam({
        externalId: u.externalId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        title: u.title,
        active: !u.archived,
        hireDate: u.hireDate,
        birthDate: u.birthDate,
      });
      if (res.outcome === "added") {
        added++;
        if (!u.archived) newHireIds.push(res.id);
      } else {
        updated++;
      }
      if (res.becameInactive) departedIds.push(res.id);
    }

    // Anyone gone from Connecteam entirely is deactivated (not deleted).
    const departedByRemoval = await deactivateMissingConnecteam(
      users.map((u) => u.externalId)
    );
    departedIds.push(...departedByRemoval);

    // Lifecycle: enroll genuinely-new hires in onboarding, and anyone who just
    // left in the exit survey. Failures here never fail the sync itself.
    for (const id of newHireIds) {
      try {
        await enrollNewHire(id);
      } catch (e) {
        console.error("[connecteam] onboarding enroll failed", id, e);
      }
    }
    for (const id of departedIds) {
      try {
        await enrollExit(id);
      } catch (e) {
        console.error("[connecteam] exit enroll failed", id, e);
      }
    }

    const result: SyncResult = {
      ok: true,
      added,
      updated,
      deactivated: departedByRemoval.length,
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
