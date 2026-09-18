"use client";

import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/admin/ui";
import ConfirmButton from "@/components/admin/ConfirmButton";
import { useToast } from "@/components/admin/Toast";
import PhotoInput from "@/components/admin/PhotoInput";
import {
  deriveDomain,
  isBlockLive,
  LINK_COLORS,
  LINK_STYLES,
  SOCIAL_PLATFORMS,
  newLinkBlock,
  newHeaderBlock,
  newSocialBlock,
  newGalleryBlock,
  newBlogBlock,
  newFormBlock,
  type Block,
  type LinkBlock,
  type LinkInBioContentV2,
  type LinkInBioProfile,
} from "@/lib/linkinbio-shared";
import { saveLinkInBioContent, resetLinkInBioContent } from "./actions";

const FIELD =
  "w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-faint focus:border-clay focus:outline-none focus:ring-2 focus:ring-clay/25";
const SMALL_LABEL = "text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-faint";

// A patch is any single block variant's partial (union so type-specific keys
// like `text`/`items`/`images` are accepted, unlike Partial<Block>).
type BlockPatch =
  | Partial<LinkBlock>
  | Partial<Extract<Block, { type: "header" }>>
  | Partial<Extract<Block, { type: "social" }>>
  | Partial<Extract<Block, { type: "gallery" }>>
  | Partial<Extract<Block, { type: "blog" }>>
  | Partial<Extract<Block, { type: "form" }>>;
type UpdateFn = (id: string, patch: BlockPatch) => void;

