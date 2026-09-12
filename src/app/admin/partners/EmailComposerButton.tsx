"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button, Field, Input, Textarea } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import SlideOver from "./SlideOver";
import { sendPartnerEmailAction } from "./actions";
import type { Partner } from "@/lib/partners";
import { BUSINESS } from "@/lib/site";

type Attachment = { filename: string; content: string; size: number };

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB per file

function readAsBase64(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result);
      resolve({
        filename: file.name,
        content: result.split(",")[1] ?? "",
        size: file.size,
      });
    };
    reader.onerror = () => reject(new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

function prettySize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function EmailComposerButton({ partner }: { partner: Partner }) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();

  const first = (partner.contact_name || "").trim().split(/\s+/)[0] || "there";
  const [subject, setSubject] = useState(
    `Referral information from ${BUSINESS.name}`
  );
  const [body, setBody] = useState(
    [
      `Hi ${first},`,
      ``,
      `Thank you for thinking of us. Attached is what you need to refer to The Joy, a small personal care home in Loganville (24 private suites, personal care, memory care, and respite).`,
      ``,
      `If you have someone in mind, call or text Mellissa at ${BUSINESS.phone} and we can do a same-day assessment, bedside when needed.`,
      ``,
      `Warmly,`,
      `The Joy Senior Living team`,
    ].join("\n")
  );
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const disabledTrigger = !partner.email;

  async function onPickFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-picking the same file
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        toastError(`${f.name} is larger than 5 MB and was skipped.`);
        continue;
      }
      if (attachments.length >= 6) {
        toastError("Up to 6 attachments.");
        break;
      }
      try {
        const att = await readAsBase64(f);
        setAttachments((list) => [...list, att]);
      } catch {
        toastError(`Could not read ${f.name}.`);
      }
    }
  }

  function removeAttachment(i: number) {
    setAttachments((list) => list.filter((_, idx) => idx !== i));
  }

  function send() {
    if (!partner.email) {
      toastError("This partner has no email address.");
      return;
    }
    if (!subject.trim()) {
      toastError("Add a subject.");
      return;
    }
    start(async () => {
      const res = await sendPartnerEmailAction({
        partnerId: partner.id,
        to: partner.email,
        subject,
        body,
        attachments: attachments.map((a) => ({
          filename: a.filename,
          content: a.content,
        })),
      });
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      success("Email sent and logged.");
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        disabled={disabledTrigger}
        title={disabledTrigger ? "No email on file for this partner" : undefined}
      >
        Email
      </Button>

      <SlideOver
        open={open}
        onClose={() => setOpen(false)}
        title={`Email ${partner.organization}`}
        description="This sends now and logs automatically as an Email touch."
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={send} disabled={pending}>
              {pending ? "Sending…" : "Send email"}
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <Field label="To">
            <div className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink">
              <span className="font-medium">
                {partner.contact_name || partner.organization}
              </span>
              <span className="text-ink-faint">{partner.email}</span>
            </div>
          </Field>

          <Field label="Subject">
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
          </Field>

          <Field label="Message" hint="Markdown supported.">
            <Textarea
              rows={9}
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>

          <div>
            <p className="mb-2 text-sm font-medium text-ink">Attachments</p>
            <div className="space-y-2">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-lg border border-line bg-white px-3 py-2"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface text-[10px] font-bold uppercase text-ink-soft">
                    {a.filename.split(".").pop()?.slice(0, 4) || "FILE"}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-ink">
                    {a.filename}
                  </span>
                  <span className="shrink-0 text-xs text-ink-faint">
                    {prettySize(a.size)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(i)}
                    className="shrink-0 text-ink-faint hover:text-danger"
                    aria-label={`Remove ${a.filename}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-line px-3 py-2.5 text-sm font-medium text-ink-soft transition-colors hover:border-clay hover:text-clay"
            >
              + Add attachment
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              className="hidden"
              onChange={onPickFiles}
            />
          </div>
        </div>
      </SlideOver>
    </>
  );
}
