"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  insertFamilyMember,
  deleteSubscriber,
  familyEmailExists,
  setFamilyActive,
} from "@/lib/leads";

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
    });
    revalidatePath("/admin/families");
    return { ok: true };
  } catch (err) {
    console.error("[addFamilyMember]", err);
    return { ok: false, error: "Could not add. Is the database connected?" };
  }
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
