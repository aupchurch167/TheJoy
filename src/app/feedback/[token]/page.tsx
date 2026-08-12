import type { Metadata } from "next";
import { hasDatabase } from "@/lib/db";
import { getRequestByToken } from "@/lib/feedback";
import { getSettings } from "@/lib/settings";
import { BUSINESS } from "@/lib/site";
import FeedbackFlow from "./FeedbackFlow";

// Tokenized + private: never index, always fresh.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Share how it is going",
  robots: { index: false, follow: false },
};

/** Plain, detail-free screen for an invalid or already-used link. */
function Closed({ phone }: { phone: string }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-paper px-6">
      <div className="max-w-md py-24 text-center">
        <p className="font-display text-2xl font-semibold text-ink">
          Joy <span className="text-clay">Senior Living</span>
        </p>
        <p className="mt-6 leading-relaxed text-ink-soft">
          This link is no longer active. If you would like to share how things
          are going, call us at{" "}
          <a href={`tel:${phone.replace(/[^\d+]/g, "")}`} className="text-clay">
            {phone}
          </a>{" "}
          and ask for Mellissa.
        </p>
      </div>
    </main>
  );
}

export default async function FeedbackPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const settings = await getSettings();
  const phone = settings.phone || BUSINESS.phone;

  if (!hasDatabase()) return <Closed phone={phone} />;

  const request = await getRequestByToken(token);
  // Invalid or already completed: no detail, just a way to reach us.
  if (!request || request.completed_at) return <Closed phone={phone} />;

  return (
    <FeedbackFlow
      token={token}
      reviewUrls={{
        google: settings.google_review_url,
        apfm: settings.apfm_review_url,
      }}
      phone={phone}
    />
  );
}
