"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  setLeadStage,
  leadEmailExists,
  insertImportedLead,
} from "@/lib/leads";
import { parseLeadsCsv } from "@/lib/leads-import";

const Schema = z.object({
  id: z.string().uuid(),
  stage: z.enum(["new", "toured", "moved_in", "lost"]),
});

export async function updateLeadStage(input: unknown): Promise<{ ok: boolean }> {
  await requireAdmin();
  const parsed = Schema.safeParse(input);
  if (!parsed.success) return { ok: false };
  try {
    await setLeadStage(parsed.data.id, parsed.data.stage);
    revalidatePath("/admin/leads");
    revalidatePath(`/admin/leads/${parsed.data.id}`);
    return { ok: true };
  } catch (err) {
    console.error("[updateLeadStage]", err);
    return { ok: false };
  }
}

/* ---------------- CSV lead import (pre-website leads) ---------------- */

const ImportSchema = z.object({
  csv: z.string().min(1).max(2_000_000),
  source: z.string().trim().max(40).optional(),
  hold: z.boolean().optional(),
  commit: z.boolean().optional(),
});

export type ImportLeadsResult =
  | {
      ok: true;
      committed: boolean;
      parsed: number;
      usable: number;
      added: number;
      alreadyInList: number;
      failed: number;
      noEmail: number;
      badEmail: number;
      dupeInFile: number;
      message: string;
    }
  | { ok: false; error: string };

/**
 * Preview (commit=false) or import (commit=true) a CSV of old leads. Preview
 * counts new-vs-existing without writing; import inserts the new ones. Both
 * dedupe by email against existing leads, so importing twice is safe.
 */
export async function importLeads(input: unknown): Promise<ImportLeadsResult> {
  await requireAdmin();

  const parsed = ImportSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid request." };

  const base = parsed.data.source?.trim() || "import";
  const consent = !parsed.data.hold;
  const commit = parsed.data.commit === true;

  let rows, stats;
  try {
    stats = parseLeadsCsv(parsed.data.csv, base);
    rows = stats.rows;
  } catch {
    return { ok: false, error: "Could not read that CSV. Check the format." };
  }

  if (!rows.length) {
    return {
      ok: false,
      error:
        "No usable rows found. The file needs a header row and an email column.",
    };
  }

  try {
    let added = 0;
    let alreadyInList = 0;
    let failed = 0;
    for (const r of rows) {
      // A duplicate-check failure is a real DB problem: let the outer catch
      // report it. A single INSERT failure only drops that one row.
      if (await leadEmailExists(r.email)) {
        alreadyInList++;
        continue;
      }
      if (commit) {
        try {
          await insertImportedLead({
            name: r.name,
            email: r.email,
            phone: r.phone,
            message: r.message,
            source: r.source,
            consent,
            createdAt: r.createdAt,
          });
          added++;
        } catch (rowErr) {
          console.error("[importLeads] row failed", r.email, rowErr);
          failed++;
        }
      } else {
        added++; // preview: count as importable
      }
    }

    if (commit) revalidatePath("/admin/leads");

    const heldNote = !consent
      ? " Held out of broadcasts (consent off) for a re-permission email."
      : "";
    const failNote = failed > 0 ? ` ${failed} row(s) could not be imported.` : "";
    return {
      ok: true,
      committed: commit,
      parsed: stats.total,
      usable: rows.length,
      added,
      alreadyInList,
      failed,
      noEmail: stats.noEmail,
      badEmail: stats.badEmail,
      dupeInFile: stats.dupeInFile,
      message: commit
        ? `Imported ${added} lead${added === 1 ? "" : "s"}, skipped ${alreadyInList} already in the list.${failNote}${heldNote}`
        : `Ready to import ${added} new lead${added === 1 ? "" : "s"} (${alreadyInList} already in the list).`,
    };
  } catch (err) {
    console.error("[importLeads]", err);
    return { ok: false, error: "Import failed. Is the database connected?" };
  }
}
