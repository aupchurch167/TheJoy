import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { runDrip } from "@/lib/drip";
import { processDueBroadcasts } from "@/lib/broadcast-runner";
import { publishDueScheduledPosts } from "@/lib/posts";
import { recordRanks } from "@/lib/ranks";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * The scheduled worker. Railway cron hits this on an interval (see OPERATIONS).
 * It sends due drip steps and scheduled broadcasts (honoring opt-outs),
 * publishes any scheduled posts whose time has come, and logs SEO ranks.
 *
 * SECURITY: requires CRON_SECRET. Send it as "Authorization: Bearer <secret>"
 * or "?key=<secret>". Without CRON_SECRET set, the endpoint refuses to run so
 * it can never be triggered anonymously.
 */
function authorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  const url = new URL(request.url);
  return url.searchParams.get("key") === secret;
}

async function handle(request: Request) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET is not configured." },
      { status: 503 }
    );
  }
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "Not authorized." }, { status: 401 });
  }
  if (!hasDatabase()) {
    return NextResponse.json(
      { ok: false, error: "No database configured." },
      { status: 503 }
    );
  }

  // Publish scheduled posts first (cheap), then send email, then log ranks.
  const postsPublished = await publishDueScheduledPosts();
  const [dripSent, broadcastSent] = await Promise.all([
    runDrip(),
    processDueBroadcasts(),
  ]);
  const ranksLogged = await recordRanks();

  return NextResponse.json({
    ok: true,
    postsPublished,
    dripSent,
    broadcastSent,
    ranksLogged,
  });
}

export async function GET(request: Request) {
  return handle(request);
}
export async function POST(request: Request) {
  return handle(request);
}
