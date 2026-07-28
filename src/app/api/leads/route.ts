import { NextResponse } from "next/server";
import { z } from "zod";
import { hasDatabase } from "@/lib/db";
import { insertLead } from "@/lib/leads";
import { notifyNewLead } from "@/lib/email";
import { enrollLead } from "@/lib/drip";

// Always run on the Node runtime (pg needs Node, not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LeadSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name.").max(120),
  email: z.string().trim().email("Please enter a valid email.").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  message: z.string().trim().max(2000).optional().or(z.literal("")),
  consent: z.boolean().optional(),
  // Where the form lives, for attribution. Sanitized to an allowlist below.
  source: z.string().trim().max(40).optional(),
  // Honeypot: real people leave this empty; bots fill it.
  company: z.string().max(0).optional(),
});

// Only these form sources are trusted; anything else falls back to homepage.
const FORM_SOURCES = new Set(["homepage_form", "services_form", "blog_form"]);

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request." },
      { status: 400 }
    );
  }

  const parsed = LeadSchema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message || "Please check the form.";
    return NextResponse.json({ ok: false, error: first }, { status: 400 });
  }

  // Silently accept honeypot hits so bots think they succeeded.
  if (parsed.data.company && parsed.data.company.length > 0) {
    return NextResponse.json({ ok: true });
  }

  if (!hasDatabase()) {
    // No DB yet: don't lose the lead silently, and don't 500 the user.
    console.error(
      "[leads] DATABASE_URL not set. Lead not stored:",
      parsed.data.email
    );
    return NextResponse.json(
      {
        ok: false,
        error:
          "We could not save your message just now. Please call us at (470) 684-3569 and we will help right away.",
      },
      { status: 503 }
    );
  }

  try {
    const source =
      parsed.data.source && FORM_SOURCES.has(parsed.data.source)
        ? parsed.data.source
        : "homepage_form";

    const lead = await insertLead({
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      message: parsed.data.message || null,
      source,
      consent: parsed.data.consent ?? true,
    });

    // Enroll in the nurture drip (sends the welcome now) and alert the team.
    // Best-effort; a mail failure must not fail the submission.
    await Promise.allSettled([enrollLead(lead), notifyNewLead(lead)]);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[leads] Failed to store lead:", err);
    return NextResponse.json(
      {
        ok: false,
        error:
          "Something went wrong on our end. Please call us at (470) 684-3569.",
      },
      { status: 500 }
    );
  }
}
