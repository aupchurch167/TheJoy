/**
 * Structured email model + theme renderer for the studio composer. The email is
 * kept as CONTENT FIELDS (headline, greeting, intro, an optional details plan,
 * closing) plus a THEME. Swapping the theme re-skins the exact same words, never
 * regenerates them. renderEmailModel() turns a model into a complete, email-safe
 * standalone HTML document (sent as body_format 'html_standalone'), so the Joy
 * letter shell is not layered on top.
 *
 * {{first_name}} is preserved for per-recipient merge at send time, and the
 * footer carries {{unsubscribe_url}} (filled per recipient), so every render is
 * a valid, unsubscribable email.
 */

import { seasonalMonth, seasonalMonthName } from "./seasonal";

export { seasonalMonthName };

export type EmailTheme =
  | "festive"
  | "classic"
  | "seasonal"
  | "garden"
  | "elegant"
  | "photo"
  | "plain";

export const EMAIL_THEMES: { id: EmailTheme; label: string }[] = [
  { id: "festive", label: "Festive" },
  { id: "classic", label: "Joy classic" },
  { id: "seasonal", label: "Seasonal" },
  { id: "garden", label: "Garden party" },
  { id: "elegant", label: "Elegant" },
  { id: "photo", label: "Photo hero" },
  { id: "plain", label: "Plain letter" },
];

export type EmailPlan = {
  label?: string;
  when?: string;
  where?: string;
  treats?: string;
};

export type EmailModel = {
  theme: EmailTheme;
  /** Small caps line above the headline (theme supplies a default when blank). */
  eyebrow?: string;
  heroTitle?: string;
  heroSub?: string;
  greeting: string;
  intro: string;
  plan?: EmailPlan | null;
  /** When set, an RSVP button linking here is shown under the body. */
  rsvpUrl?: string | null;
  /** Photo-hero image URL (photo theme). */
  photoUrl?: string | null;
  /** Multi-line closing / sign-off (use \n for line breaks). */
  closing: string;
};

/* ------------------------------------------------------------------ */
/* Palettes                                                            */
/* ------------------------------------------------------------------ */

type Palette = {
  page: string; // outer page background
  hero: string; // hero band background
  heroEyebrow: string; // eyebrow text on hero
  heroSub: string; // subtitle text on hero
  eyebrow: string; // default eyebrow text
  planBg: string;
  planBorder: string;
  planLabel: string;
  planLabelColor: string;
  a1: string; // When accent
  a2: string; // Where accent
  a3: string; // Treats accent
  confetti: boolean; // festive confetti + bunting strips
  hero_on: boolean; // false for plain letter (no hero band)
};

