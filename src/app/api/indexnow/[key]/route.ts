import { indexNowKey } from "@/lib/indexnow";

export const dynamic = "force-dynamic";

/**
 * Serves the IndexNow key file. next.config.ts rewrites /<key>.txt here, and
 * Bing fetches it to confirm we own the domain. Any other name is a 404, so
 * this never reveals the key to someone who does not already have it.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params;
  const expected = indexNowKey();
  if (!expected || key !== expected) {
    return new Response("Not found", { status: 404 });
  }
  return new Response(expected, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
