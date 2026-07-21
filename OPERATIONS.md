# Operating Joy Senior Living (for Adam)

This is the plain-English guide to running the site. You do not need to be a
developer to do the things in here. When something breaks, the first job is to
read the error, and this guide tells you where to look.

The site is a Next.js app. It runs as a small always-on server (on Railway)
with a Postgres database, behind Cloudflare. Every phase leaves a working site.

---

## 1. The one file you will edit most

Almost all the words and facts on the homepage live in one file:

    src/lib/site.ts

Open it, change the text between the quotes, save, and the site updates on the
next deploy. It has comments explaining each part. Two rules never bend:

- **Voice**: no em-dashes (use parentheses), no banned words
  ("loved ones", "vibrant", "journey", "boutique", "intimate" (say "small"),
  "top-tier", "deserve more", "personalized care plans"). Short sentences.
- **Compliance**: Joy is a Georgia **personal care home**, never call it
  "assisted living". You may mention "assisted living" only as the thing
  families search for, then say what Joy actually is.

---

## 2. Photos (real only, no stock)

The site ships with calm placeholders that say "Add real photo: ...". Replace
them by dropping real image files into `public/images/` with these exact names:

| File to add                     | What it is                                   |
| ------------------------------- | -------------------------------------------- |
| `public/images/hero.jpg`        | The building, for the top of the homepage    |
| `public/images/mellissa.jpg`    | A real recent photo of Mellissa              |
| `public/images/community-1.jpg` | Front porch / entrance                       |
| `public/images/community-2.jpg` | Shared dining table with residents and staff |
| `public/images/community-3.jpg` | A resident's room                            |
| `public/images/community-4.jpg` | The common living room                       |

Use real photos of Joy only. No stock imagery. Landscape photos around
1600px wide look best; the room/porch grid is square so anything works.

To add or change the captions, edit `COMMUNITY_PHOTOS` in `src/lib/site.ts`.

---

## 3. Words that still need YOU (do not fabricate)

A few things must come from real people and are intentionally left blank so the
site never publishes made-up quotes:

- **Mellissa's own words.** In `src/lib/site.ts`, set `MELLISSA.quote` to two or
  three honest first-person sentences from Mellissa. While it is blank, her
  section still reads fine (just the intro, no quote).
- **Cathy's testimonial (the fall story).** In `TESTIMONIALS`, the Cathy entry
  has an empty `quote`. Paste her real words from the current site. Empty
  testimonials are hidden automatically, so nothing fake shows.
- Add any other real testimonials from the current site the same way.

---

## 4. Before you launch: verify checklist

- [ ] Confirm the address in `src/lib/site.ts` (`BUSINESS.address`) matches the
      Google Business Profile exactly (name, address, phone must match).
- [ ] Confirm **memory care** is within Joy's personal care home license. If it
      is not, set `MEMORY_CARE.enabled = false` in `src/lib/site.ts`.
- [ ] Paste the real **TalkFurther** tour URL into `NEXT_PUBLIC_TALKFURTHER_URL`.
- [ ] Add Mellissa's photo + words, and the real testimonials (section 3).
- [ ] Update the award year in `AWARD` once a year.

---

## 5. Environment variables (set these in Railway)

See `.env.example` for the full list with comments. The important ones:

- `DATABASE_URL` — set automatically when you add Railway Postgres.
- `NEXT_PUBLIC_SITE_URL` — `https://joyseniorcare.com`.
- `NEXT_PUBLIC_TALKFURTHER_URL` — the tour link.
- `RESEND_API_KEY`, `EMAIL_FROM`, `LEAD_NOTIFY_TO` — email (optional; the site
  works without them, it just will not send emails yet).

If email keys are missing, leads are still saved and you get no email alert.
If `DATABASE_URL` is missing, the form tells visitors to call instead of
failing silently.

---

## 6. Setting up the database (once)

1. In Railway, add the **Postgres** plugin to the project.
2. Make sure `DATABASE_URL` is available to the app service.
3. Create the tables by running the migration once:

       npm run migrate

   You can run this from Railway's shell, or locally with `DATABASE_URL` set.
   It is safe to run again; it will not delete anything.

Leads from the homepage form land in the `leads` table, tagged
`source = homepage_form`. TalkFurther keeps its own leads for now; Phase 5
reconciles the two.

---

## 7. Running and deploying

Local preview:

    npm install
    npm run dev            # then open http://localhost:3000

Deploy: push to the repository. Railway builds and restarts the server.
Cloudflare sits in front for caching and SSL.

Health of a deploy: if the site is down, open Railway > your service > Logs and
read the most recent red error line. The most common causes are a missing env
var or a database that is not reachable.

---

## 8. What is built vs. what comes next

**Built now (Phase 1):** the homepage (hero with the kept line, the difference,
Meet Mellissa, family testimonials, community photos, latest stories, and the
contact + tour section), the lead form saving to Postgres, optional Resend
emails with unsubscribe, and the SEO basics (meta, schema.org, sitemap, robots).

**Next (Phase 2):** admin login (Google sign-in restricted to
@joyseniorcare.com), the blog/CMS, and AI-assisted drafting. The `/blog` page is
a placeholder until then. Phases 3-5 add lead emails, family communications, the
photo gallery, and automation.
