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

**Built now (Phase 2):** admin login (Google sign-in restricted to
@joyseniorcare.com), the blog with a full editor, AI-assisted drafting, public
blog pages with SEO, and Webflow migration tooling. See section 9 below.

**Built now (Phase 3):** automatic lead nurture emails, one-off/scheduled
emails to leads, and a source-attribution report. See section 10 below.

**Next (Phases 4-5):** family communications, the photo gallery, and automation.

---

## 9. The blog and admin (Phase 2)

### Signing in

Go to `/admin` and sign in with your **@joyseniorcare.com** Google account.
Only verified accounts on that domain get in (checked on our server, not just
by Google). If you want to lock it down to specific people, set
`ADMIN_ALLOWLIST` (see `.env.example`).

One-time setup Adam does:

1. In Google Cloud, create an **OAuth 2.0 Client** (type: Web application).
2. Set the authorized redirect URI to
   `https://joyseniorcare.com/api/auth/callback/google`.
3. Set the OAuth consent screen to **Internal** (Workspace org only).
4. Put the client ID/secret into Railway as `AUTH_GOOGLE_ID` /
   `AUTH_GOOGLE_SECRET`, and set `AUTH_SECRET` (run `openssl rand -base64 32`).

### Writing a post

From `/admin`, click **New post**. You get a title, a Markdown editor with a
formatting toolbar and a live **Preview** tab, an excerpt, a category, a hero
image, and SEO fields. Two buttons:

- **Save draft** keeps it private (not on the site).
- **Publish** puts it live at `/blog/<slug>` and on the homepage.

The same voice and compliance rules apply to posts: no em-dashes, no banned
words, and Joy is a **personal care home** (never "assisted living" as our
label). Name Mellissa when care is discussed.

### Draft with AI

Click **Draft with AI**, give it a topic (and optionally an angle), and it
writes a full draft in Joy's voice and within the compliance rules, then fills
the editor. **It never publishes on its own.** Always read and edit before
publishing. This needs `ANTHROPIC_API_KEY` set (see `.env.example`); without
it, you just write posts by hand.

### Images

To upload images (hero or inside a post), set up an S3-compatible bucket
(Cloudflare R2 is the easy choice) with the `S3_*` env vars. Without that, you
can still paste an image URL into the hero field or a Markdown image link.

### Moving the old Webflow posts over (one-time)

1. Export your blog from Webflow (CSV is fine).
2. Set `OLD_BLOG_BASE` to whatever path Webflow used for posts (e.g. `/post`).
3. Preview first:  `node scripts/import-webflow.mjs your-export.csv --dry`
4. Import for real (with `DATABASE_URL` set):
   `npm run import:webflow your-export.csv`

This preserves each post's slug, converts the content to the editor's format,
and writes `db/redirects.json` so old links **301** to the new `/blog/<slug>`.
Redirects apply on the next deploy, so **redeploy after importing**.

---

## 10. Lead emails and attribution (Phase 3)

### What sends automatically

Every new lead from the site is entered into a **nurture drip**: a short series
of honest, in-voice emails (welcome, then what makes Joy different, then a real
family word, then a tour invitation), spaced out over about a week. Every email
has an unsubscribe link, and anyone who unsubscribes is skipped from then on.
This all runs on its own once the scheduled worker is set up (below).

### Sending a one-off email to leads

From `/admin`, click **Emails > New email**. Write a subject and a Markdown
message (Preview tab shows how it looks), then either **Send now** or pick a
date/time to **Schedule**. It goes to every subscribed lead. Unsubscribe is
added automatically, and opted-out leads are never included. The same voice and
compliance rules apply (no em-dashes, no banned words, personal care home).

### Seeing where leads come from (attribution)

`/admin > Leads` shows a **By source** table: how many leads each channel
brought in, and how many **toured** or **moved in**. Keep it accurate by
setting each lead's **Stage** (New / Toured / Moved in / Lost) in the list as
things progress. This is how you see which sources actually work, so you can
lean less on any single one (like A Place for Mom).

Leads are tagged by `source` (`homepage_form` today; TalkFurther webhook and
APFM import land in Phase 5).

### The scheduled worker (Railway cron) — required for Phase 3

Drip emails and scheduled sends are driven by a small worker at `/api/cron`.
Set it up once:

1. Set `CRON_SECRET` in Railway (generate: `openssl rand -hex 24`).
2. Add a Railway **Cron** (Project > New > Cron, or a cron schedule on a
   service) that runs, say, every 15 minutes and calls the endpoint:

       curl -fsS -H "Authorization: Bearer $CRON_SECRET" https://joyseniorcare.com/api/cron

   (Every 15 minutes is plenty; the worker only sends what is actually due.)

The endpoint refuses to run without the correct secret, so it can never be
triggered by a stranger. It returns how many drip and broadcast emails it sent
on each run.

### Email delivery

All of the above needs `RESEND_API_KEY` (and a verified `joyseniorcare.com`
sending domain in Resend). Without it, leads are still saved and drips/broadcasts
just wait; you can compose and save, but nothing sends until Resend is set.