export default function LinkInBioForm({
  initial,
  clicks,
}: {
  initial: LinkInBioContentV2;
  clicks: Record<string, number>;
}) {
  const { success, error: toastError } = useToast();
  const [profile, setProfile] = useState<LinkInBioProfile>(initial.profile);
  const [blocks, setBlocks] = useState<Block[]>(initial.blocks);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [copyLabel, setCopyLabel] = useState("Copy");
  const [saving, startSave] = useTransition();
  const dragFrom = useRef<number | null>(null);

  const setProfileKey = (k: keyof LinkInBioProfile, v: string) =>
    setProfile((p) => ({ ...p, [k]: v }));

  const update: UpdateFn = (id, patch) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? ({ ...b, ...patch } as Block) : b)));
  };
  function removeBlock(id: string) {
    setBlocks((bs) => bs.filter((b) => b.id !== id));
  }
  function toggleExpand(id: string) {
    setExpanded((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }
  function move(from: number, to: number) {
    if (from === to || from == null) return;
    setBlocks((bs) => {
      const arr = bs.slice();
      const [m] = arr.splice(from, 1);
      arr.splice(to, 0, m);
      return arr;
    });
  }
  const add = (b: Block) => {
    setBlocks((bs) => [...bs, b]);
    setExpanded((s) => new Set(s).add(b.id));
  };

  function save() {
    startSave(async () => {
      const res = await saveLinkInBioContent({ profile, blocks });
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      setProfile(res.content.profile);
      setBlocks(res.content.blocks);
      success(res.message);
    });
  }
  function reset() {
    startSave(async () => {
      const res = await resetLinkInBioContent();
      if (!res.ok) {
        toastError(res.error);
        return;
      }
      setProfile(res.content.profile);
      setBlocks(res.content.blocks);
      setExpanded(new Set());
      success(res.message);
    });
  }

  function copyUrl() {
    try {
      navigator.clipboard?.writeText("https://www.joyseniorcare.com/links");
    } catch {
      /* ignore */
    }
    setCopyLabel("Copied!");
    setTimeout(() => setCopyLabel("Copy"), 1500);
  }

  const liveBlocks = blocks.filter((b) => isBlockLive(b));

  return (
    <div className="flex flex-wrap items-start gap-7">
      {/* Editor column */}
      <div className="min-w-0 flex-[1_1_540px] space-y-5">
        {/* Copy URL chip */}
        <div className="flex items-center gap-2 self-start rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink-soft">
          <span>joyseniorcare.com/links</span>
          <button
            type="button"
            onClick={copyUrl}
            className="rounded-md bg-surface px-2.5 py-1 text-xs font-semibold text-ink hover:bg-line"
          >
            {copyLabel}
          </button>
        </div>

        {/* Profile card */}
        <div className="space-y-3 rounded-xl border border-line bg-white p-5 shadow-sm">
          <input
            value={profile.name}
            onChange={(e) => setProfileKey("name", e.target.value)}
            placeholder="Display name"
            className="w-full border-none p-0 font-display text-lg font-semibold text-ink outline-none"
          />
          <textarea
            value={profile.bio}
            onChange={(e) => setProfileKey("bio", e.target.value)}
            placeholder="Short bio shown under the name"
            rows={2}
            className={`${FIELD} resize-none`}
          />
          <div className="flex gap-3 border-t border-line pt-3">
            <div className="w-24 flex-none">
              <PhotoInput
                label="Photo (square)"
                url={profile.photoUrl || null}
                onUrl={(u) => setProfileKey("photoUrl", u ?? "")}
                aspectOptions={[{ label: "Square", value: 1 }]}
                filename="links-profile"
              />
            </div>
            <div className="flex-1">
              <label className={SMALL_LABEL}>Caption (optional)</label>
              <input
                value={profile.photoCaption}
                onChange={(e) => setProfileKey("photoCaption", e.target.value)}
                placeholder="e.g. late light on the porch"
                className={`${FIELD} mt-1`}
              />
            </div>
          </div>
        </div>

        {/* Block list */}
        <div className="space-y-3">
          {blocks.map((b, i) => (
            <BlockCard
              key={b.id}
              block={b}
              index={i}
              clicks={clicks[b.id] ?? 0}
              expanded={expanded.has(b.id)}
              onToggle={() => toggleExpand(b.id)}
              onUpdate={update}
              onRemove={() => removeBlock(b.id)}
              onDragStart={() => (dragFrom.current = i)}
              onDrop={() => {
                if (dragFrom.current != null) move(dragFrom.current, i);
                dragFrom.current = null;
              }}
            />
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <AddBtn onClick={() => add(newLinkBlock())}>+ Link</AddBtn>
            <AddBtn onClick={() => add(newHeaderBlock())}>+ Header</AddBtn>
            <AddBtn onClick={() => add(newSocialBlock())}>+ Social icons</AddBtn>
            <AddBtn onClick={() => add(newGalleryBlock())}>+ Gallery</AddBtn>
            <AddBtn onClick={() => add(newFormBlock())}>+ Email signup</AddBtn>
            <AddBtn onClick={() => add(newBlogBlock())}>+ Blog preview</AddBtn>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
          <ConfirmButton
            variant="ghost"
            size="md"
            title="Reset to defaults?"
            message="This replaces every block with the shipped defaults. This cannot be undone."
            confirmLabel="Reset"
            onConfirm={reset}
          >
            Reset to defaults
          </ConfirmButton>
        </div>
      </div>

      {/* Live preview column */}
      <div className="sticky top-8 flex flex-none flex-col items-center gap-3">
        <span className={SMALL_LABEL}>Live preview</span>
        <div className="max-h-[78vh] w-[340px] overflow-y-auto rounded-[20px] border border-line bg-paper shadow-lg">
          <Preview profile={profile} blocks={liveBlocks} />
        </div>
      </div>
    </div>
  );
}

/* --------------------------- block editor card -------------------------- */

function AddBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-[10px] border-[1.5px] border-dashed border-line px-3.5 py-2.5 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-faint hover:text-ink"
    >
      {children}
    </button>
  );
}

const KIND_TAG: Record<string, string> = {
  social: "SOC",
  gallery: "IMG",
  form: "FRM",
  blog: "BLG",
  header: "HDR",
};

function BlockCard({
  block: b,
  index,
  clicks,
  expanded,
  onToggle,
  onUpdate,
  onRemove,
  onDragStart,
  onDrop,
}: {
  block: Block;
  index: number;
  clicks: number;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: UpdateFn;
  onRemove: () => void;
  onDragStart: () => void;
  onDrop: () => void;
}) {
  const stop = (e: React.MouseEvent) => e.stopPropagation();
  const canExpand = b.type !== "header";
  const title =
    b.type === "link"
      ? b.title
      : b.type === "social"
        ? "Social icons row"
        : b.type === "gallery"
          ? "Photo gallery"
          : b.type === "form"
            ? "Email signup form"
            : b.type === "blog"
              ? "From the blog"
              : "";

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onDrop}
      className="rounded-xl border border-line bg-white transition-shadow hover:shadow-sm"
      style={{ opacity: b.active ? 1 : 0.55 }}
    >
      <div
        onClick={canExpand ? onToggle : undefined}
        className={`flex items-center gap-2.5 p-3.5 ${canExpand ? "cursor-pointer" : ""}`}
      >
        <span
          onClick={stop}
          className="flex-none cursor-grab select-none px-2 text-ink-faint"
          title="Drag to reorder"
        >
          ⠿
        </span>

        {b.type === "link" ? (
          <span
            className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-xs font-bold text-white"
            style={{ background: index % 2 ? "#24a332" : "#01a7ce" }}
          >
            {(b.title || "?").trim().charAt(0).toUpperCase() || "?"}
          </span>
        ) : (
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-surface text-[10px] font-bold uppercase text-ink-soft">
            {KIND_TAG[b.type]}
          </span>
        )}

        <div className="min-w-0 flex-1">
          {b.type === "header" ? (
            <input
              value={b.text}
              onClick={stop}
              onChange={(e) => onUpdate(b.id, { text: e.target.value })}
              placeholder="Section heading"
              className="w-full border-none p-0 text-[13px] font-bold uppercase tracking-[0.06em] text-ink outline-none"
            />
          ) : (
            <>
              <div className="truncate text-sm font-semibold text-ink">{title}</div>
              {b.type === "link" && (
                <div className="truncate text-xs text-ink-soft">{b.url || "No link yet"}</div>
              )}
              {b.type === "link" && b.pinned === "tour" && (
                <div className="text-[11px] font-medium text-gold">Tour link (locked to /tour)</div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-none items-center gap-1.5">
          {b.type === "link" && (
            <span className="whitespace-nowrap px-1 text-[11px] text-ink-faint">{clicks} clicks</span>
          )}
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onUpdate(b.id, { active: !b.active });
            }}
            title={b.active ? "Active" : "Hidden"}
            className="relative h-[21px] w-9 flex-none rounded-full transition-colors"
            style={{ background: b.active ? "#01a7ce" : "#d5dadc" }}
          >
            <span
              className="absolute top-0.5 h-[17px] w-[17px] rounded-full bg-white shadow transition-[left]"
              style={{ left: b.active ? "17px" : "2px" }}
            />
          </button>
          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onRemove();
            }}
            className="px-1.5 text-lg text-ink-faint hover:text-danger"
            aria-label="Remove block"
          >
            ×
          </button>
        </div>
      </div>

      {expanded && canExpand && (
        <div onClick={stop} className="flex flex-col gap-3 px-3.5 pb-4 pl-[3.6rem]">
          {b.type === "link" && <LinkFields b={b} onUpdate={onUpdate} />}
          {b.type === "social" && <SocialFields b={b} onUpdate={onUpdate} />}
          {b.type === "gallery" && <GalleryFields b={b} onUpdate={onUpdate} />}
          {b.type === "form" && (
            <>
              <input
                value={b.heading}
                onChange={(e) => onUpdate(b.id, { heading: e.target.value })}
                placeholder="Form heading"
                className={FIELD}
              />
              <textarea
                value={b.blurb}
                onChange={(e) => onUpdate(b.id, { blurb: e.target.value })}
                placeholder="One line under the heading"
                rows={2}
                className={`${FIELD} resize-none`}
              />
            </>
          )}
          {b.type === "blog" && (
            <>
              <input
                value={b.heading}
                onChange={(e) => onUpdate(b.id, { heading: e.target.value })}
                placeholder="Section heading, e.g. From the blog"
                className={FIELD}
              />
              <p className="text-[11.5px] leading-relaxed text-ink-faint">
                Pulls your most recently published post automatically (title, image and
                excerpt aren&rsquo;t set here).
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LinkFields({
  b,
  onUpdate,
}: {
  b: LinkBlock;
  onUpdate: UpdateFn;
}) {
  const set = (patch: Partial<LinkBlock>) => onUpdate(b.id, patch);
  const pinned = b.pinned === "tour";
  const styleBtn = (active: boolean) =>
    `rounded-md border px-2.5 py-1 text-xs font-semibold ${
      active ? "border-ink bg-surface text-ink" : "border-line bg-white text-ink-soft"
    }`;
  return (
    <>
      <input
        value={b.title}
        onChange={(e) => set({ title: e.target.value })}
        placeholder="Link title"
        className={`${FIELD} font-semibold`}
      />
      <input
        value={b.url}
        onChange={(e) => set({ url: e.target.value })}
        placeholder="https://"
        disabled={pinned}
        className={`${FIELD} ${pinned ? "opacity-60" : ""}`}
        title={pinned ? "The tour link is locked to /tour" : undefined}
      />
      <input
        value={b.subtitle}
        onChange={(e) => set({ subtitle: e.target.value })}
        placeholder="Subtitle (optional)"
        className={FIELD}
      />
      <input
        value={b.domain ?? ""}
        onChange={(e) => set({ domain: e.target.value })}
        placeholder="Domain label on the right (optional)"
        className={FIELD}
      />

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-ink-soft">Color:</span>
          {LINK_COLORS.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => set({ color: c.key })}
              className="h-5 w-5 rounded-full"
              style={{
                background: c.hex,
                boxShadow:
                  b.color === c.key
                    ? `0 0 0 2px #fff, 0 0 0 3.5px ${c.hex}`
                    : "0 0 0 1px #e3e7e9",
              }}
              aria-label={c.label}
            />
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-ink-soft">Style:</span>
          {LINK_STYLES.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => set({ style: s.key })}
              className={styleBtn(b.style === s.key)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-1.5 text-xs text-ink-soft">
          <input
            type="checkbox"
            checked={b.showThumb}
            onChange={(e) => set({ showThumb: e.target.checked })}
            className="accent-clay"
          />
          Thumbnail
        </label>
      </div>

      {b.showThumb && (
        <div className="w-20">
          <PhotoInput
            label="Thumbnail"
            url={b.thumbUrl || null}
            onUrl={(u) => set({ thumbUrl: u ?? "" })}
            aspectOptions={[{ label: "Square", value: 1 }]}
            filename="links-thumb"
          />
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <label className="flex flex-col gap-1 text-[11.5px] text-ink-soft">
          Visible from
          <input
            type="date"
            value={b.schedStart ?? ""}
            onChange={(e) => set({ schedStart: e.target.value })}
            className={FIELD}
          />
        </label>
        <label className="flex flex-col gap-1 text-[11.5px] text-ink-soft">
          Visible until
          <input
            type="date"
            value={b.schedEnd ?? ""}
            onChange={(e) => set({ schedEnd: e.target.value })}
            className={FIELD}
          />
        </label>
      </div>
    </>
  );
}

function SocialFields({
  b,
  onUpdate,
}: {
  b: Extract<Block, { type: "social" }>;
  onUpdate: UpdateFn;
}) {
  return (
    <>
      {b.items.map((it) => (
        <div key={it.key} className="flex items-center gap-2.5">
          <label className="flex w-24 flex-none items-center gap-1.5 text-[12.5px] font-semibold text-ink">
            <input
              type="checkbox"
              checked={it.enabled}
              onChange={(e) =>
                onUpdate(b.id, {
                  items: b.items.map((x) =>
                    x.key === it.key ? { ...x, enabled: e.target.checked } : x
                  ),
                })
              }
              className="accent-clay"
            />
            {it.label}
          </label>
          <input
            value={it.url}
            onChange={(e) =>
              onUpdate(b.id, {
                items: b.items.map((x) =>
                  x.key === it.key ? { ...x, url: e.target.value } : x
                ),
              })
            }
            placeholder={it.key === "em" ? "mailto:…" : "https://"}
            className={`${FIELD} flex-1`}
          />
        </div>
      ))}
    </>
  );
}

function GalleryFields({
  b,
  onUpdate,
}: {
  b: Extract<Block, { type: "gallery" }>;
  onUpdate: UpdateFn;
}) {
  return (
    <div className="flex gap-2.5">
      {[0, 1, 2].map((i) => (
        <div key={i} className="w-[72px]">
          <PhotoInput
            label={`Photo ${i + 1}`}
            url={b.images[i] || null}
            onUrl={(u) => {
              const next = [...b.images] as [string, string, string];
              next[i] = u ?? "";
              onUpdate(b.id, { images: next });
            }}
            aspectOptions={[{ label: "Square", value: 1 }]}
            filename="links-gallery"
          />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------- preview -------------------------------- */

function Preview({
  profile,
  blocks,
}: {
  profile: LinkInBioProfile;
  blocks: Block[];
}) {
  const COLOR: Record<string, string> = { blue: "#01a7ce", green: "#24a332" };
  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="text-center">
        <div className="font-display text-lg font-semibold text-ink">{profile.name}</div>
        {profile.bio.trim() && (
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{profile.bio}</div>
        )}
      </div>
      {profile.photoUrl.trim() && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photoUrl} alt="" className="aspect-square w-full rounded-2xl object-cover" />
      )}

      <div className="flex flex-col gap-3">
        {blocks.length === 0 && (
          <p className="py-6 text-center text-xs text-ink-faint">No visible blocks yet</p>
        )}
        {blocks.map((b) => {
          if (b.type === "link") {
            const hex = COLOR[b.color] ?? COLOR.blue;
            if (b.style === "plain") {
              const domain = b.domain?.trim() || deriveDomain(b.url);
              return (
                <div
                  key={b.id}
                  className="flex items-center justify-between gap-2 border-b border-line py-2.5 text-ink"
                >
                  <div className="min-w-0">
                    <div className="truncate text-[13.5px] font-semibold">{b.title}</div>
                    {b.subtitle.trim() && (
                      <div className="truncate text-[11.5px] text-ink-soft">{b.subtitle}</div>
                    )}
                  </div>
                  {domain && (
                    <span className="flex-none font-mono text-[10.5px]" style={{ color: hex }}>
                      {domain}
                    </span>
                  )}
                </div>
              );
            }
            const pill =
              b.style === "filled"
                ? { background: hex, color: "#fff" }
                : { background: "#fff", color: hex, border: `1.5px solid ${hex}` };
            return (
              <div
                key={b.id}
                className="flex min-h-[44px] items-center justify-center rounded-2xl px-4 text-center text-[14px] font-semibold"
                style={pill}
              >
                {b.title}
              </div>
            );
          }
          if (b.type === "header")
            return (
              <div key={b.id} className="border-t border-line pt-3">
                <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                  {b.text}
                </div>
              </div>
            );
          if (b.type === "social") {
            const items = b.items.filter((it) => it.enabled && it.url.trim());
            if (!items.length) return null;
            return (
              <div key={b.id} className="flex justify-center gap-3">
                {items.map((it) => (
                  <div
                    key={it.key}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-clay font-serif text-sm font-bold text-white"
                  >
                    {SOCIAL_PLATFORMS.find((p) => p.key === it.key)?.glyph ?? "•"}
                  </div>
                ))}
              </div>
            );
          }
          if (b.type === "gallery") {
            const imgs = b.images.filter((u) => u.trim());
            if (!imgs.length) return null;
            return (
              <div key={b.id} className="flex gap-2">
                {imgs.map((u, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={i} src={u} alt="" className="h-[70px] flex-1 rounded-lg object-cover" />
                ))}
              </div>
            );
          }
          if (b.type === "blog")
            return (
              <div key={b.id}>
                <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-faint">
                  {b.heading}
                </div>
                <div className="rounded-xl border border-line bg-white p-3 text-[12px] text-ink-faint">
                  Your latest published post appears here.
                </div>
              </div>
            );
          // form
          return (
            <div key={b.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="font-display text-[15px] font-semibold text-ink">{b.heading}</div>
              <div className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">{b.blurb}</div>
              <div className="mt-3 h-8 rounded-full bg-clay" />
            </div>
          );
        })}
      </div>
    </div>
  );
}
