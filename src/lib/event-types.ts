import type { BadgeTone } from "@/components/admin/ui";

/**
 * Event categories (who an event is for). Pure/client-safe so the studio form,
 * the events list, and the RSVP page can share it; lib/events.ts stores the key.
 */

export const EVENT_TYPES = [
  { value: "friends_family", label: "Friends & Family" },
  { value: "community", label: "Partner & Community" },
  { value: "public", label: "Public / Open house" },
  { value: "staff", label: "Staff & Team" },
  { value: "other", label: "Other" },
] as const;

export type EventType = (typeof EVENT_TYPES)[number]["value"];

export const DEFAULT_EVENT_TYPE: EventType = "friends_family";

export const EVENT_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  EVENT_TYPES.map((t) => [t.value, t.label])
);

export const EVENT_TYPE_TONE: Record<string, BadgeTone> = {
  friends_family: "info",
  community: "violet",
  public: "success",
  staff: "warning",
  other: "neutral",
};

/** Label for a stored key, tolerating unknown/legacy values. */
export function eventTypeLabel(value: string | null | undefined): string {
  if (!value) return EVENT_TYPE_LABEL[DEFAULT_EVENT_TYPE];
  return EVENT_TYPE_LABEL[value] ?? "Other";
}
