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

The site ships with calm placeholders that say "Add real photo: ...".

**Easiest: `/admin > Site photos`.** Six slots (homepage hero, Mellissa's
portrait, and four community photos). For each, upload a photo or paste an image
URL; the homepage and About page update within a moment. "Reset" returns a slot
to its placeholder. Uploads need photo storage set up (S3 / Cloudflare R2); until
then, paste an image URL in any slot (that always works).

The two galleries are separate: **Site photos** are these fixed marketing images;
the **Gallery** (`/admin > Gallery`) is the open-ended public photo grid.

Prefer files in the repo? You can still drop images into `public/images/` with
these exact names (an admin override, if set, wins over the file):

| File                            | What it is                                   |
| ------------------------------- | -------------------------------------------- |
| `public/images/hero.jpg`        | The building, for the top of the homepage    |
| `public/images/mellissa.jpg`    | A real recent photo of Mellissa              |
| `public/images/community-1.jpg` | Front porch / entrance                       |
| `public/images/community-2.jpg` | Shared dining table with residents and staff |
| `public/images/community-3.jpg` | A resident's room                            |
| `public/images/community-4.jpg` | The common living room                       |

Use real photos of Joy only. No stock imagery. Landscape photos around
1600px wide look best; the room/porch grid is square so anything works.

To change the captions/alt text, edit `COMMUNITY_PHOTOS` in `src/lib/site.ts`.

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

1. In Railway, add the **Postgres** service to the project (you have this).
2. Point the app at it: open the **app service > Variables**, click **Add
   Reference Variable**, choose the Postgres service's `DATABASE_URL`, and name
   it `DATABASE_URL`. (Railway shows it as `${{Postgres.DATABASE_URL}}`.)
3. **Redeploy the app.** The tables are created **automatically on startup** (the
   schema is idempotent), so there is nothing else to run. On boot you'll see
   `[migrate] Schema applied (tables ready).` in the logs.

If you'd rather run migrations by hand, set `AUTO_MIGRATE=false` and run
`npm run migrate` yourself (from Railway's shell or locally with `DATABASE_URL`
set). Either way it is safe to run again and never deletes anything.

Leads from the homepage form land in the `leads` table, tagged
`source = homepage_form`.

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

**Built now (Phase 4):** community emails to current families and a public
photo gallery. See section 11 below.

**Built now (Phase 5):** scheduled blog publishing, TalkFurther leads flowing
into Postgres, nightly SEO rank logging, and privacy-friendly analytics. See
section 12 below.

---

## 9. The blog and admin (Phase 2)

### Signing in

Go to `/admin` and sign in with your **@joyseniorcare.com** Google account.
Only verified accounts on that domain get in (checked on our server, not just
by Google). If you want to lock it down to specific people, set
`ADMIN_ALLOWLIST` (see `.env.example`).

### Temporary password login (until Google is set up)

Google OAuth needs a Google Cloud setup (below) before it works. To get into
the admin **right now**, set a password instead:

1. In Railway, set `ADMIN_PASSWORD` to a strong secret
   (generate one: `openssl rand -base64 24`). Also set `AUTH_SECRET` if you have
   not yet.
2. Redeploy. Now `/admin/login` shows a password box under the Google button.
   Type the password and you are in.

This is a bridge only. When Google sign-in is working, **remove `ADMIN_PASSWORD`**
(unsetting it hides the password box and disables password login), leaving the
domain-restricted Google sign-in your brief calls for. Keep the password
private; anyone with it can reach the admin.

### Google sign-in (the permanent method)

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

**"I uploaded a photo but the site still shows the placeholder."** The image
saved to the bucket, but the browser cannot load it from its public URL. The
upload now warns you (with the exact URL it tried) when this happens. The status
code tells you which problem it is:

