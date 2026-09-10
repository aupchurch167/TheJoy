import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/require-admin";
import { aiEnabled, draftEmailModel, type EmailModelDraft } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120; // drafting with adaptive thinking can take a while

const PlanSchema = z
  .object({
    label: z.string().optional(),
    when: z.string().optional(),
    where: z.string().optional(),
    treats: z.string().optional(),
  })
  .nullable();

const CurrentSchema = z.object({
  subject: z.string(),
  eyebrow: z.string().optional(),
  heroTitle: z.string(),
  heroSub: z.string().optional(),
  greeting: z.string(),
  intro: z.string(),
  plan: PlanSchema.optional(),
  closing: z.string(),
});

const Schema = z.object({
  context: z.string().trim().max(2000).default(""),
  audience: z.enum(["leads", "families"]).default("families"),
  occasion: z
    .enum([
      "birthday",
      "holiday",
      "event",
      "celebration",
      "thank_you",
      "announcement",
      "employee_spotlight",
      "resident_spotlight",
    ])
    .default("announcement"),
  // For a targeted tweak ("Shorter", "Warmer", "New subject", free text):
  current: CurrentSchema.nullable().optional(),
  instruction: z.string().trim().max(500).nullable().optional(),
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

  const editing = !!(parsed.data.current && parsed.data.instruction);
  if (!editing && !parsed.data.context.trim()) {
    return NextResponse.json(
      { ok: false, error: "Tell the AI what the email should be about." },
      { status: 400 }
    );
  }

  try {
    const draft = await draftEmailModel({
      context: parsed.data.context,
      audience: parsed.data.audience,
      occasion: parsed.data.occasion,
      current: (parsed.data.current as EmailModelDraft | null | undefined) ?? null,
      instruction: parsed.data.instruction ?? null,
    });
    return NextResponse.json({ ok: true, draft });
  } catch (err) {
    console.error("[draft-email-model]", err);
    return NextResponse.json(
      { ok: false, error: "The AI draft failed. Please try again." },
      { status: 500 }
    );
  }
}
