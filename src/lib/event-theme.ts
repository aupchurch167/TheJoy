/**
 * Event looks, shared by the public RSVP page and the invite email so a theme
 * chosen in the Event Studio styles both. A subset of the email themes that make
 * sense for an event (no photo-hero / plain-letter). "seasonal" rotates by month.
 */

import { seasonalMonth, seasonalMonthName } from "./seasonal";

export type EventTheme = "classic" | "festive" | "seasonal" | "garden" | "elegant";

export const EVENT_THEMES: { id: EventTheme; label: string }[] = [
  { id: "classic", label: "Joy classic" },
  { id: "festive", label: "Festive" },
  { id: "seasonal", label: "Seasonal" },
  { id: "garden", label: "Garden party" },
  { id: "elegant", label: "Elegant" },
];

export type EventPalette = {
  /** Hero band background. */
  hero: string;
  /** Soft text color for the on-hero eyebrow + when/where line. */
  soft: string;
  /** Small caps line above the title. */
  eyebrow: string;
  /** Primary button / accent. */
  cta: string;
  /** Details / potluck card background + border. */
  cardBg: string;
  cardBorder: string;
};

export function eventPalette(theme: EventTheme | string | null | undefined): EventPalette {
  switch (theme) {
    case "festive":
      return {
        hero: "#e85d75", soft: "#ffd9e0", eyebrow: "🎉 You're invited 🎉", cta: "#e85d75",
        cardBg: "#fff6e3", cardBorder: "#f7b32b",
      };
    case "garden":
      return {
        hero: "#1c7f27", soft: "#c9ecc9", eyebrow: "🌿 You're invited 🌿", cta: "#1c7f27",
        cardBg: "#eef6ee", cardBorder: "#8fd096",
      };
    case "elegant":
      return {
        hero: "#123a44", soft: "#c3d2d6", eyebrow: "✦ An invitation ✦", cta: "#123a44",
        cardBg: "#f5f2ea", cardBorder: "#d8c9a3",
      };
    case "seasonal": {
      const m = seasonalMonth();
      return {
        hero: m.hero, soft: m.soft, eyebrow: m.eyebrow, cta: m.accent,
        cardBg: "#ffffff", cardBorder: m.accent,
      };
    }
    case "classic":
    default:
      return {
        hero: "#017391", soft: "#bfe3ee", eyebrow: "💙 You're invited 💙", cta: "#01a7ce",
        cardBg: "#f2f7f8", cardBorder: "#d5e5e9",
      };
  }
}

export { seasonalMonthName };
