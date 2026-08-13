"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  insertFamilyMember,
  deleteSubscriber,
  familyEmailExists,
  familyContactExists,
  setFamilyActive,
  setFamilySmsConsent,
  enableSmsForFamiliesWithPhone,
} from "@/lib/leads";
import { parseFamilyContacts } from "@/lib/family-import";

const AddSchema = z
  .object({
    name: z.string().trim().min(1, "Contact name is required.").max(120),
    residentName: z.string().trim().max(120).optional().default(""),
    relation: z.string().trim().max(60).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    email: z
      .string()
      .trim()
      .max(200)
      .optional()
      .default("")
      .refine((v) => v === "" || z.string().email().safeParse(v).success, {
        message: "Enter a valid email, or leave it blank.",
      }),
    // Opt-in is only required when an email is provided (so we can email them).
    optIn: z.boolean().optional().default(false),
    // Text opt-in (only meaningful when a phone is provided).
    smsOptIn: z.boolean().optional().default(false),
  })
  .refine((d) => d.email === "" || d.optIn === true, {
    message: "Confirm this family agreed to receive Joy emails.",
    path: ["optIn"],
  });

export type FamilyResult = { ok: true } | { ok: false; error: string };

export async function addFamilyMember(input: unknown): Promise<FamilyResult> {
  await requireAdmin();
  const parsed = AddSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  const d = parsed.data;
  try {
    if (d.email && (await familyEmailExists(d.email))) {
      return { ok: false, error: "That email is already on the family list." };
    }
    await insertFamilyMember({
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      residentName: d.residentName || null,
      relation: d.relation || null,
      smsConsent: !!d.phone && d.smsOptIn,
    });
    revalidatePath("/admin/families");
    return { ok: true };
  } catch (err) {
    console.error("[addFamilyMember]", err);
    return { ok: false, error: "Could not add. Is the database connected?" };
  }
}

export type ImportResult =
  | { ok: true; added: number; skipped: number; invalid: number }
  | { ok: false; error: string };

/**
 * Bulk import family contacts from pasted/uploaded text. Deduplicates within
 * the batch and against existing rows (by email, else by resident + name), so
 * re-running or overlapping lists never create duplicates.
 */
export async function importFamilyContacts(text: string): Promise<ImportResult> {
  await requireAdmin();
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, error: "Nothing to import. Paste a list or choose a file." };
  }
  const rows = parseFamilyContacts(text).slice(0, 2000);
  if (rows.length === 0) {
    return {
      ok: false,
      error:
        "No contacts found. Use columns: resident, relation, contact name, phone, email (a header row is optional).",
    };
  }

  const seenEmail = new Set<string>();
  const seenKey = new Set<string>();
  let added = 0;
  let skipped = 0;
  let invalid = 0;

  for (const r of rows) {
    if (!r.name.trim()) {
      invalid++;
      continue;
    }
    const email = r.email.trim().toLowerCase();
    const key = `${r.resident_name.trim().toLowerCase()}|${r.name.trim().toLowerCase()}`;
    if ((email && seenEmail.has(email)) || seenKey.has(key)) {
      skipped++;
      continue;
    }
    try {
      if (email && (await familyEmailExists(email))) {
        skipped++;
        continue;
      }
      if (r.resident_name.trim() && (await familyContactExists(r.resident_name, r.name))) {
        skipped++;
        continue;
      }
      await insertFamilyMember({
        name: r.name,
        email: email || null,
        phone: r.phone || null,
        residentName: r.resident_name || null,
        relation: r.relation || null,
        source: "family_import",
        unsubscribed: r.doNotContact,
      });
      added++;
      if (email) seenEmail.add(email);
      seenKey.add(key);
    } catch (err) {
      console.error("[importFamilyContacts] row failed:", err);
      invalid++;
    }
  }

  revalidatePath("/admin/families");
  return { ok: true, added, skipped, invalid };
}

export async function toggleFamilyActive(
  id: string,
  active: boolean
): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await setFamilyActive(id, active);
    revalidatePath("/admin/families");
    return { ok: true };
  } catch (err) {
    console.error("[toggleFamilyActive]", err);
    return { ok: false };
  }
}

export async function toggleFamilySmsConsent(
  id: string,
  consent: boolean
): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await setFamilySmsConsent(id, consent);
    revalidatePath("/admin/families");
    return { ok: true };
  } catch (err) {
    console.error("[toggleFamilySmsConsent]", err);
    return { ok: false };
  }
}

/**
 * Turn on texts for every active family contact with a phone (and no opt-out).
 * The operator attests they have permission to text these families.
 */
export async function enableTextsForAll(): Promise<
  { ok: true; enabled: number } | { ok: false; error: string }
> {
  await requireAdmin();
  try {
    const enabled = await enableSmsForFamiliesWithPhone();
    revalidatePath("/admin/families");
    revalidatePath("/admin/feedback");
    return { ok: true, enabled };
  } catch (err) {
    console.error("[enableTextsForAll]", err);
    return { ok: false, error: "Could not update. Is the database connected?" };
  }
}

export async function removeFamilyMember(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deleteSubscriber(id);
    revalidatePath("/admin/families");
    return { ok: true };
  } catch (err) {
    console.error("[removeFamilyMember]", err);
    return { ok: false };
  }
}