- **HTTP 404** (not found): the public host works, but nothing is at that path,
  so `S3_PUBLIC_URL` does not match the bucket's real public URL. Do not guess
  the shape: open the object in your bucket, copy its **public URL**, and set
  `S3_PUBLIC_URL` to **everything before `/blog/`**. Some R2 public dev URLs
  include the bucket name in the path and some do not, e.g. both of these are
  real, valid shapes:
  - `https://pub-<hash>.r2.dev` (object at `…r2.dev/blog/<file>`)
  - `https://pub-<hash>.r2.dev/<bucket>` (object at `…r2.dev/<bucket>/blog/<file>`)
- **HTTP 401 / 403** (denied): public access is off, or `S3_PUBLIC_URL` is the
  private S3 endpoint. Fix as below.

New uploads self-correct (the app tries both `{host}/blog/…` and
`{host}/{bucket}/blog/…` and saves whichever loads). To repair images that were
saved broken *before* that, run the one-time fixer (preview first):

```
railway run node scripts/fix-image-urls.mjs --dry   # preview, changes nothing
railway run node scripts/fix-image-urls.mjs         # apply
```

It rewrites saved image links (blog heroes, inline post images, site photos)
only when the corrected URL actually loads, and leaves Webflow-CDN and
already-correct links alone.

Almost always the fix is `S3_PUBLIC_URL`:

- `S3_PUBLIC_URL` must be the bucket's **public** URL, not the S3 API endpoint.
  - Right: the R2 **public development URL** (`https://pub-<hash>.r2.dev`) or a
    custom domain you connected to the bucket (e.g. `https://img.joyseniorcare.com`).
  - Wrong: `https://<account>.r2.cloudflarestorage.com/...` (that is `S3_ENDPOINT`;
    it needs signed requests, so public `<img>` loads get 401/403).
- In Cloudflare R2, the bucket needs public access **on** (enable the r2.dev
  public URL, or attach the custom domain). A brand-new bucket is private.
- Test it: paste the image's URL straight into a browser tab. If it does not
  load there, the site cannot load it either. Fix `S3_PUBLIC_URL` / public
  access, then re-upload (or just re-save the same URL).

### Generate a hero image with Gemini

In the editor, under the Hero image field, click **Generate a hero image with
Gemini**. It pre-fills a suggested prompt from your post title (edit it freely),
then Gemini creates the image and saves it as the hero. This needs
`GEMINI_API_KEY` set (from aistudio.google.com) **and** storage configured (the
`S3_*` vars), because the generated image is saved to your bucket. If your
account exposes a different image model, set `GEMINI_IMAGE_MODEL`.

These are **AI illustrations, not real photos of Joy.** Keep them atmospheric
(light, a porch, hands, a table). Do not generate fake photos of the home,
residents, or staff (the "real photos only" rule still governs anything that
depicts Joy itself). Always review before publishing.

### Moving the old Webflow posts over (one-time)

1. Export your blog from Webflow (CSV is fine).
2. Set `OLD_BLOG_BASE` to whatever path Webflow used for posts (e.g. `/post`).
3. Preview first:  `node scripts/import-webflow.mjs your-export.csv --dry`
4. Import for real (with `DATABASE_URL` set):
   `node scripts/import-webflow.mjs your-export.csv`

This preserves each post's slug, converts the content to the editor's format,
and writes `db/redirects.json` so old links **301** to the new `/blog/<slug>`.
Redirects apply on the next deploy, so **redeploy after importing**.

**Your export is already in the repo** at `data/webflow-blog-export.csv` (32
published posts). Once the app is running with a database connected, open a shell
in the **app service** (Railway console, or `railway ssh`) and run this once:

    OLD_BLOG_BASE=/post node scripts/import-webflow.mjs data/webflow-blog-export.csv

(Run it in the app service, not the Postgres service, so `DATABASE_URL` and the
code are both present. Use `node scripts/...`, not `npm run import:webflow` with
a file argument, since npm does not forward the filename.)

