"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, Field, Input, Button, SectionLabel } from "@/components/admin/ui";
import { useToast } from "@/components/admin/Toast";
import type { LinkInBioContent } from "@/lib/linkinbio";
import { saveLinkInBioContent, resetLinkInBioContent } from "./actions";

type FlatKey =
  | "siteLabel"
  | "siteHref"
  | "tourLabel"
  | "callLabel"
  | "callHref"
  | "dirLabel"
  | "dirHref"
  | "photoUrl"
  | "photoCaption"
  | "blogHeading"
  | "formHeading"
  | "formBlurb"
  | "footAddress"
  | "footPhone";

type BoolKey = "showBlog" | "showForm";

export default function LinkInBioForm({
  initial,
}: {
  initial: LinkInBioContent;
}) {
  const router = useRouter();
  const { success, error: toastError } = useToast();
  const [c, setC] = useState<LinkInBioContent>(initial);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const setFlat = (key: FlatKey, value: string) =>
    setC((prev) => ({ ...prev, [key]: value }));

  const setBool = (key: BoolKey, value: boolean) =>
    setC((prev) => ({ ...prev, [key]: value }));

  const setRow = (
    group: "trust" | "community",
    i: number,
    key: keyof LinkInBioContent["trust"][number],
    value: string
  ) =>
    setC((prev) => {
      const rows = prev[group].map((r, idx) =>
        idx === i ? { ...r, [key]: value } : r
      );
      return { ...prev, [group]: rows };
    });

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    start(async () => {
      const res = await saveLinkInBioContent(c);
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      success(res.message);
      router.refresh();
    });
  }

  function onReset() {
    if (!confirm("Reset the links page to the shipped defaults?")) return;
    setError("");
    start(async () => {
      const res = await resetLinkInBioContent();
      if (!res.ok) {
        setError(res.error);
        toastError(res.error);
        return;
      }
      setC(res.content);
      success(res.message);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSave} className="grid gap-5">
      {/* Website link */}
      <Card>
        <SectionLabel>Website link</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          Sits above the buttons, quieter on purpose. The small domain is
          pulled from the URL automatically.
        </p>
        <div className="grid gap-4">
          <Field label="Link text" htmlFor="lib-siteLabel">
            <Input
              id="lib-siteLabel"
              value={c.siteLabel}
              onChange={(e) => setFlat("siteLabel", e.target.value)}
            />
          </Field>
          <Field label="URL" htmlFor="lib-siteHref">
            <Input
              id="lib-siteHref"
              value={c.siteHref}
              onChange={(e) => setFlat("siteHref", e.target.value)}
              placeholder="https://…"
            />
          </Field>
        </div>
      </Card>

      {/* Primary buttons */}
      <Card>
        <SectionLabel>Primary buttons</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          The three big taps. Keep labels short. The tour button always goes to
          the site&rsquo;s tour page (one tour path), so only its label is
          editable.
        </p>
        <div className="grid gap-4">
          <Field label="Tour button label" htmlFor="lib-tourLabel">
            <Input
              id="lib-tourLabel"
              value={c.tourLabel}
              onChange={(e) => setFlat("tourLabel", e.target.value)}
            />
          </Field>
          <Field label="Call button label" htmlFor="lib-callLabel">
            <Input
              id="lib-callLabel"
              value={c.callLabel}
              onChange={(e) => setFlat("callLabel", e.target.value)}
            />
          </Field>
          <Field
            label="Call link"
            htmlFor="lib-callHref"
            hint="A tel: link, e.g. tel:+14706843569"
          >
            <Input
              id="lib-callHref"
              value={c.callHref}
              onChange={(e) => setFlat("callHref", e.target.value)}
              placeholder="tel:+1…"
            />
          </Field>
          <Field label="Directions button label" htmlFor="lib-dirLabel">
            <Input
              id="lib-dirLabel"
              value={c.dirLabel}
              onChange={(e) => setFlat("dirLabel", e.target.value)}
            />
          </Field>
          <Field label="Directions link" htmlFor="lib-dirHref">
            <Input
              id="lib-dirHref"
              value={c.dirHref}
              onChange={(e) => setFlat("dirHref", e.target.value)}
              placeholder="https://maps.google.com/…"
            />
          </Field>
        </div>
      </Card>

      {/* Photo */}
      <Card>
        <SectionLabel>Photo (optional)</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          One candid photo from the house. Leave the URL blank to ship without a
          photo (never a stock image).
        </p>
        <div className="grid gap-4">
          <Field
            label="Photo URL"
            htmlFor="lib-photoUrl"
            hint="Paste an uploaded image URL. Blank hides the photo block."
          >
            <Input
              id="lib-photoUrl"
              value={c.photoUrl}
              onChange={(e) => setFlat("photoUrl", e.target.value)}
              placeholder="https://…"
            />
          </Field>
          <Field label="Photo caption" htmlFor="lib-photoCaption">
            <Input
              id="lib-photoCaption"
              value={c.photoCaption}
              onChange={(e) => setFlat("photoCaption", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Trust links */}
      <Card>
        <SectionLabel>Trust links</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          Three links with a one-line note each. Leave a URL blank to hide that
          row.
        </p>
        <div className="grid gap-6">
          {c.trust.map((row, i) => (
            <div key={i} className="grid gap-4 border-t border-line pt-5 first:border-0 first:pt-0">
              <Field label={`Link ${i + 1} text`} htmlFor={`lib-trust-${i}-label`}>
                <Input
                  id={`lib-trust-${i}-label`}
                  value={row.label}
                  onChange={(e) => setRow("trust", i, "label", e.target.value)}
                />
              </Field>
              <Field label={`Link ${i + 1} note`} htmlFor={`lib-trust-${i}-note`}>
                <Input
                  id={`lib-trust-${i}-note`}
                  value={row.note}
                  onChange={(e) => setRow("trust", i, "note", e.target.value)}
                />
              </Field>
              <Field label={`Link ${i + 1} URL`} htmlFor={`lib-trust-${i}-href`}>
                <Input
                  id={`lib-trust-${i}-href`}
                  value={row.href}
                  onChange={(e) => setRow("trust", i, "href", e.target.value)}
                  placeholder="https://… or /page"
                />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      {/* Community links */}
      <Card>
        <SectionLabel>Community links</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          Plainest treatment. Notes are optional. Leave a URL blank to hide that
          row.
        </p>
        <div className="grid gap-6">
          {c.community.map((row, i) => (
            <div key={i} className="grid gap-4 border-t border-line pt-5 first:border-0 first:pt-0">
              <Field label={`Link ${i + 1} text`} htmlFor={`lib-comm-${i}-label`}>
                <Input
                  id={`lib-comm-${i}-label`}
                  value={row.label}
                  onChange={(e) => setRow("community", i, "label", e.target.value)}
                />
              </Field>
              <Field label={`Link ${i + 1} note`} htmlFor={`lib-comm-${i}-note`}>
                <Input
                  id={`lib-comm-${i}-note`}
                  value={row.note}
                  onChange={(e) => setRow("community", i, "note", e.target.value)}
                />
              </Field>
              <Field label={`Link ${i + 1} URL`} htmlFor={`lib-comm-${i}-href`}>
                <Input
                  id={`lib-comm-${i}-href`}
                  value={row.href}
                  onChange={(e) => setRow("community", i, "href", e.target.value)}
                  placeholder="https://… or /page"
                />
              </Field>
            </div>
          ))}
        </div>
      </Card>

      {/* Blog preview */}
      <Card>
        <SectionLabel>Blog preview</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          Shows a card for your most recent published post. It updates on its
          own as you publish (hidden when there are no posts yet).
        </p>
        <div className="grid gap-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={c.showBlog}
              onChange={(e) => setBool("showBlog", e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-line text-clay focus:ring-clay/30"
            />
            <span className="text-sm font-medium text-ink">
              Show the latest post
            </span>
          </label>
          <Field label="Section heading" htmlFor="lib-blogHeading">
            <Input
              id="lib-blogHeading"
              value={c.blogHeading}
              onChange={(e) => setFlat("blogHeading", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Quick form */}
      <Card>
        <SectionLabel>Quick form</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          A short contact form at the bottom. Submissions land in Leads (tagged
          &ldquo;links&rdquo;), same as the rest of the site.
        </p>
        <div className="grid gap-4">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={c.showForm}
              onChange={(e) => setBool("showForm", e.target.checked)}
              className="mt-0.5 h-5 w-5 rounded border-line text-clay focus:ring-clay/30"
            />
            <span className="text-sm font-medium text-ink">Show the form</span>
          </label>
          <Field label="Form heading" htmlFor="lib-formHeading">
            <Input
              id="lib-formHeading"
              value={c.formHeading}
              onChange={(e) => setFlat("formHeading", e.target.value)}
            />
          </Field>
          <Field label="Form blurb" htmlFor="lib-formBlurb">
            <Input
              id="lib-formBlurb"
              value={c.formBlurb}
              onChange={(e) => setFlat("formBlurb", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {/* Footer */}
      <Card>
        <SectionLabel>Footer</SectionLabel>
        <p className="mt-1 mb-4 text-sm text-ink-soft">
          The license line (&ldquo;Licensed personal care home, State of
          Georgia.&rdquo;) is fixed and cannot be edited.
        </p>
        <div className="grid gap-4">
          <Field label="Address" htmlFor="lib-footAddress">
            <Input
              id="lib-footAddress"
              value={c.footAddress}
              onChange={(e) => setFlat("footAddress", e.target.value)}
            />
          </Field>
          <Field label="Phone" htmlFor="lib-footPhone">
            <Input
              id="lib-footPhone"
              value={c.footPhone}
              onChange={(e) => setFlat("footPhone", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {error && (
        <p className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center gap-4 border-t border-line pt-5">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <button
          type="button"
          onClick={onReset}
          disabled={pending}
          className="text-sm font-medium text-ink-faint underline underline-offset-2 hover:text-clay disabled:opacity-50"
        >
          Reset to defaults
        </button>
      </div>
    </form>
  );
}
