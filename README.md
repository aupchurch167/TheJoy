# Joy Senior Living

The website for Joy Senior Living, a 24-bed personal care home in Loganville,
Georgia. One job: turn a worried adult child researching for a parent into a
booked tour, and keep current families close.

Built with Next.js (App Router) + Postgres, deployed on Railway behind
Cloudflare. **If you are Adam (or anyone operating the site, not developing it),
read [`OPERATIONS.md`](./OPERATIONS.md) first.** It covers editing copy, adding
photos, env vars, and what to do when something breaks.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind v4)
- **Postgres** via `pg` (leads + blog storage)
- **Auth.js (NextAuth v5)** — Google sign-in, domain-restricted to
  @joyseniorcare.com (enforced server-side)
- **Anthropic API** for AI blog drafting (human approves before publish)
- **Resend** for outbound email (optional)
- **Cloudflare R2 / S3** for blog image uploads (optional)
- **TalkFurther** as the single tour path

## Project map

    src/
      app/
        (site)/               Public marketing site (header/footer layout)
          page.tsx            Homepage (composes the sections)
          blog/               DB-backed blog index + /blog/[slug] post pages
          unsubscribe/        One-click email unsubscribe
        admin/                Blog CMS (behind Google auth)
          page.tsx            Post list dashboard
          login/              Google sign-in
          posts/              PostEditor + new/[id] routes + server actions
        api/
          leads/              Lead capture endpoint
          auth/[...nextauth]/ Auth.js handlers
          admin/ai-draft/     Anthropic-backed AI drafting (guarded)
          admin/upload/       Image upload to S3/R2 (guarded)
        layout.tsx            Root layout (fonts, global metadata)
        sitemap.ts, robots.ts SEO
      auth.ts                 Auth.js config + server-side domain gate
      proxy.ts                Protects /admin (Next 16 "proxy" convention)
      components/
        sections/             Hero, Difference, MeetMellissa, Testimonials, ...
        LeadForm, TourButton, Photo, Markdown, SiteHeader/Footer
      lib/
        site.ts               *** All facts and homepage copy live here ***
        db.ts, leads.ts, posts.ts, redirects.ts   Postgres + queries
        access.ts, require-admin.ts                Admin access control (§1a)
        ai.ts                 Anthropic drafting (voice + compliance in prompt)
        storage.ts            S3/R2 image uploads
        email.ts, schema.ts   Resend + schema.org JSON-LD
    db/schema.sql             Database tables (leads, posts, redirects)
    db/redirects.json         301 map for migrated Webflow URLs
    scripts/migrate.mjs       Applies schema.sql          (npm run migrate)
    scripts/import-webflow.mjs Webflow -> Postgres import  (npm run import:webflow)

## Voice and compliance (non-negotiable)

All copy follows two rules, enforced by keeping copy in `src/lib/site.ts`:

- **Voice:** no em-dashes, no banned words, short plainspoken sentences, Mellissa
  named where care is discussed.
- **Compliance:** Joy is a **personal care home**, never labeled "assisted
  living". "Assisted living" appears only as the search category, then Joy is
  described accurately.

See the `src/lib/site.ts` header comment for the full lists.

## Develop

    npm install
    cp .env.example .env.local     # fill in what you have (all optional locally)
    npm run dev                    # http://localhost:3000

    npm run build                  # production build
    npm run lint                   # eslint
    npm run migrate                # create DB tables (needs DATABASE_URL)

## Status

Phase 1 (flagship homepage + lead capture) and Phase 2 (blog/CMS + Google admin
login + AI drafting + Webflow migration) are complete. Phases 3-5 (lead nurture
emails, family communications + photo gallery, automation) are planned; see the
build brief.

### Admin auth note

The brief lists Supabase Auth as preferred and Auth.js as the sanctioned
alternative. This build uses **Auth.js** because it is fully self-contained on
the Railway + Postgres stack (no second platform to run), needs only a Google
OAuth client, and still enforces the §1a rule (verified email + domain, optional
allowlist) server-side in `src/lib/access.ts`. Swappable if Supabase is
preferred later.
