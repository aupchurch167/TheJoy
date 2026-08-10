import { NextResponse } from "next/server";
import { z } from "zod";
import { isAdminRequest } from "@/lib/require-admin";
import { aiEnabled, draftGooglePost } from "@/lib/ai";

export const runtime = "nodejs";
export const maxDuration = 120;

const Schema = z.object({
  title: z.string().trim().min(1, "Give the post a title first.").max(300),
  excerpt: z.string().trim().max(2000).optional(),
  body: z.string().trim().max(50000).optional(),
});

export async function POST(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }
  if (!aiEnabled()) {
    return NextResponse.json(
      {
        ok: false,
        error: "AI is not set up yet. Add ANTHROPIC_API_KEY (see OPERATIONS.md).",
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
    const summary = await draftGooglePost(parsed.data);
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[google-post]", err);
    return NextResponse.json(
      { ok: false, error: "Could not write the Google post. Please try again." },
      { status: 500 }
    );
  }
}
