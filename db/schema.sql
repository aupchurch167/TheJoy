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