The importer was verified end to end against this file: all 32 posts import,
render, keep their slugs/dates/authors/hero images, and generate matching 301s.
`OLD_BLOG_BASE=/post` assumes the old Webflow blog lived at `/post/<slug>`. If it
was `/blog/<slug>` (or anything else), change that value and re-run so the
redirects match. It is safe to run again; it updates rather than duplicates.

Note: the imported posts are your original Webflow copy, unchanged. A few use
words the Joy voice guide avoids ("loved ones", "vibrant", "journey", etc.) and
some use em-dashes. None wrongly call Joy an assisted living community. Edit any
post in `/admin` if you want to bring older ones fully in-voice.

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

---

## 11. Family emails and the photo gallery (Phase 4)

### The family list

`/admin > Families` is your directory of residents' families, grouped by
resident. Each contact has a **resident**, a **relation** (Daughter, Son, …), a
**contact name**, a **phone**, and an optional **email**. Every contact also has
an **Active** flag: mark a family **inactive** when their resident is no longer
living at Joy, and community emails skip them automatically.

Add someone with the form. Email is optional (phone-only contacts are fine for
the directory). If you enter an email, check the opt-in box to confirm they
agreed to receive community emails. They can unsubscribe from any email, and
unsubscribed people are always skipped.

**Who gets a community email:** only contacts who are (1) on an **active**
resident, (2) have an **email**, and (3) have not unsubscribed.

### Importing your family list (bulk)

Easiest: **`/admin > Families > Import a list`**. Paste your list or choose a
file (CSV, or copied straight out of a spreadsheet). Use columns `resident,
relation, contact name, phone, email` (a header row is optional). It skips any
contact already on the list (matched by email, or by resident + name), so you
can re-import or paste overlapping lists without creating duplicates. A row
whose preference is "Do Not Contact" is stored but flagged unsubscribed, so
community emails skip it.

Prefer the command line? Put a CSV at `data/family-contacts.csv` (same columns)
and run `node scripts/import-family-contacts.mjs` (add `--dry` to preview).
Same dedupe rules. Note: this CSV holds real PII, so it is gitignored — never
commit it.

**Before your first family email:** imported contacts with an email are treated
as opted in to community updates. Glance down the list and mark inactive (or
unsubscribe) anyone who should not receive a community email.

### Texting families (Quo)

`/admin > Texts` sends a short SMS blast to families through **Quo** (formerly
OpenPhone). Good for quick, community-wide notes: a reminder, a weather closing,
"family night is tonight."

**Setup (once):** in Railway set `QUO_API_KEY` (from Quo) and `QUO_FROM_NUMBER`
(the Quo number to text from, e.g. `+14706843569`). The number must be
registered for **A2P 10DLC** business texting in Quo — carriers require this, and
Quo walks you through it. Until both are set, the Texts page shows a warning and
sending is off.

**Consent (important):** texting has stricter rules than email. A text only goes
to a family contact you have marked **Texts: on** in the Family list, who is
active and has a phone. Only opt in people who agreed to be texted. Every message
automatically adds "Reply STOP to opt out."; if someone asks to stop, use **Texts
off** (or it records their opt-out) and they are never texted again.

**Required test before every blast.** A family blast is locked until that exact
message has been test-sent to the owner/admin numbers. Set those numbers in
`/admin > Settings > Text test numbers (owners & admin)` (comma-separated), or
via the `SMS_TEST_NUMBERS` env var. On the Texts page: write the message,
**Step 1** send the test (goes to those numbers), review it on your phone, then
**Step 2** send to families unlocks. Editing the message after testing locks it
again until you re-test. This is enforced on the server, not just in the browser.

### Emailing families

Community emails go out the same way as lead emails: `/admin > Emails > New
email`, but choose **Families** as the audience. Use the **Photo** button to
add pictures right into the message. Send now or schedule.

**Scope, on purpose:** family emails are community-wide only. Birthday and
holiday invites, family nights, a monthly note from Mellissa, event photos.
**Never** individual resident information, and **never** anything urgent or an
emergency. Those stay a phone call: faster, more reliable, and more humane. The
composer reminds you of this whenever the Families audience is selected.

