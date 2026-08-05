import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/require-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Same-origin image proxy for the admin cropper. Loading a cross-origin image
 * (e.g. from R2) into a <canvas> taints it and blocks export; fetching it
 * through this admin-only endpoint makes it same-origin so the crop can be
 * saved. Admin-authenticated, http(s) only, with a basic block on internal
 * hosts to limit SSRF.
 */

function isBlockedHost(host: string): boolean {
  const h = host.toLowerCase();
  return (
    h === "localhost" ||
    h === "::1" ||
    h.endsWith(".local") ||
    /^127\./.test(h) ||
    /^10\./.test(h) ||
    /^192\.168\./.test(h) ||
    /^169\.254\./.test(h) ||
    /^172\.(1[6-9]|2\d|3[01])\./.test(h)
  );
}

export async function GET(request: Request) {
  if (!(await isAdminRequest())) {
    return NextResponse.json({ ok: false, error: "Not allowed." }, { status: 401 });
  }

  const raw = new URL(request.url).searchParams.get("url");
  if (!raw) {
    return NextResponse.json({ ok: false, error: "Missing url." }, { status: 400 });
  }

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid url." }, { status: 400 });
  }
  if (target.protocol !== "http:" && target.protocol !== "https:") {
    return NextResponse.json({ ok: false, error: "Unsupported url." }, { status: 400 });
  }
  if (isBlockedHost(target.hostname)) {
    return NextResponse.json({ ok: false, error: "Blocked host." }, { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), { cache: "no-store" });
    if (!upstream.ok) {
      return NextResponse.json(
        { ok: false, error: `Upstream ${upstream.status}` },
        { status: 502 }
      );
    }
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) {
      return NextResponse.json({ ok: false, error: "Not an image." }, { status: 400 });
    }
    const buf = Buffer.from(await upstream.arrayBuffer());
    return new NextResponse(buf, {
      status: 200,
      headers: { "Content-Type": contentType, "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not fetch image." }, { status: 502 });
  }
}
