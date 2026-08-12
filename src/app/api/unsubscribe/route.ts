import { hasDatabase } from "@/lib/db";
import { unsubscribeByToken } from "@/lib/leads";
import { SITE_URL } from "@/lib/site";

/**
 * One-click unsubscribe endpoint (RFC 8058). The List-Unsubscribe header points
 * here, and List-Unsubscribe-Post tells the inbox to POST it, so the recipient
 * is removed without opening a page. Always answers 200 so a mail client never
 * shows the reader an error.
 *
 * A GET (someone opening the header link in a browser) redirects to the
 * human-facing /unsubscribe page.
 */

export const dynamic = "force-dynamic";

export async function POST(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token");
  if (token && hasDatabase()) {
    try {
      await unsubscribeByToken(token);
    } catch (err) {
      console.error("[unsubscribe] one-click failed", err);
    }
  }
  return new Response("You have been unsubscribed.", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });
}

export async function GET(req: Request): Promise<Response> {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  return Response.redirect(
    `${SITE_URL}/unsubscribe?token=${encodeURIComponent(token)}`,
    302
  );
}
