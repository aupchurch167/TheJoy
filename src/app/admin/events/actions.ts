"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/require-admin";
import {
  createEvent,
  updateEvent,
  deleteEvent,
  getEventById,
  deleteRsvp,
} from "@/lib/events";
import { createBroadcast } from "@/lib/broadcasts";
import {
  renderEmailModel,
  type EmailModel,
  type EmailTheme,
} from "@/lib/email-model";
import { etWallToInstant, formatEventWhenLong } from "@/lib/event-time";
import { SITE_URL } from "@/lib/site";
import type { EventRow } from "@/lib/events";

const EventSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "A title is required.").max(160),
  description: z.string().trim().max(4000).optional().default(""),
  location: z.string().trim().max(200).optional().default(""),
  startsAt: z.string().trim().optional().default(""),
  endsAt: z.string().trim().optional().default(""),
  capacity: z.coerce.number().int().min(0).max(100000).optional(),
  status: z.enum(["draft", "published", "cancelled"]).default("draft"),
  theme: z.enum(["classic", "festive", "seasonal", "garden", "elegant"]).default("classic"),
  isPotluck: z.boolean().optional().default(false),
  potluckAsk: z.string().trim().max(300).optional().default(""),
});

export type EventSaveResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

export async function saveEvent(input: unknown): Promise<EventSaveResult> {
  const { email } = await requireAdmin();
  const parsed = EventSchema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." };
  const d = parsed.data;
  const payload = {
    title: d.title,
    description: d.description,
    location: d.location || null,
    startsAt: etWallToInstant(d.startsAt),
    endsAt: etWallToInstant(d.endsAt),
    capacity: d.capacity ?? null,
    status: d.status,
    theme: d.theme,
    isPotluck: d.isPotluck,
    potluckAsk: d.isPotluck ? d.potluckAsk : null,
  };
  try {
    const ev = d.id ? await updateEvent(d.id, payload) : await createEvent(payload, email);
    if (!ev) return { ok: false, error: "Event not found." };
    revalidatePath("/admin/events");
    revalidatePath(`/admin/events/${ev.id}`);
    return { ok: true, id: ev.id };
  } catch (err) {
    console.error("[saveEvent]", err);
    return { ok: false, error: "Could not save. Is the database connected?" };
  }
}

export async function removeEvent(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deleteEvent(id);
    revalidatePath("/admin/events");
    return { ok: true };
  } catch (err) {
    console.error("[removeEvent]", err);
    return { ok: false };
  }
}

export async function removeRsvp(id: string): Promise<{ ok: boolean }> {
  await requireAdmin();
  try {
    await deleteRsvp(id);
    revalidatePath("/admin/events");
    return { ok: true };
  } catch (err) {
    console.error("[removeRsvp]", err);
    return { ok: false };
  }
}

/**
 * Build an invite / reminder / update email for an event as a ready-to-send
 * draft broadcast (standalone HTML with the RSVP link), then hand off to the
 * email composer to choose recipients and send. Reuses the throttled, deduped,
 * suppression-aware send pipeline.
 */
export async function createEventEmailDraft(input: {
  eventId: string;
  kind: "invite" | "reminder" | "update";
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const { email } = await requireAdmin();
  try {
    const ev = await getEventById(input.eventId);
    if (!ev) return { ok: false, error: "Event not found." };
    const { subject, model } = eventEmailModel(ev, input.kind);
    const b = await createBroadcast(
      subject,
      renderEmailModel(model),
      "families",
      "email",
      null,
      null,
      { format: "html_standalone", createdBy: email, modelJson: model, priority: true }
    );
    return { ok: true, id: b.id };
  } catch (err) {
    console.error("[createEventEmailDraft]", err);
    return { ok: false, error: "Could not build the email." };
  }
}

/**
 * Turn an event into a studio EmailModel (words + theme + a details card + the
 * RSVP button), so "Send the invite" opens the same canvas-first studio as any
 * other email, with the look and copy fully editable before it goes out.
 */
function eventEmailModel(
  ev: EventRow,
  kind: "invite" | "reminder" | "update"
): { subject: string; model: EmailModel } {
  const subject =
    kind === "reminder"
      ? `Reminder: ${ev.title}`
      : kind === "update"
        ? `Update: ${ev.title}`
        : `You're invited: ${ev.title}`;
  const eyebrow =
    kind === "reminder" ? "A friendly reminder" : kind === "update" ? "An update" : "";
  const lead =
    kind === "reminder"
      ? "Just a reminder that this is coming up. We would still love to see you."
      : kind === "update"
        ? "A quick update about this gathering."
        : "We would love for you to join us.";

  const parts = [lead];
  if (ev.description.trim()) parts.push(ev.description.trim());
  if (ev.is_potluck) {
    parts.push(
      `This one is a potluck. ${ev.potluck_ask?.trim() || "Bring a dish to share if you'd like (there will be plenty either way)."}`
    );
  }

  const themeIds: EmailTheme[] = ["classic", "festive", "seasonal", "garden", "elegant"];
  const theme = (themeIds as string[]).includes(ev.theme)
    ? (ev.theme as EmailTheme)
    : "classic";

  const model: EmailModel = {
    theme,
    eyebrow,
    heroTitle: ev.title,
    heroSub: "",
    greeting: "Hi {{first_name}},",
    intro: parts.join("\n\n"),
    plan: {
      label: "The details",
      when: formatEventWhenLong(ev.starts_at),
      where: ev.location || "Joy Senior Living, Loganville",
      treats: "",
    },
    rsvpUrl: `${SITE_URL}/rsvp/${ev.rsvp_token}`,
    photoUrl: null,
    closing: "Warmly,\nMellissa Daniel and the team at Joy Senior Living",
  };
  return { subject, model };
}
