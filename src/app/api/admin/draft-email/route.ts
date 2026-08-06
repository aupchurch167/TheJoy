import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/require-admin";
import { aiEnabled, draftEmail } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120; // AI drafting can take a while

const Schema = z.object({
  context: z
    .string()
    .trim()
    .min(1, "Tell the AI what the email should be about.")
    .max(2000),
  audience: z.enum(["leads", "families"]).default("leads"),
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
          "AI drafting is not set up yet. Add ANTHROPIC_API_KEY to enable it (see OPERATIONS.md).",
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
    const draft = await draftEmail(parsed.data.context, parsed.data.audience);
    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("[draft-email]", err);
    return NextResponse.json(
      { ok: false, error: "The AI draft failed. Please try again." },
      { status: 500 }
    );
  }
}
