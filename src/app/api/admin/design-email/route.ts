import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/require-admin";
import { aiEnabled, draftEmailHtml } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120; // designing an HTML email can take a while

const Schema = z.object({
  context: z
    .string()
    .trim()
    .min(1, "Tell the AI what the email should be about.")
    .max(2000),
  audience: z.enum(["leads", "families"]).default("families"),
  occasion: z
    .enum([
      "birthday",
      "holiday",
      "event",
      "celebration",
      "thank_you",
      "announcement",
    ])
    .default("birthday"),
});

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }
  if (!aiEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "AI is not set up yet. Add ANTHROPIC_API_KEY to enable it (see OPERATIONS.md).",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }

  const parsed = Schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid." },
      { status: 400 }
    );
  }

  try {
    const draft = await draftEmailHtml({
      context: parsed.data.context,
      audience: parsed.data.audience,
      occasion: parsed.data.occasion,
    });
    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("[design-email]", err);
    return NextResponse.json(
      { ok: false, error: "The AI design failed. Please try again." },
      { status: 500 }
    );
  }
}