### The public photo gallery

`/admin > Gallery` manages the photos shown at **/gallery** on the public site.
Click **Choose photo** to upload (needs the S3 / Cloudflare R2 setup from §9;
otherwise paste an image URL), add a caption and a short description, and click
**Add to gallery**. Remove a photo anytime. Real photos of Joy only, no stock.
The public gallery is linked in the site footer.

**AI caption & alt text (for SEO + accessibility).** With AI set up
(`ANTHROPIC_API_KEY`, see §9), you can let it write these for you:

- On the **add** form, after you pick a photo, click **✨ Suggest caption & alt
  (AI)**. It looks at the photo and fills both fields; review and edit before
  you click Add.
- For a photo already in the gallery, hover it and click **✨ AI** to write and
  save a caption + alt text right away.

The AI describes only what is actually in the picture (it never invents names,
events, or places) and follows Joy's voice and the personal-care-home rules.
Good alt text helps search engines and screen readers understand each photo.

---

## 12. Automation and polish (Phase 5)

Everything here rides on the same scheduled worker from §10. Once the Railway
cron is calling `/api/cron`, it also does the jobs below on each run. Its
response now reports `postsPublished`, `dripSent`, `broadcastSent`, and
`ranksLogged`.

### Scheduling a blog post

In the post editor there is a **Publish later** row: pick a date and time and
click **Schedule**. The post stays hidden until then, and the cron publishes it
automatically when the time comes (it shows as "scheduled" in the post list).

### TalkFurther leads in one place

TalkFurther used to keep its leads separate. Now they flow into the same leads
list and attribution report (tagged `source = talkfurther`). Set up once:

1. Set `TALKFURTHER_WEBHOOK_SECRET` in Railway (generate: `openssl rand -hex 24`).
2. In TalkFurther, add a webhook to
   `https://joyseniorcare.com/api/webhooks/talkfurther` and include the secret
   (as a Bearer token, an `x-webhook-secret` header, or `?key=<secret>`).

TalkFurther leads are not added to the nurture drip (TalkFurther has its own
follow-up), but they count in the source report and can receive broadcasts.
Repeat deliveries are ignored, so it is safe if TalkFurther retries.

### SEO rank tracking

`/admin > SEO` shows the Google position for the keywords we chase, logged
nightly. It needs a `SERPAPI_KEY` (from serpapi.com); without it the page stays
empty and nothing is charged. The tracked keywords live in `src/lib/site.ts`
(`TRACKED_KEYWORDS`) if you want to change them.

### Analytics (optional)

Set `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` to `joyseniorcare.com` to turn on Plausible
(privacy-friendly, no cookies). It records page views plus two conversions:
**Tour click** (any Book-a-tour button) and **Lead form submit**. Leave it unset
for no analytics. Note: the lead form and TalkFurther are still the source of
truth for actual leads; analytics is just for traffic and click trends.

---

## 13. Site settings, About & Services pages (Change Set 01)

### Editable settings (no redeploy)

`/admin > Settings` is a screen with editable fields for values used across the
site: **phone, email, address, the Careers link, and the tour (TalkFurther)
link**. Change one, click **Save settings**, and the live site updates within a
moment (the header and footer read these on every page).

- **Careers link**: paste your Indeed ads URL to show a **Careers** link in the
  header and footer (it opens in a new tab). Leave it blank to hide the link.
- **Tour link**: paste your TalkFurther URL. Blank falls back to the phone
  number so the button never dead-ends.
- URL fields must be a real http(s) link (or blank); the others cannot be blank.

Two of these seed blank on purpose and are yours to fill in the admin screen the
first time: **Careers link** (your Indeed URL) and **Tour link** (TalkFurther).

Adding a brand-new setting key later is a one-line change in `src/lib/settings.ts`
(and `settings-meta.ts` for its label); no other code is needed.

### Cloudflare note

