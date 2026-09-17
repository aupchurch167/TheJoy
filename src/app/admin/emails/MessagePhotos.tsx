"use client";

import PhotoInput from "@/components/admin/PhotoInput";

/**
 * Edit the list of photos shown inside an email body. Each photo is a
 * PhotoInput (upload / edit / remove); an always-empty slot at the end adds
 * another. One photo renders full width in the email; two or more render as a
 * two-per-row grid (see renderEmailModel).
 */
export default function MessagePhotos({
  urls,
  onChange,
  max = 12,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}) {
  function setAt(i: number, u: string | null) {
    const next = [...urls];
    if (u) next[i] = u;
    else next.splice(i, 1); // clearing a slot removes it
    onChange(next);
  }

  return (
    <div className="space-y-2">
      <span className="block text-[11px] font-semibold text-ink-soft">
        Photos in the message
      </span>
      {urls.map((u, i) => (
        <PhotoInput
          key={i}
          label={`Photo ${i + 1}`}
          url={u}
          onUrl={(nu) => setAt(i, nu)}
          allowFree
          aspectOptions={[
            { label: "Wide", value: 16 / 9 },
            { label: "Square", value: 1 },
          ]}
          filename="email-photo"
        />
      ))}
      {urls.length < max && (
        <PhotoInput
          // Empty adder: on upload, append to the list; it stays empty for the next.
          label={urls.length === 0 ? "Add a photo" : "Add another photo"}
          url={null}
          onUrl={(nu) => nu && onChange([...urls, nu])}
          allowFree
          aspectOptions={[
            { label: "Wide", value: 16 / 9 },
            { label: "Square", value: 1 },
          ]}
          filename="email-photo"
        />
      )}
      {urls.length > 1 && (
        <p className="text-[11px] text-ink-faint">
          Two or more photos show two per row in the email.
        </p>
      )}
    </div>
  );
}
