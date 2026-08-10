/**
 * Resolve the leads-page date filter from raw query params into concrete ISO
 * bounds + a human label. A custom from/to wins; otherwise a preset (7d / 30d /
 * 90d) or "all". Server-only usage (uses new Date()); never import into a
 * Workflow script.
 */

export type RangeKey = "all" | "7d" | "30d" | "90d" | "custom";

export type ResolvedRange = {
  key: RangeKey;
  from: string | null; // ISO timestamp or null (unbounded)
  to: string | null; // ISO timestamp or null (unbounded)
  label: string;
};

const DAY_MS = 86_400_000;

function fmt(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function resolveRange(sp: {
  range?: string;
  from?: string;
  to?: string;
}): ResolvedRange {
  const now = new Date();

  // A custom range (either bound present and valid) takes precedence.
  const rawFrom = (sp.from || "").trim();
  const rawTo = (sp.to || "").trim();
  if (rawFrom || rawTo) {
    const f = rawFrom ? new Date(`${rawFrom}T00:00:00`) : null;
    const t = rawTo ? new Date(`${rawTo}T23:59:59.999`) : null;
    const fOk = f && !Number.isNaN(f.getTime());
    const tOk = t && !Number.isNaN(t.getTime());
    return {
      key: "custom",
      from: fOk ? f!.toISOString() : null,
      to: tOk ? t!.toISOString() : null,
      label:
        fOk && tOk
          ? `${fmt(f!)} – ${fmt(t!)}`
          : fOk
            ? `Since ${fmt(f!)}`
            : tOk
              ? `Through ${fmt(t!)}`
              : "All time",
    };
  }

  const days =
    sp.range === "7d" ? 7 : sp.range === "30d" ? 30 : sp.range === "90d" ? 90 : 0;
  if (days > 0) {
    const from = new Date(now.getTime() - days * DAY_MS);
    return {
      key: `${days}d` as RangeKey,
      from: from.toISOString(),
      to: null,
      label: `Last ${days} days`,
    };
  }

  return { key: "all", from: null, to: null, label: "All time" };
}