Because Cloudflare caches pages, give the site a short edge cache TTL (or a
cache rule that respects the app) so edits appear promptly. The app already
refreshes its own render on save; the short TTL covers Cloudflare's layer.

### About and Services pages

- **/about** is the story/trust page (why Joy exists, what a small home feels
  like, Mellissa as the anchor). Its copy lives in `src/lib/site.ts` under
  `ABOUT`.
- **/services** describes what Joy offers as a personal care home, with memory
  care, and the search-context framing for "assisted living" (§4). Copy lives
  under `SERVICES`. The memory-care section only shows when `MEMORY_CARE.enabled`
  is true (confirm it is within the license first).

Both are in the header and footer navigation.

## 14. Deposits (PayPal)

Send a family a **move-in deposit request** as a PayPal invoice. PayPal emails
them a secure, hosted invoice, hosts the payment page, and tells you when it is
paid. The money goes straight to your PayPal account. The site never touches
card numbers.

### One-time setup

1. At https://developer.paypal.com/dashboard/applications create a REST app.
   You get two sets of keys: **Sandbox** (for testing) and **Live** (real
   money). Copy the app's **Client ID** and **Secret**.
2. In Railway (Variables) set:
   - `PAYPAL_CLIENT_ID`
   - `PAYPAL_CLIENT_SECRET`
   - `PAYPAL_ENV` = `sandbox` while testing, `live` when you are ready to take
     real payments. (Unset behaves as sandbox.)
3. Redeploy. The **Deposits** screen in the admin turns on. Until the keys are
   set it shows a "PayPal is not connected yet" notice and nothing else breaks.

### How the email is sent

The family is emailed the payment link **from `hello@joyseniorcare.com`**
(through Resend, the same sender as your other emails), not from PayPal.
PayPal's own invoice email is turned off on purpose, so the message is branded
and lands reliably. This means **email must be configured** (`RESEND_API_KEY`,
see section 10) for the family to be emailed. If it is not, the Deposits screen
warns you, the invoice is still created, and you can copy its payment link from
**View** on the row and send it yourself.

### Sending a deposit request

1. Admin → **Deposits**.
2. Enter the family member's name and email. The amount pre-fills from your
   default (Site Settings → Deposits); change it for this family if needed. Add
   an optional note that shows in the email and on the invoice.
3. **Send deposit request.** We email them a "Pay the deposit" button from
   `hello@joyseniorcare.com`. The request appears in **History** with its
   status (Sent → Paid).

The mode badge on the screen tells you at a glance whether you are in
**Sandbox** (test) or **Live** (real payments).

### Managing a request (the row menu)

Each row in the list has a **⋮ menu** with:

- **View invoice** — open the PayPal payment page (copy/share the link).
- **Email reminder** — resend the payment link from `hello@joyseniorcare.com`.
- **Text reminder** — text the link (needs a mobile number on the request, and
  texting set up; see section 11). Add the number in the **Mobile phone** field
  when you send the request.
- **Refresh status** — re-check paid/unpaid with PayPal.
- **Cancel request** — voids the invoice on PayPal so it can no longer be paid
  (only for unpaid requests).
- **Archive / Restore** — hides a row from the list (kept under the **Archived**
  tab); does not touch PayPal.
- **Delete** — removes the record from your history here (PayPal keeps its own
  copy).

### Keeping status up to date

- **Automatic (recommended for live):** in the PayPal app add a webhook to
  `https://www.joyseniorcare.com/api/webhooks/paypal` subscribed to the
  **Invoicing** events, then paste the generated **Webhook ID** into
  `PAYPAL_WEBHOOK_ID` in Railway. Status then updates itself when a family pays.
- **Manual:** use **Refresh status** in the row menu to re-check with PayPal.

### The default amount and note

Set them in Admin → **Site settings** → *Deposits (PayPal)*:

- **Default deposit amount (USD)** — pre-fills the Deposits form; still
  overridable per request.
- **Deposit invoice note (optional)** — a line shown to the family on every
  invoice. Leave blank for none.
