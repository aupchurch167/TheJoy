<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Joy Senior Living — rules for anyone editing this codebase

This is the marketing site (and future admin) for a 24-bed personal care home
in Loganville, GA. Read the build brief for full context. Two rules govern ALL
reader-facing content and never bend:

## Voice (§2)
- NO em-dashes. Use parentheses for asides.
- BANNED words: "loved ones", "vibrant", "journey", "personalized care plans",
  "boutique", "intimate" (say "small"), "top-tier", "deserve more".
- No listicles, no icon-grid filler. Short sentences. Specific detail over
  reassurance. Prose over bullets. Name Mellissa where care/leadership is discussed.

## Compliance (§4) — Georgia license
- Joy is a **personal care home**, NOT assisted living. Never state or imply Joy
  is an assisted living community. Feature "personal care home" prominently.
- Allowed self-descriptions: "senior living", "personal care home", "memory care"
  (only if within the license).
- "Assisted living" may appear ONLY as the category families search for, followed
  by what Joy actually is. Approved patterns are in `src/lib/site.ts`.

## Where things live
- All facts and homepage copy: `src/lib/site.ts` (edit here, not in components).
- Never fabricate quotes. Mellissa's quote and testimonials are empty until real
  words are supplied; empty ones are hidden by the components.
- One tour path only (TalkFurther via `TourButton`). Do not add other tour links.
- Real photos only, no stock. `Photo` shows a placeholder until a real file exists.

Run `npm run build` and `npm run lint` before committing.
