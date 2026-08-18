"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, Input, Textarea, Select, Button } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import { saveEvent, removeEvent } from "./actions";
import type { EventRow } from "@/lib/events";
import { toEtLocalInput } from "@/lib/event-time";

export default function EventEditor({ event }: { event?: EventRow | null }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  const [title, setTitle] = useState(event?.title ?? "");
  const [description, setDescription] = useState(event?.description ?? "");
  const [location, setLocation] = useState(
    event?.location ?? "Joy Senior Living, Loganville"
  );
  const [startsAt, setStartsAt] = useState(toEtLocalInput(event?.starts_at ?? null));
  const [endsAt, setEndsAt] = useState(toEtLocalInput(event?.ends_at ?? null));
  const [capacity, setCapacity] = useState(
    event?.capacity != null ? String(event.capacity) : ""
  );
  const [status, setStatus] = useState(event?.status ?? "draft");

  function onSave() {
    setError("");
    start(async () => {
      const res = await saveEvent({
        id: event?.id,
        title,
        description,
        location,
        startsAt,
        endsAt,
        capacity: capacity === "" ? undefined : Number(capacity),
        status,
      });
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success("Event saved.");
      if (!event) router.replace(`/admin/events/${res.id}`);
      else router.refresh();
    });
  }

  async function onDelete() {
    if (!event) return;
    const res = await removeEvent(event.id);
    if (res.ok) {
      success("Event deleted.");
      router.push("/admin/events");
    } else {
      toastError("Could not delete the event.");
    }
  }

  return (
    <Card>
      {error && (
        <p role="alert" className="mb-4 rounded-lg border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm font-medium text-danger">
          {error}
        </p>
      )}
      <div className="grid gap-4">
        <Field label="Event title" htmlFor="ev-title" required>
          <Input
            id="ev-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Caregiver support group"
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Starts" htmlFor="ev-start" hint="Eastern time.">
            <Input
              id="ev-start"
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
            />
          </Field>
          <Field label="Ends (optional)" htmlFor="ev-end">
            <Input
              id="ev-end"
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Location" htmlFor="ev-loc">
            <Input
              id="ev-loc"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Joy Senior Living, Loganville"
            />
          </Field>
          <Field
            label="Capacity (optional)"
            htmlFor="ev-cap"
            hint="Leave blank for no limit."
          >
            <Input
              id="ev-cap"
              type="number"
              min={0}
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="e.g. 30"
            />
          </Field>
        </div>

        <Field
          label="Description"
          htmlFor="ev-desc"
          hint="What to expect. Shown on the invite and the RSVP page."
        >
          <Textarea
            id="ev-desc"
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Join us for coffee and a relaxed conversation with other families. No pressure, just company."
          />
        </Field>

        <Field label="Status" htmlFor="ev-status">
          <Select
            id="ev-status"
            value={status}
            onChange={(e) => setStatus(e.target.value as EventRow["status"])}
            className="sm:max-w-xs"
          >
            <option value="draft">Draft (not sent yet)</option>
            <option value="published">Published (invites out)</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Field>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Button onClick={onSave} disabled={pending}>
            {pending ? "Saving…" : event ? "Save changes" : "Create event"}
          </Button>
          {event && (
            <ConfirmButton
              variant="ghost"
              size="sm"
              title="Delete this event?"
              message="This permanently removes the event and its RSVPs."
              confirmLabel="Delete event"
              onConfirm={onDelete}
            >
              Delete
            </ConfirmButton>
          )}
        </div>
      </div>
    </Card>
  );
}
