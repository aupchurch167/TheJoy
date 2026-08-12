import type { Metadata } from "next";
import { hasDatabase } from "@/lib/db";
import { getRequestByToken } from "@/lib/feedback";
import { getSettings } from "@/lib/settings";
import { getSitePhotos } from "@/lib/site-photos";
import { BUSINESS } from "@/lib/site";
import FeedbackFlow from "./FeedbackFlow";

/** Brand lockup: the uploaded Joy logo when set, otherwise the text wordmark. */
function Wordmark({ logo }: { logo: { src: string; set: boolean } }) {
  if (logo.set) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo.src} alt={BUSINESS.name} className="mx-auto h-12 w-auto" />
    );
  }
  return (
    <div>
      <p className="font-display text-3xl font-semibold italic leading-none text-clay">
        Joy
      </p>
      <p className="mt-1.5 text-[0.7rem] font-medium uppercase tracking-[0.22em] text-ink-faint">
        Senior Living · Personal Care Home
      </p>
    </div>
  );
}

// Tokenized + private: never index, always fresh.
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Share how it is going",
  robots: { index: false, follow: false },
};

/** Plain, detail-free screen for an invalid or already-used link. */
function Closed({
  phone,
  logo,
}: {
  phone: string;
  logo: { src: string; set: boolean };
}) {
  return (
    <main className="flex flex-1 items-center justify-center bg-paper px-6">
      <div className="max-w-md py-24 text-center">
        <Wordmark logo={logo} />
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
  const [settings, { logo }] = await Promise.all([
    getSettings(),
    getSitePhotos(),
  ]);
  const phone = settings.phone || BUSINESS.phone;
  const logoBrand = { src: logo.src, set: logo.set };

  if (!hasDatabase()) return <Closed phone={phone} logo={logoBrand} />;

  const request = await getRequestByToken(token);
  // Invalid or already completed: no detail, just a way to reach us.
  if (!request || request.completed_at)
    return <Closed phone={phone} logo={logoBrand} />;

  return (
    <FeedbackFlow
      token={token}
      reviewUrls={{
        google: settings.google_review_url,
        apfm: settings.apfm_review_url,
      }}
      phone={phone}
      residentName={request.resident_first_name ?? ""}
      logo={logoBrand}
    />
  );
}
