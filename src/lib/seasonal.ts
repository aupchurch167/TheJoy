/**
 * The canonical 12-month seasonal palette, shared by the email renderer, the
 * event invite email, and the public RSVP page so the "Seasonal" look is one
 * source of truth. Each entry: a hero band color, a soft text color for on-hero
 * eyebrow/subtitle, the shell/page background, an accent, and a header eyebrow
 * line. Resolved by calendar month, so "Seasonal" rotates on its own.
 */

export type SeasonalMonth = {
  name: string;
  hero: string;
  soft: string;
  page: string;
  accent: string;
  eyebrow: string;
};

export const SEASONAL_MONTHS: SeasonalMonth[] = [
  { name: "January", hero: "#4a7fa5", soft: "#d8e7f2", page: "#f2f6fa", accent: "#4a7fa5", eyebrow: "❄ Winter at Joy ❄" },
  { name: "February", hero: "#c25b74", soft: "#f6dde4", page: "#fdf3f5", accent: "#c25b74", eyebrow: "💕 With love from Joy 💕" },
  { name: "March", hero: "#4f9d69", soft: "#dcefe2", page: "#f2f8f3", accent: "#4f9d69", eyebrow: "🍀 First days of spring 🍀" },
  { name: "April", hero: "#c9718f", soft: "#f6dfe8", page: "#fbf4f7", accent: "#6ea36a", eyebrow: "🌸 Spring at Joy 🌸" },
  { name: "May", hero: "#5faa61", soft: "#def0de", page: "#f3f9f3", accent: "#5faa61", eyebrow: "🌼 May flowers 🌼" },
  { name: "June", hero: "#e0972f", soft: "#f9e8cd", page: "#fdf8ec", accent: "#c9821f", eyebrow: "☀️ Hello, summer ☀️" },
  { name: "July", hero: "#3b6fae", soft: "#d9e5f3", page: "#f3f6fa", accent: "#cf4636", eyebrow: "🎇 Summer nights 🎇" },
  { name: "August", hero: "#d97e50", soft: "#f8e2d5", page: "#fdf5ef", accent: "#c05f31", eyebrow: "🍑 Late-summer porch 🍑" },
  { name: "September", hero: "#b0722a", soft: "#f2e1c9", page: "#fbf6ec", accent: "#b0722a", eyebrow: "🍂 Into the fall 🍂" },
  { name: "October", hero: "#c96328", soft: "#f6ddcb", page: "#fdf4ec", accent: "#8a5a2b", eyebrow: "🎃 Cozy October 🎃" },
  { name: "November", hero: "#8f5b23", soft: "#ecdcc4", page: "#faf5ec", accent: "#8f5b23", eyebrow: "🥧 Giving thanks 🥧" },
  { name: "December", hero: "#2e6b46", soft: "#d7e8dd", page: "#f4f8f5", accent: "#b23a30", eyebrow: "🎄 Warm holiday wishes 🎄" },
];

/** The seasonal palette for a given month (defaults to the current month). */
export function seasonalMonth(month = new Date().getMonth()): SeasonalMonth {
  return SEASONAL_MONTHS[((month % 12) + 12) % 12];
}

/** The month's name (for the composer's "Seasonal · <month>" label + note). */
export function seasonalMonthName(month = new Date().getMonth()): string {
  return seasonalMonth(month).name;
}
