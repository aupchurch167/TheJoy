# Reviews Integration API (for GrokBot and other agents)

This lets an external agent submit reviews and per-platform profile info, and
read back what's stored, using a scoped API key. **Nothing an agent submits goes
live automatically** — every review lands as `pending` and an admin approves it
at `/admin/reviews`. The key only reaches this endpoint; it never grants admin
or session access.

## Setup (Joy operator)

1. Generate a long random key, e.g. `openssl rand -hex 24`.
2. In Railway, set the env var **`INTEGRATION_API_KEYS`**, one account per line:

   ```
   grokbot | k_<the-long-random-key>
   ```

   You can add more lines for more agents. **Revoke** a key by deleting its line
   and redeploying.
3. Give the agent only its key (the part after `|`) and the endpoint URL.

## Endpoint

```
https://www.joyseniorcare.com/api/integrations/reviews
```

Authenticate every request with the key:

```
Authorization: Bearer k_<the-long-random-key>
```

(An `X-API-Key: <key>` header also works.)

## POST — submit reviews and/or source profiles

Body (JSON). Provide `reviews`, `sources`, or both:

```json
{
  "reviews": [
    {
      "source": "google",
      "external_id": "ChZ...review-id",
      "author": "Karen D.",
      "rating": 5,
      "body": "The first month here I slept through the night.",
      "review_date": "2026-08-14",
      "url": "https://www.google.com/maps/.../reviews"
    }
  ],
  "sources": [
    {
      "source": "apfm",
      "profile_url": "https://www.aplaceformom.com/community/the-joy-...",
      "rating_value": "5.0",
      "badge_label": "Best of Senior Living"
    }
  ]
}
```

Field notes:

- `source` — `google`, `apfm`, `caring`, or `other` (aliases like
  "A Place for Mom" are normalized). Required on each item.
- `external_id` — the platform's review id. Strongly recommended: it lets a
  re-submission **update the same review in place** instead of creating a
  duplicate. Re-submitting never changes a review's approval status.
- `rating` — number 0–5 (optional).
- `body` — the review text (required, up to 10000 chars).
- `review_date` — `YYYY-MM-DD` (optional).

Limits: up to 500 reviews and 20 sources per request.

Response:

```json
{
  "ok": true,
  "reviews": { "created": 3, "updated": 1 },
  "sources": { "upserted": 1 },
  "note": "Reviews are pending until an admin approves them in /admin/reviews."
}
```

## GET — read current reviews and sources (to reconcile / dedupe)

```
GET /api/integrations/reviews            # all reviews + sources
GET /api/integrations/reviews?status=published
```

Returns each review's `id`, `source`, `external_id`, `author`, `rating`, `body`,
`review_date`, `url`, and `status`, plus the source profiles. Use `external_id`
to avoid resubmitting reviews you've already sent.

## Which platforms can actually be pulled?

- **Google** has an official Business Profile API — real reviews can be fetched
  by the agent and pushed here.
- **A Place for Mom** and **Caring.com** do **not** offer a public review API.
  For those, submit the **profile URL and the award/rating badge** via `sources`
  (and any review text only if you have the right to use it). Do not scrape in a
  way that violates their terms.

## Errors

- `401` — missing/invalid key.
- `400` — invalid JSON or payload.
- `503` — `INTEGRATION_API_KEYS` not set, or no database configured.
