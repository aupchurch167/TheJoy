import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/require-admin";
import { aiEnabled, draftEventPlan, draftEventDescription } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const Schema = z.object({
  mode: z.enum(["plan", "description"]).default("plan"),
  brief: z.string().trim().max(2000).default(""),
  today: z.string().trim().max(10).optional(),
  // For description mode:
  title: z.string().trim().max(200).optional(),
  whenText: z.string().trim().max(200).optional(),
  where: z.string().trim().max(200).optional(),
  isPotluck: z.boolean().optional(),
  potluckAsk: z.string().trim().max(300).optional(),
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
    if (parsed.data.mode === "description") {
      if (!parsed.data.title?.trim()) {
        return NextResponse.json(
          { ok: false, error: "Add a title first." },
          { status: 400 }
        );
      }
      const description = await draftEventDescription({
        title: parsed.data.title,
        whenText: parsed.data.whenText,
        where: parsed.data.where,
        isPotluck: parsed.data.isPotluck,
        potluckAsk: parsed.data.potluckAsk,
      });
      return NextResponse.json({ ok: true, description });
    }

    if (!parsed.data.brief.trim()) {
      return NextResponse.json(
        { ok: false, error: "Tell the AI what you're planning first." },
        { status: 400 }
      );
    }
    const plan = await draftEventPlan(parsed.data.brief, parsed.data.today);
    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("[draft-event]", err);
    return NextResponse.json(
      { ok: false, error: "The AI draft failed. Please try again." },
      { status: 500 }
    );
  }
}
