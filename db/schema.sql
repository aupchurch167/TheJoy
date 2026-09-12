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
                     CHECK (status IN ('draft', 'scheduled', 'published')),
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

-- ==========================================================================
-- Phase 3: lead nurture emails + source attribution
-- ==========================================================================

-- Lifecycle stage, so we can report booked-tours / move-ins by source.
-- ADD COLUMN IF NOT EXISTS keeps this safe to re-run on an existing leads table.
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS stage TEXT NOT NULL DEFAULT 'new'
    CHECK (stage IN ('new', 'toured', 'moved_in', 'lost'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS stage_updated_at TIMESTAMPTZ;

-- Nurture drip position. drip_step = how many drip emails this lead has been
-- sent; drip_status controls whether the drip keeps running.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS drip_step INTEGER NOT NULL DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS drip_status TEXT NOT NULL DEFAULT 'active'
  CHECK (drip_status IN ('active', 'completed', 'paused'));
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_drip_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS leads_stage_idx ON leads (stage);

-- One-off / scheduled emails the admin composes and sends to the leads audience.
-- Body is Markdown (rendered to HTML at send time). status flows
-- draft -> scheduled -> sending -> sent.
CREATE TABLE IF NOT EXISTS broadcasts (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject       TEXT NOT NULL,
  body          TEXT NOT NULL DEFAULT '',
  audience      TEXT NOT NULL DEFAULT 'leads'
                  CHECK (audience IN ('leads', 'families')),
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'scheduled', 'sending', 'sent')),
  scheduled_at  TIMESTAMPTZ,
  sent_at       TIMESTAMPTZ,
  sent_count    INTEGER NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS broadcasts_status_idx ON broadcasts (status, scheduled_at);

-- Per-recipient log, for idempotency (never send the same broadcast twice to
-- one lead) and for reporting.
CREATE TABLE IF NOT EXISTS broadcast_recipients (
  broadcast_id UUID NOT NULL REFERENCES broadcasts(id) ON DELETE CASCADE,
  lead_id      UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  sent_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  error        TEXT,
  PRIMARY KEY (broadcast_id, lead_id)
);

-- ==========================================================================
-- Phase 4: family communications + photo gallery
-- ==========================================================================

-- The `leads` table doubles as the SUBSCRIBERS table. `audience` separates
-- the two groups: 'leads' (families researching Joy) and 'families' (current
-- residents' families, added by an admin, opt-in). Both share unsubscribe.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS audience TEXT NOT NULL DEFAULT 'leads'
  CHECK (audience IN ('leads', 'families'));
CREATE INDEX IF NOT EXISTS leads_audience_idx ON leads (audience);

-- Family directory fields (families audience): which resident the contact
-- belongs to, their relation to that resident, and whether the resident is
-- currently active (living at Joy). Family contacts may have only a phone, so
-- email is made optional; sends already skip rows without an email.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS resident_name TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS relation TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE leads ALTER COLUMN email DROP NOT NULL;

-- SMS (text blasts via Quo). Texting requires separate, explicit consent
-- (TCPA), so it defaults to FALSE and an admin opts each contact in. Opt-outs
-- are recorded so a contact who replies STOP is never texted again.
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_consent BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS sms_opt_out_at TIMESTAMPTZ;

-- Existing Phase 3 databases created broadcasts with a leads-only audience
-- check. Widen it so family broadcasts are allowed.
ALTER TABLE broadcasts DROP CONSTRAINT IF EXISTS broadcasts_audience_check;
ALTER TABLE broadcasts
  ADD CONSTRAINT broadcasts_audience_check CHECK (audience IN ('leads', 'families'));

-- Recipient segment (JSON): drill into the audience by source, stage, and
-- creation date. NULL / {} means the whole audience. Resolved at send time so
-- it always reflects current opt-outs.
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS filters JSONB;

-- Engagement + delivery tracking (fed by the Resend webhook). provider_message_id
-- is the id Resend returns at send time; the webhook matches events back to the
-- recipient by it. The timestamps power the per-broadcast results view; a bounce
-- or complaint also suppresses the lead (see the webhook route).
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS provider_message_id TEXT;
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS opened_at TIMESTAMPTZ;
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMPTZ;
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS bounced_at TIMESTAMPTZ;
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS complained_at TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS broadcast_recipients_msgid_idx
  ON broadcast_recipients (provider_message_id);

-- A follow-up "resend to non-openers": when set, this broadcast targets the
-- recipients of the parent broadcast who did NOT open it (resolved at send time,
-- so it still honors new opt-outs). Its own subject is usually different.
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS resend_of UUID
  REFERENCES broadcasts(id) ON DELETE SET NULL;

-- Saved recipient segments: name a set of filters ("A Place for Mom, still new")
-- so a broadcast can reuse it instead of rebuilding the filters each time.
CREATE TABLE IF NOT EXISTS saved_segments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  audience   TEXT NOT NULL DEFAULT 'leads',
  filters    JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Broadcasts can be email or SMS (text blast). The subject is unused for SMS.
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email'
  CHECK (channel IN ('email', 'sms'));

-- Text-blast safety gate: a family blast is only allowed after that exact
-- message was test-sent to the owners/admins. One row per tested message
-- (keyed by a hash of the content); tested_at gates how recent it must be.
CREATE TABLE IF NOT EXISTS sms_tests (
  body_hash  TEXT PRIMARY KEY,
  tested_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Public photo gallery. Real photos only (uploaded via admin). posted_at drives
-- the public ordering.
CREATE TABLE IF NOT EXISTS photos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url  TEXT NOT NULL,
  image_alt  TEXT,
  caption    TEXT,
  posted_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS photos_posted_idx ON photos (posted_at DESC);

-- ==========================================================================
-- Phase 5: automation + cron + polish
-- ==========================================================================

-- Existing databases created posts with a draft/published-only status check.
-- Widen it so posts can be 'scheduled' (published_at in the future; the cron
-- promotes them to 'published' when due).
ALTER TABLE posts DROP CONSTRAINT IF EXISTS posts_status_check;
ALTER TABLE posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'published'));

-- Nightly SEO rank snapshots (trend view). One row per keyword per check.
-- position is NULL when the domain was not found in the results. url is the
-- ranking page found (if any).
CREATE TABLE IF NOT EXISTS rank_snapshots (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword    TEXT NOT NULL,
  position   INTEGER,
  url        TEXT,
  checked_on DATE NOT NULL DEFAULT (now() AT TIME ZONE 'UTC')::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One snapshot per keyword per day (re-running the cron just updates it).
CREATE UNIQUE INDEX IF NOT EXISTS rank_snapshots_kw_day
  ON rank_snapshots (keyword, checked_on);
CREATE INDEX IF NOT EXISTS rank_snapshots_kw_idx
  ON rank_snapshots (keyword, checked_on DESC);

-- ==========================================================================
-- Change Set 01: admin-editable site settings
-- ==========================================================================

-- General key/value store for values that should not be hardcoded (contact
-- facts, the careers link, the tour link). The admin Site Settings screen edits
-- these; header/footer/pages read them at render time. Adding a future key
-- needs no code: insert a row here (or via the admin screen once a key exists).
CREATE TABLE IF NOT EXISTS site_settings (
  key        TEXT PRIMARY KEY,
  value      TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed the known keys. DO NOTHING keeps existing edited values on re-run.
-- careers_url and talkfurther_url are seeded blank on purpose: the app falls
-- back to a sensible default for each (the current Indeed posting / the tour
-- link) when the stored value is empty, and Adam can override either in the
-- admin screen.
INSERT INTO site_settings (key, value) VALUES
  ('phone',           '(470) 684-3569'),
  ('email',           'hello@joyseniorcare.com'),
  ('address',         '434 Conyers Rd, Loganville, GA 30052'),
  ('careers_url',     ''),
  ('talkfurther_url', '')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================================
-- Change Set 02: deposit requests (PayPal invoices)
-- ==========================================================================

-- Each row is a deposit the office asked a family to pay, sent as a PayPal
-- invoice. PayPal hosts the payment page and emails the recipient; we keep a
-- local record so the admin Deposits screen shows history and paid/unpaid
-- status. lead_id links back to the person in `leads` when the request started
-- from there (nullable: a deposit can go to an email that is not yet a lead).
-- amount_cents avoids floating-point money; format for display in the app.
CREATE TABLE IF NOT EXISTS deposit_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id             UUID REFERENCES leads(id) ON DELETE SET NULL,
  recipient_name      TEXT NOT NULL,
  recipient_email     TEXT NOT NULL,
  recipient_phone     TEXT,
  amount_cents        INTEGER NOT NULL,
  currency            TEXT NOT NULL DEFAULT 'USD',
  note                TEXT,
  -- Which processor sent it (only 'paypal' today; column keeps the door open).
  provider            TEXT NOT NULL DEFAULT 'paypal',
  provider_invoice_id TEXT,
  invoice_number      TEXT,
  -- Payer-facing hosted invoice URL (from PayPal), handy for a manual re-send.
  invoice_url         TEXT,
  -- Collapsed status: sent | paid | partially_paid | cancelled | refunded | draft.
  status              TEXT NOT NULL DEFAULT 'sent',
  created_by          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at             TIMESTAMPTZ,
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Local-only: hides the row from the default list (PayPal has no "archive").
  archived_at         TIMESTAMPTZ
);

-- For databases created before these columns existed.
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE deposit_requests ADD COLUMN IF NOT EXISTS recipient_phone TEXT;

CREATE INDEX IF NOT EXISTS deposit_requests_created_idx
  ON deposit_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS deposit_requests_invoice_idx
  ON deposit_requests (provider_invoice_id);
CREATE INDEX IF NOT EXISTS deposit_requests_status_idx
  ON deposit_requests (status);

-- Deposit settings: the default amount (dollars) the form pre-fills, and an
-- optional note shown to the recipient on every invoice. Seeded blank note.
INSERT INTO site_settings (key, value) VALUES
  ('deposit_amount', '500'),
  ('deposit_note',   '')
ON CONFLICT (key) DO NOTHING;

-- ==========================================================================
-- Change Set 02: family feedback + review funnel
-- ==========================================================================

-- A survey invitation to one family. The token is the survey URL secret; the
-- request is stamped sent_at when emailed and completed_at when the family
-- finishes (even anonymously). created_by is the admin who sent it.
CREATE TABLE IF NOT EXISTS feedback_requests (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_name         TEXT NOT NULL,
  family_email        TEXT NOT NULL,
  resident_first_name TEXT,
  token               TEXT UNIQUE NOT NULL,
  sent_at             TIMESTAMPTZ,
  completed_at        TIMESTAMPTZ,
  created_by          TEXT NOT NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS feedback_requests_created_idx
  ON feedback_requests (created_at DESC);

-- One survey response. request_id is NULL when the family chose anonymity, so
-- their answers can never be tied back to them. sentiment is 'positive' (4-5)
-- or 'concern' (1-3), computed at submit.
CREATE TABLE IF NOT EXISTS feedback_responses (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id      UUID REFERENCES feedback_requests(id),
  overall_rating  INT NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  -- Optional dimension taps: 1 = Needs work, 2 = Okay, 3 = Great.
  rating_care          INT CHECK (rating_care BETWEEN 1 AND 3),
  rating_communication INT CHECK (rating_communication BETWEEN 1 AND 3),
  rating_dining        INT CHECK (rating_dining BETWEEN 1 AND 3),
  rating_home_feel     INT CHECK (rating_home_feel BETWEEN 1 AND 3),
  rating_engagement    INT CHECK (rating_engagement BETWEEN 1 AND 3),
  -- 'definitely' | 'probably' | 'not_sure' | 'no'
  would_recommend TEXT,
  going_well      TEXT,
  could_be_better TEXT,
  suggestions     TEXT,
  is_anonymous    BOOLEAN NOT NULL DEFAULT false,
  sentiment       TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
-- Safe to re-run on a DB created before the dimension columns existed.
ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS rating_care INT;
ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS rating_communication INT;
ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS rating_dining INT;
ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS rating_home_feel INT;
ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS rating_engagement INT;
ALTER TABLE feedback_responses ADD COLUMN IF NOT EXISTS would_recommend TEXT;
CREATE INDEX IF NOT EXISTS feedback_responses_created_idx
  ON feedback_responses (created_at DESC);

-- A request for a personal callback (from the concern path). Holds contact
-- info even when the underlying response is anonymous.
CREATE TABLE IF NOT EXISTS callback_requests (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id    UUID REFERENCES feedback_responses(id),
  contact_name   TEXT NOT NULL,
  contact_phone  TEXT NOT NULL,
  preferred_time TEXT,
  status         TEXT NOT NULL DEFAULT 'open'
                   CHECK (status IN ('open', 'contacted', 'resolved')),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS callback_requests_status_idx
  ON callback_requests (status, created_at DESC);

-- Widen the lead lifecycle to include 'deceased' (a resident who has passed).
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_stage_check;
ALTER TABLE leads ADD CONSTRAINT leads_stage_check
  CHECK (stage IN ('new', 'toured', 'moved_in', 'lost', 'deceased'));

-- Survey requests can go out by email and/or text now. Record which channel(s)
-- were used and the phone we texted, so the once-a-month guardrail can look at
-- both. Email is no longer required (a text-only family may have no email).
ALTER TABLE feedback_requests
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'email';
ALTER TABLE feedback_requests
  ADD COLUMN IF NOT EXISTS family_phone TEXT;
ALTER TABLE feedback_requests ALTER COLUMN family_email DROP NOT NULL;
-- The guardrail (and cadence) query filters requests by recency, per contact.
CREATE INDEX IF NOT EXISTS feedback_requests_email_created_idx
  ON feedback_requests (lower(family_email), created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_requests_phone_created_idx
  ON feedback_requests (family_phone, created_at DESC);

-- ==========================================================================
-- Joy Email v1: Message identity + message-level duplicate protection +
-- suppression list. Evolves the broadcasts system: a broadcast is a Send; the
-- reusable content is a Message. The hard rule "a contact receives a given
-- Message once, ever" is enforced at the DATABASE, not just the UI.
-- ==========================================================================

-- Reusable email content. Composing an email creates a Message; each dispatch
-- (a broadcast) points at one. Duplicating a Message (template_of set) yields a
-- new id, which is how an intentional re-send escapes the once-per-Message rule.
CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject     TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  template_of UUID REFERENCES messages(id) ON DELETE SET NULL,
  is_template BOOLEAN NOT NULL DEFAULT FALSE,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS message_id UUID
  REFERENCES messages(id);

-- Backfill: give every existing broadcast its own Message (idempotent; only
-- touches broadcasts not yet linked).
DO $$
DECLARE b RECORD; mid UUID;
BEGIN
  FOR b IN SELECT id, subject, body, created_at FROM broadcasts WHERE message_id IS NULL LOOP
    INSERT INTO messages (subject, body, created_at, updated_at)
      VALUES (COALESCE(b.subject, ''), COALESCE(b.body, ''), b.created_at, b.created_at)
      RETURNING id INTO mid;
    UPDATE broadcasts SET message_id = mid WHERE id = b.id;
  END LOOP;
END $$;

-- Per-recipient log carries the Message id so the once-per-Message rule spans
-- every Send of that Message.
ALTER TABLE broadcast_recipients ADD COLUMN IF NOT EXISTS message_id UUID;
UPDATE broadcast_recipients br SET message_id = b.message_id
  FROM broadcasts b WHERE br.broadcast_id = b.id AND br.message_id IS NULL;

-- THE guarantee: one (message, contact) row, ever. A second attempt to send the
-- same Message to the same contact is rejected by the database.
CREATE UNIQUE INDEX IF NOT EXISTS broadcast_recipients_message_lead_uidx
  ON broadcast_recipients (message_id, lead_id) WHERE message_id IS NOT NULL;

-- Suppression list. An address here is NEVER emailed, no override. Reasons:
-- 'unsubscribe', 'bounce', 'complaint', 'deceased', 'manual'. Keyed by the
-- lowercased email so the check is exact regardless of how it was typed.
CREATE TABLE IF NOT EXISTS suppressions (
  email      TEXT PRIMARY KEY,
  reason     TEXT NOT NULL,
  note       TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS suppressions_reason_idx ON suppressions (reason);

-- Emails can be authored as Markdown (the letter templates) or as designed HTML
-- (Claude-built, email-safe inner HTML for birthdays and other special sends).
-- The Joy letter shell (letterhead, badges, unsubscribe footer) wraps either.
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS body_format TEXT NOT NULL DEFAULT 'markdown'
  CHECK (body_format IN ('markdown', 'html'));

-- Designed HTML can also be sent STANDALONE (a complete document, no Joy letter
-- shell) for pieces like the birthday party invite that carry their own header
-- and footer. Widen the format check to allow it.
ALTER TABLE broadcasts DROP CONSTRAINT IF EXISTS broadcasts_body_format_check;
ALTER TABLE broadcasts ADD CONSTRAINT broadcasts_body_format_check
  CHECK (body_format IN ('markdown', 'html', 'html_standalone'));

-- ==========================================================================
-- Events: create an event, send tokenized invite/reminder emails, collect
-- RSVPs from families/friends/partners on a public form, see who is coming.
-- ==========================================================================

CREATE TABLE IF NOT EXISTS events (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  location    TEXT,                        -- e.g. "Joy Senior Living, Loganville"
  starts_at   TIMESTAMPTZ,                 -- event date + start time
  ends_at     TIMESTAMPTZ,                 -- optional end time
  capacity    INTEGER,                     -- optional headcount cap (null = no cap)
  -- Public RSVP link token. Lowercase hex so it survives the path-lowercasing
  -- middleware, like the feedback tokens.
  rsvp_token  TEXT UNIQUE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published', 'cancelled')),
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS events_starts_idx ON events (starts_at DESC);

-- One RSVP per person (per email) per event; re-submitting updates their answer.
-- Walk-ins without an email are always new rows.
CREATE TABLE IF NOT EXISTS event_rsvps (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id   UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT,
  phone      TEXT,
  response   TEXT NOT NULL DEFAULT 'yes'
               CHECK (response IN ('yes', 'no', 'maybe')),
  guests     INTEGER NOT NULL DEFAULT 0,   -- additional guests beyond themselves
  note       TEXT,
  lead_id    UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_rsvps_event_idx ON event_rsvps (event_id, created_at DESC);
-- Upsert key: one row per (event, email) when an email is given.
CREATE UNIQUE INDEX IF NOT EXISTS event_rsvps_event_email_uidx
  ON event_rsvps (event_id, lower(email)) WHERE email IS NOT NULL;

-- Studio email composer: keep the structured EmailModel alongside the rendered
-- HTML so a draft can be reopened and re-themed (a look swap re-skins the same
-- words). Null for broadcasts composed the old way (Markdown / pasted HTML).
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS model_json JSONB;

-- Event Studio: a look (theme) that styles both the RSVP page and the invite
-- email, plus optional potluck details. RSVPs can note what they're bringing.
ALTER TABLE events ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'classic';
ALTER TABLE events ADD COLUMN IF NOT EXISTS is_potluck BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE events ADD COLUMN IF NOT EXISTS potluck_ask TEXT;
ALTER TABLE event_rsvps ADD COLUMN IF NOT EXISTS bringing TEXT;

-- Priority sends: event emails (invites, reminders, updates) jump ahead of the
-- throttled marketing queue. Priority broadcasts send in full, immediately,
-- ignoring the hourly cap and the daytime send window. Marketing = FALSE.
ALTER TABLE broadcasts ADD COLUMN IF NOT EXISTS priority BOOLEAN NOT NULL DEFAULT FALSE;
CREATE INDEX IF NOT EXISTS broadcasts_due_priority_idx
  ON broadcasts (priority DESC, scheduled_at)
  WHERE status = 'scheduled' AND channel = 'email';

-- ==========================================================================
-- Phase 6: employee (team) feedback — internal pulse surveys
-- ==========================================================================

-- The staff roster. Kept separate from `leads` (families) so the two audiences
-- never mix in a send. external_source / external_id let a later Connecteam or
-- Gusto sync reconcile rows without creating duplicate people.
CREATE TABLE IF NOT EXISTS employees (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  email           TEXT,
  phone           TEXT,
  title           TEXT,
  active          BOOLEAN NOT NULL DEFAULT TRUE,
  sms_consent     BOOLEAN NOT NULL DEFAULT FALSE,
  external_source TEXT,   -- 'manual' | 'csv' | 'connecteam' | 'gusto'
  external_id     TEXT,   -- vendor user id, for sync reconciliation
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS employees_email_uidx
  ON employees (lower(email)) WHERE email IS NOT NULL AND email <> '';
CREATE UNIQUE INDEX IF NOT EXISTS employees_external_uidx
  ON employees (external_source, external_id)
  WHERE external_source IS NOT NULL AND external_id IS NOT NULL;

-- A survey campaign: the questions plus whether responses are anonymous.
-- `questions` is a JSON array of { key, label, type } where type is
-- 'rating' (1..5) or 'text'. `anonymous` decides, at submit time, whether a
-- response links back to the employee who sent it.
CREATE TABLE IF NOT EXISTS employee_surveys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  intro         TEXT NOT NULL DEFAULT '',
  questions     JSONB NOT NULL DEFAULT '[]',
  anonymous     BOOLEAN NOT NULL DEFAULT TRUE,
  status        TEXT NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'open', 'closed')),
  created_by    TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at     TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS employee_surveys_status_idx
  ON employee_surveys (status, created_at DESC);

-- One invite per employee per survey. The token is how they reach the form.
-- On an anonymous survey these rows still track sent/completed (for response
-- rate) but the employee_id is never copied into the response row.
CREATE TABLE IF NOT EXISTS employee_survey_recipients (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     UUID NOT NULL REFERENCES employee_surveys(id) ON DELETE CASCADE,
  employee_id   UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  token         TEXT NOT NULL UNIQUE,
  channel       TEXT NOT NULL DEFAULT 'email'
                  CHECK (channel IN ('email', 'sms', 'both')),
  sent_at       TIMESTAMPTZ,
  completed_at  TIMESTAMPTZ,
  UNIQUE (survey_id, employee_id)
);

-- A submitted response. employee_id is NULL for anonymous surveys; on a named
-- survey it points at the employee. `answers` is { question_key: value }.
CREATE TABLE IF NOT EXISTS employee_survey_responses (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     UUID NOT NULL REFERENCES employee_surveys(id) ON DELETE CASCADE,
  employee_id   UUID REFERENCES employees(id) ON DELETE SET NULL,
  answers       JSONB NOT NULL DEFAULT '{}',
  comment       TEXT,
  sentiment     TEXT CHECK (sentiment IN ('positive', 'concern')),
  submitted_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS employee_survey_responses_survey_idx
  ON employee_survey_responses (survey_id);

-- Small key/value store for integration bookkeeping (e.g. the last Connecteam
-- roster sync: when it ran and what it changed). Keyed by a short string.
CREATE TABLE IF NOT EXISTS integration_state (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ==========================================================================
-- Phase 6b: employee lifecycle (onboarding + exit) and recognition dates
-- ==========================================================================

-- Hire date drives work anniversaries + onboarding check-in timing; birth date
-- drives birthday reminders. Pulled from Connecteam custom fields when present
-- (hire date falls back to when they were added); editable by hand otherwise.
ALTER TABLE employees ADD COLUMN IF NOT EXISTS hire_date  DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS birth_date DATE;

-- Surveys gain a kind so onboarding/exit templates can be auto-enrolled and
-- time-sent, while ordinary pulse surveys keep working exactly as before.
--   kind            'pulse' (manual), 'onboarding' (timed after hire), 'exit'
--   system_key      stable id for a seeded template (e.g. 'onboarding_30')
--   send_offset_days for onboarding: days after hire to send this step
--   auto_enroll     whether new hires / leavers are enrolled automatically
ALTER TABLE employee_surveys ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'pulse';
ALTER TABLE employee_surveys ADD COLUMN IF NOT EXISTS system_key TEXT;
ALTER TABLE employee_surveys ADD COLUMN IF NOT EXISTS send_offset_days INT;
ALTER TABLE employee_surveys ADD COLUMN IF NOT EXISTS auto_enroll BOOLEAN NOT NULL DEFAULT FALSE;
-- Plain (not partial) unique index so it can be an ON CONFLICT target. NULLs do
-- not collide, so ordinary pulse surveys (system_key NULL) are unaffected.
CREATE UNIQUE INDEX IF NOT EXISTS employee_surveys_system_key_uidx
  ON employee_surveys (system_key);

-- A recipient can be scheduled: send_after NULL means "send on manual trigger"
-- (the original pulse behavior); a timestamp means the cron sends it once due.
ALTER TABLE employee_survey_recipients
  ADD COLUMN IF NOT EXISTS send_after TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS employee_survey_recipients_due_idx
  ON employee_survey_recipients (send_after)
  WHERE sent_at IS NULL AND send_after IS NOT NULL;

-- Pulse surveys can target a subset of the roster. NULL = everyone. Otherwise a
-- small spec: {"mode":"titles","titles":[...]} or {"mode":"ids","ids":[...]}.
ALTER TABLE employee_surveys ADD COLUMN IF NOT EXISTS audience JSONB;

-- Event page copy: optional richer text for the public RSVP page. body_heading
-- sits above the description; what_to_expect is a second labeled block; and
-- closing_note shows under the RSVP form (parking, what to bring, who to call).
ALTER TABLE events ADD COLUMN IF NOT EXISTS body_heading   TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS what_to_expect TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS closing_note   TEXT;

-- ============================================================================
-- Partners CRM (referral-source outreach). Separate from leads (family
-- inquiries) and families (current residents). Adam + Mellissa track hospitals,
-- hospice, home health, SNFs, placement agencies, faith communities, and PCPs
-- they stay in touch with for referrals, and log a "touch" in under 30 seconds.
-- ============================================================================

-- One referral source. `status` drives the pipeline pill; `tier` (A/B/C) ranks
-- effort; `owner` is who calls (adam | mellissa | both). A single next_action /
-- next_date is the "what's next" nudge shown in the list (reminders are extra,
-- personal nudges kept in partner_reminders and do NOT touch these fields).
CREATE TABLE IF NOT EXISTS partners (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization   TEXT NOT NULL,
  category       TEXT NOT NULL DEFAULT 'other',
  tier           TEXT,                         -- 'A' | 'B' | 'C' | NULL
  status         TEXT NOT NULL DEFAULT 'not_contacted',
  contact_name   TEXT,
  contact_role   TEXT,
  phone          TEXT,
  email          TEXT,
  website        TEXT,
  service_area   TEXT,
  owner          TEXT NOT NULL DEFAULT 'both', -- 'adam' | 'mellissa' | 'both'
  next_action    TEXT,
  next_date      DATE,
  notes          TEXT,
  source         TEXT,                         -- how we found them / import batch
  last_touch_at  TIMESTAMPTZ,                  -- set by the activity log
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partners_status_idx    ON partners (status);
CREATE INDEX IF NOT EXISTS partners_owner_idx     ON partners (owner);
CREATE INDEX IF NOT EXISTS partners_tier_idx      ON partners (tier);
CREATE INDEX IF NOT EXISTS partners_category_idx  ON partners (category);
CREATE INDEX IF NOT EXISTS partners_next_date_idx ON partners (next_date);
-- Case-insensitive org lookup for import dedupe (by organization name).
CREATE INDEX IF NOT EXISTS partners_org_idx       ON partners (lower(organization));

-- Timeline of touches. Each row is one logged interaction. call_* are only set
-- for calls; status_change records the status this touch moved the partner to
-- (NULL when the touch left status alone), for an auditable history.
CREATE TABLE IF NOT EXISTS partner_activities (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id    UUID NOT NULL REFERENCES partners (id) ON DELETE CASCADE,
  type          TEXT NOT NULL DEFAULT 'call', -- call|email|text|visit|tour|materials|other
  note          TEXT,
  call_outcome  TEXT,                         -- connected|voicemail|no_answer|busy
  call_duration TEXT,                         -- free text, e.g. "4 min"
  status_change TEXT,                         -- new status if this touch changed it
  logged_by     TEXT,                         -- admin email/name who logged it
  logged_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_activities_partner_idx
  ON partner_activities (partner_id, logged_at DESC);

-- Personal reminders (nudges) on a partner. Distinct from next_action/next_date:
-- a partner can have many open reminders. Checking one marks it done (kept, not
-- deleted) so the history stays.
CREATE TABLE IF NOT EXISTS partner_reminders (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id  UUID NOT NULL REFERENCES partners (id) ON DELETE CASCADE,
  label       TEXT NOT NULL,
  due_date    DATE,
  done        BOOLEAN NOT NULL DEFAULT FALSE,
  done_at     TIMESTAMPTZ,
  created_by  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_reminders_partner_idx
  ON partner_reminders (partner_id, done, due_date);

-- Referrals a partner has actually sent us (outcomes tracked at the family level
-- by an initials/label only, never a full name here).
CREATE TABLE IF NOT EXISTS partner_referrals (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id   UUID NOT NULL REFERENCES partners (id) ON DELETE CASCADE,
  occurred_on  DATE NOT NULL DEFAULT current_date,
  family_label TEXT,
  outcome      TEXT NOT NULL DEFAULT 'inquiry', -- inquiry|tour|admitted|not_a_fit
  notes        TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS partner_referrals_partner_idx
  ON partner_referrals (partner_id, occurred_on DESC);
