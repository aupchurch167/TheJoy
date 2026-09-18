import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { incrementClick, resolveClickTarget } from "@/lib/linkinbio";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Click-through tracker for the /links bio page. /l/<blockId> records one click
 * server-side (so counts can't be spoofed) then 302s to the block's real URL.
 * Unknown ids fall back to /links.
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const home = new URL("/links", request.url);

  if (!hasDatabase()) return NextResponse.redirect(home, 302);

  const target = await resolveClickTarget(id);
  if (!target) return NextResponse.redirect(home, 302);

  try {
    await incrementClick(id);
  } catch {
    // Counting is best-effort; never block the redirect on it.
  }

  const dest = target.startsWith("/") ? new URL(target, request.url) : target;
  return NextResponse.redirect(dest, 302);
}