function palette(theme: EmailTheme): Palette {
  switch (theme) {
    case "festive":
      return {
        page: "#fdf6ec", hero: "#e85d75", heroEyebrow: "#ffd9e0", heroSub: "#ffe9ed",
        eyebrow: "💙 You're invited 💙", planBg: "#fff6e3", planBorder: "2px dashed #f7b32b",
        planLabel: "🎊 The party plan 🎊", planLabelColor: "#c98a2c",
        a1: "#e85d75", a2: "#4ea5a2", a3: "#9b6bc9", confetti: true, hero_on: true,
      };
    case "garden":
      return {
        page: "#f3f8f3", hero: "#1c7f27", heroEyebrow: "#c9ecc9", heroSub: "#dff3df",
        eyebrow: "🌿 You're invited 🌿", planBg: "#eef6ee", planBorder: "1px dashed #8fd096",
        planLabel: "🌼 The garden plan 🌼", planLabelColor: "#1c7f27",
        a1: "#1c7f27", a2: "#5faa61", a3: "#b7791f", confetti: false, hero_on: true,
      };
    case "elegant":
      return {
        page: "#f2f4f5", hero: "#123a44", heroEyebrow: "#d8bd8a", heroSub: "#c3d2d6",
        eyebrow: "✦ An invitation ✦", planBg: "#f5f2ea", planBorder: "1px solid #d8c9a3",
        planLabel: "The particulars", planLabelColor: "#96731f",
        a1: "#123a44", a2: "#123a44", a3: "#96731f", confetti: false, hero_on: true,
      };
    case "plain":
      return {
        page: "#fbf9f5", hero: "#017391", heroEyebrow: "#bfe3ee", heroSub: "#cfe9f2",
        eyebrow: "", planBg: "#f7f4ec", planBorder: "1px solid #e8e2d2",
        planLabel: "The details", planLabelColor: "#8a6217",
        a1: "#55555f", a2: "#55555f", a3: "#55555f", confetti: false, hero_on: false,
      };
    case "seasonal": {
      const m = seasonalMonth();
      return {
        page: m.page, hero: m.hero, heroEyebrow: "#ffffff", heroSub: "#f4f4f4",
        eyebrow: m.eyebrow, planBg: "#ffffff", planBorder: `1px solid ${m.accent}33`,
        planLabel: "The details", planLabelColor: m.accent,
        a1: m.accent, a2: m.accent, a3: m.accent, confetti: false, hero_on: true,
      };
    }
    case "classic":
    case "photo":
    default:
      return {
        page: "#f4f7f8", hero: "#017391", heroEyebrow: "#bfe3ee", heroSub: "#cfe9f2",
        eyebrow: "💙 You're invited 💙", planBg: "#f2f7f8", planBorder: "1px solid #d5e5e9",
        planLabel: "The details", planLabelColor: "#017391",
        a1: "#017391", a2: "#017391", a3: "#017391", confetti: false, hero_on: true,
      };
  }
}

/* ------------------------------------------------------------------ */
/* Render                                                              */
/* ------------------------------------------------------------------ */

