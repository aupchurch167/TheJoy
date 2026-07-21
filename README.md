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
- **Postgres** via `pg` (leads storage)
- **Resend** for outbound email (optional in Phase 1)
- **TalkFurther** as the single tour path

## Project map

    src/
      app/
        page.tsx              Homepage (composes the sections)
        layout.tsx            Fonts, global metadata, header/footer
        blog/page.tsx         Placeholder blog index (Phase 2 builds the CMS)
        unsubscribe/page.tsx  One-click email unsubscribe
        api/leads/route.ts    Lead capture endpoint (validates, stores, emails)
        sitemap.ts, robots.ts SEO
      components/
        sections/             Hero, Difference, MeetMellissa, Testimonials,
                              CommunityPhotos, LatestPosts, FinalCta
        LeadForm.tsx          The contact form (client)
        TourButton.tsx        The ONE tour CTA (TalkFurther)
        Photo.tsx             Real-photo slot with a no-stock placeholder
        SiteHeader/Footer
      lib/
        site.ts               *** All facts and homepage copy live here ***
        db.ts, leads.ts       Postgres pool + lead queries
        email.ts              Resend wrapper (welcome + internal alert)
        schema.ts             schema.org LocalBusiness/SeniorCare JSON-LD
    db/schema.sql             Database tables
    scripts/migrate.mjs       Applies schema.sql   (npm run migrate)

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

Phase 1 (flagship homepage + lead capture) is complete. Phases 2-5 (blog/CMS +
admin login + AI drafting, lead emails, family communications + gallery,
automation) are planned; see the build brief.
