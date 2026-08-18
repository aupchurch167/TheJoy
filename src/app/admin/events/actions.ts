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
import { eventInviteHtml } from "@/lib/email-designs";
import { etWallToInstant, formatEventWhenLong } from "@/lib/event-time";
import { SITE_URL } from "@/lib/site";

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
    const { subject, html } = eventInviteHtml({
      title: ev.title,
      whenText: formatEventWhenLong(ev.starts_at),
      where: ev.location || "Joy Senior Living, Loganville",
      description: ev.description,
      rsvpUrl: `${SITE_URL}/rsvp/${ev.rsvp_token}`,
      kind: input.kind,
      theme: ev.theme,
      isPotluck: ev.is_potluck,
      potluckAsk: ev.potluck_ask,
    });
    const b = await createBroadcast(subject, html, "families", "email", null, null, {
      format: "html_standalone",
      createdBy: email,
    });
    return { ok: true, id: b.id };
  } catch (err) {
    console.error("[createEventEmailDraft]", err);
    return { ok: false, error: "Could not build the email." };
  }
}
