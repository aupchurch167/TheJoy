"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  insertFamilyMember,
  deleteSubscriber,
  familyEmailExists,
} from "@/lib/leads";

const AddSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120),
  email: z.string().trim().email("Enter a valid email.").max(200),
  // Opt-in confirmation: adding a family member requires their permission.
  optIn: z.boolean().refine((v) => v === true, {
    message: "Please confirm this person agreed to receive Joy emails.",
  }),
});

export type FamilyResult = { ok: true } | { ok: false; error: string };

export async function addFamilyMember(input: unknown): Promise<FamilyResult> {
  await requireAdmin();
  const parsed = AddSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  }
  try {
    if (await familyEmailExists(parsed.data.email)) {
      return { ok: false, error: "That email is already on the family list." };
    }
    await insertFamilyMember(parsed.data.name, parsed.data.email);
    revalidatePath("/admin/families");
    return { ok: true };
  } catch (err) {
    console.error("[addFamilyMember]", err);
    return { ok: false, error: "Could not add. Is the database connected?" };
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
