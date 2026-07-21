-- Joy Senior Living database schema.
-- Run with: npm run migrate  (see scripts/migrate.mjs)
-- Safe to run repeatedly (uses IF NOT EXISTS).

-- Enable UUIDs (gen_random_uuid) via pgcrypto. On Railway Postgres this is
-- available; the extension line is a no-op if already enabled.
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Leads: everyone who raises a hand through the site.
-- `source` tags where the lead came from so Phase 3 can report by source
-- (homepage_form, blog CTA, TalkFurther webhook, APFM import, ...).
CREATE TABLE IF NOT EXISTS leads (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name              TEXT NOT NULL,
  email             TEXT NOT NULL,
  phone             TEXT,
  message           TEXT,
  source            TEXT NOT NULL DEFAULT 'homepage_form',
  -- Marketing consent captured at submission time (opt-in).
  consent           BOOLEAN NOT NULL DEFAULT TRUE,
  -- Unsubscribe handling. Token goes in the unsubscribe link on every email.
  unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
  unsubscribed_at   TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast lookups + prevent exact duplicate spam from one email+source.
CREATE INDEX IF NOT EXISTS leads_email_idx ON leads (lower(email));
CREATE INDEX IF NOT EXISTS leads_source_idx ON leads (source);
CREATE INDEX IF NOT EXISTS leads_created_idx ON leads (created_at DESC);

-- Blog posts (Phase 2). Body is Markdown (portable, safe to render, and what
-- the AI drafting assistant produces). status is 'draft' or 'published'.
CREATE TABLE IF NOT EXISTS posts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             TEXT NOT NULL UNIQUE,
  title            TEXT NOT NULL,
  excerpt          TEXT,
  body             TEXT NOT NULL DEFAULT '',
  hero_image       TEXT,
  hero_image_alt   TEXT,
  author           TEXT NOT NULL DEFAULT 'Joy Senior Living',
  category         TEXT,
  status           TEXT NOT NULL DEFAULT 'draft'
                     CHECK (status IN ('draft', 'published')),
  -- SEO overrides. If null, the public pages fall back to title/excerpt.
  meta_title       TEXT,
  meta_description TEXT,
  published_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS posts_status_pub_idx
  ON posts (status, published_at DESC);

-- Redirects (Phase 2). Used to 301 old Webflow URLs to new slugs so we do not
-- lose links or SEO when migrating. `from_path` is the old path (e.g.
-- '/blog/old-slug'); `to_path` is where it should go now.
CREATE TABLE IF NOT EXISTS redirects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_path   TEXT NOT NULL UNIQUE,
  to_path     TEXT NOT NULL,
  status_code INTEGER NOT NULL DEFAULT 301,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