function esc(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
/** Escape but keep the {{first_name}} / {{unsubscribe_url}} merge tokens intact. */
function escKeepTokens(s: string): string {
  return esc(s).replace(/\{\{\s*(first_name|unsubscribe_url)\s*\}\}/gi, "{{$1}}");
}
function nl2br(s: string): string {
  return escKeepTokens(s).replace(/\n/g, "<br>");
}

const CONFETTI = `<div style="text-align:center;padding:14px 0 8px;letter-spacing:6px;font-size:15px;line-height:1"><span style="color:#e85d75">●</span><span style="color:#f7b32b">◆</span><span style="color:#4ea5a2">●</span><span style="color:#9b6bc9">▲</span><span style="color:#e85d75">◆</span><span style="color:#f7b32b">●</span><span style="color:#4ea5a2">▲</span></div>`;
const BUNTING = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:0"><tbody><tr><td height="7" width="20%" style="background:#f7b32b;font-size:1px;line-height:1px">&nbsp;</td><td height="7" width="20%" style="background:#4ea5a2;font-size:1px;line-height:1px">&nbsp;</td><td height="7" width="20%" style="background:#9b6bc9;font-size:1px;line-height:1px">&nbsp;</td><td height="7" width="20%" style="background:#f7b32b;font-size:1px;line-height:1px">&nbsp;</td><td height="7" width="20%" style="background:#4ea5a2;font-size:1px;line-height:1px">&nbsp;</td></tr></tbody></table>`;

/** Render the structured model to a complete standalone HTML email. */
export function renderEmailModel(model: EmailModel): string {
  const p = palette(model.theme);
  const title = model.heroTitle || "A note from Joy";
  const eyebrow = model.eyebrow || p.eyebrow;
  const bodyRadius = p.hero_on ? "0 0 16px 16px" : "16px";

  const hero = p.hero_on
    ? `<tr><td style="padding:0 22px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${p.hero};border-radius:16px 16px 0 0"><tbody>
${eyebrow ? `<tr><td align="center" style="padding:30px 24px 4px"><div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${p.heroEyebrow};font-weight:bold;line-height:1.4">${esc(eyebrow)}</div></td></tr>` : ""}
<tr><td align="center" style="padding:6px 24px 4px"><div style="font-family:Georgia,'Times New Roman',serif;font-size:32px;line-height:1.15;color:#ffffff;font-weight:bold">${esc(title)}</div></td></tr>
${model.heroSub ? `<tr><td align="center" style="padding:6px 24px 28px"><div style="font-family:Georgia,'Times New Roman',serif;font-style:italic;font-size:15px;color:${p.heroSub}">${esc(model.heroSub)}</div></td></tr>` : `<tr><td style="padding-bottom:24px"></td></tr>`}
</tbody></table>
${p.confetti ? BUNTING : ""}
</td></tr>`
    : "";

  const photo =
    model.theme === "photo"
      ? `<tr><td style="padding:0 22px">${
          model.photoUrl
            ? `<img src="${esc(model.photoUrl)}" width="556" alt="" style="display:block;width:100%;max-width:556px;height:auto;border:0">`
            : `<div style="height:150px;background:repeating-linear-gradient(45deg,#eef2f3 0 10px,#e3e7e9 10px 20px);text-align:center;line-height:150px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:#626d70">Add a photo from the house</div>`
        }</td></tr>`
      : "";

  const plan =
    model.plan && (model.plan.when || model.plan.where || model.plan.treats)
      ? `<div style="margin-top:16px;background:${p.planBg};border:${p.planBorder};border-radius:12px;padding:16px 18px">
<div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:2.5px;text-transform:uppercase;color:${p.planLabelColor};font-weight:bold;margin-bottom:9px">${esc(model.plan.label || p.planLabel)}</div>
<div style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.9;color:#2b2b33">
${model.plan.when ? `📅 <strong style="color:${p.a1}">When:</strong> ${escKeepTokens(model.plan.when)}<br>` : ""}
${model.plan.where ? `🏠 <strong style="color:${p.a2}">Where:</strong> ${escKeepTokens(model.plan.where)}<br>` : ""}
${model.plan.treats ? `🍦 <strong style="color:${p.a3}">Treats:</strong> ${escKeepTokens(model.plan.treats)}` : ""}
</div></div>`
      : "";

  const rsvp = model.rsvpUrl
    ? `<div style="text-align:center;margin-top:20px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto"><tbody><tr><td align="center" style="background:#01a7ce;border-radius:8px"><a href="${esc(model.rsvpUrl)}" style="display:inline-block;padding:13px 32px;font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none">RSVP here</a></td></tr></tbody></table></div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${p.page}">
<span style="display:none;font-size:1px;color:${p.page};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden">${esc(model.heroSub || title)}</span>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${p.page}"><tbody>
<tr><td align="center" style="padding:24px 12px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px"><tbody>
${p.confetti ? `<tr><td>${CONFETTI}</td></tr>` : ""}
${hero}
${photo}
<tr><td style="padding:0 22px">
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ffffff;border-radius:${bodyRadius}"><tbody>
<tr><td style="padding:24px 26px 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#2b2b33">${escKeepTokens(model.greeting)}</td></tr>
<tr><td style="padding:10px 26px 0;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#55555f">${nl2br(model.intro)}</td></tr>
<tr><td style="padding:0 26px">${plan}${rsvp}</td></tr>
<tr><td style="padding:16px 26px 24px;font-family:Georgia,'Times New Roman',serif;font-size:15px;line-height:1.6;color:#2b2b33">${nl2br(model.closing)}</td></tr>
</tbody></table>
</td></tr>
<tr><td align="center" style="padding:16px 24px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#a5a5ad">
💙 Joy Senior Living • Loganville, GA<br>
You're receiving this because you're part of the Joy family. <a href="{{unsubscribe_url}}" style="color:#a5a5ad;text-decoration:underline">Unsubscribe</a>
</td></tr>
</tbody></table>
</td></tr>
</tbody></table>
</body></html>`;
}
