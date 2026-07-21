import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { insertLead, leadExists } from "@/lib/leads";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * TalkFurther webhook reconciliation (Phase 5). TalkFurther captures its own
 * leads; this pipes them into our Postgres `leads` so attribution reporting
 * sees every source in one place (closes the two-silo gap from Phase 1).
 *
 * TalkFurther leads are tagged source='talkfurther' and are NOT enrolled in our
 * nurture drip (they already have TalkFurther's own follow-up). They still show
 * in the leads list, attribution, and the families/leads broadcasts.
 *
 * SECURITY: requires TALKFURTHER_WEBHOOK_SECRET. Send it as a Bearer token, an
 * "x-webhook-secret" header, or "?key=<secret>". TalkFurther's exact payload
 * shape can vary, so field extraction is forgiving (name/email/phone/message).
 */

const SOURCE = "talkfurther";

function authorized(request: Request): boolean {
  const secret = process.env.TALKFURTHER_WEBHOOK_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  if (auth === `Bearer ${secret}`) return true;
  if (request.headers.get("x-webhook-secret") === secret) return true;
  return new URL(request.url).searchParams.get("key") === secret;
}

function pick(obj: Record<string, unknown>, keys: string[]): string {
  for (const k of Object.keys(obj)) {
    if (keys.includes(k.toLowerCase())) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number") return String(v);
    }
  }
  return "";
}

export async function POST(request: Request) {
  if (!process.env.TALKFURTHER_WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Webhook not configured." },
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

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON." }, { status: 400 });
  }

  // Some webhooks nest the record under `data`/`lead`/`contact`.
  const record =
    (body.data as Record<string, unknown>) ||
    (body.lead as Record<string, unknown>) ||
    (body.contact as Record<string, unknown>) ||
    body;

  const email = pick(record, ["email", "emailaddress", "email_address"]);
  const name =
    pick(record, ["name", "fullname", "full_name"]) ||
    [pick(record, ["firstname", "first_name"]), pick(record, ["lastname", "last_name"])]
      .filter(Boolean)
      .join(" ");
  const phone = pick(record, ["phone", "phonenumber", "phone_number", "tel"]);
  const message = pick(record, ["message", "notes", "comment", "inquiry"]);

  if (!email) {
    return NextResponse.json(
      { ok: false, error: "No email in payload." },
      { status: 400 }
    );
  }

  try {
    // Idempotent: ignore repeat deliveries for the same TalkFurther lead.
    if (await leadExists(SOURCE, email)) {
      return NextResponse.json({ ok: true, duplicate: true });
    }
    await insertLead({
      name: name || "TalkFurther lead",
      email,
      phone: phone || null,
      message: message || null,
      source: SOURCE,
      dripStatus: "completed", // don't double up on TalkFurther's own sequence
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[talkfurther] insert failed:", err);
    return NextResponse.json(
      { ok: false, error: "Could not store lead." },
      { status: 500 }
    );
  }
}
