/**
 * Webflow's old password-page URL. Nothing on the site corresponds to it.
 * The proxy returns 410 for this path (including a trailing slash or the apex
 * host). This route is the same answer if a request is rendered directly.
 */
function gone(): Response {
  return new Response("Gone", {
    status: 410,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

export function GET() {
  return gone();
}

export function HEAD() {
  return new Response(null, { status: 410 });
}
