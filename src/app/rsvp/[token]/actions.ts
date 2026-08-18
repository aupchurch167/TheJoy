"use server";

import { z } from "zod";
import { hasDatabase } from "@/lib/db";
import { getEventByToken, upsertRsvp } from "@/lib/events";

const Schema = z.object({
  token: z.string().trim().min(8).max(64),
  name: z.string().trim().min(1, "Please add your name.").max(120),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  response: z.enum(["yes", "no", "maybe"]),
  guests: z.coerce.number().int().min(0).max(20).optional().default(0),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export type RsvpResult =
  | { ok: true; response: "yes" | "no" | "maybe" }
  | { ok: false; error: string };

/** Public RSVP submit. Resolves the event by its token (never exposes ids). */
export async function submitRsvp(input: unknown): Promise<RsvpResult> {
  if (!hasDatabase()) return { ok: false, error: "Sorry, RSVPs are unavailable right now." };
  const parsed = Schema.safeParse(input);
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Please check the form." };
  const d = parsed.data;
  try {
    const event = await getEventByToken(d.token);
    if (!event) return { ok: false, error: "This event could not be found." };
    if (event.status === "cancelled")
      return { ok: false, error: "This event has been cancelled." };
    await upsertRsvp({
      eventId: event.id,
      name: d.name,
      email: d.email || null,
      phone: d.phone || null,
      response: d.response,
      guests: d.response === "yes" ? d.guests : 0,
      note: d.note || null,
    });
    return { ok: true, response: d.response };
  } catch (err) {
    console.error("[submitRsvp]", err);
    return { ok: false, error: "Something went wrong. Please try again." };
  }
}
