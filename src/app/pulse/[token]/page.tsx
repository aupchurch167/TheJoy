import type { Metadata } from "next";
import { hasDatabase } from "@/lib/db";
import { getByToken } from "@/lib/employee-feedback";
import { getSitePhotos } from "@/lib/site-photos";
import { BUSINESS } from "@/lib/site";
import PulseForm from "./PulseForm";

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
  title: "Team check-in",
  robots: { index: false, follow: false },
};

function Closed({ logo }: { logo: { src: string; set: boolean } }) {
  return (
    <main className="flex min-h-screen flex-1 items-center justify-center bg-paper px-6">
      <div className="max-w-md py-24 text-center">
        <Wordmark logo={logo} />
        <p className="mt-6 leading-relaxed text-ink-soft">
          This check-in link is no longer active. If you have something to share,
          please talk with Mellissa directly.
        </p>
      </div>
    </main>
  );
}

export default async function PulsePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const { logo } = await getSitePhotos();
  const logoBrand = { src: logo.src, set: logo.set };

  if (!hasDatabase()) return <Closed logo={logoBrand} />;

  const ctx = await getByToken(token);
  // Invalid link, already answered, or a survey that has been closed.
  if (
    !ctx ||
    ctx.recipient.completed_at ||
    ctx.survey.status === "closed" ||
    ctx.survey.status === "draft"
  ) {
    return <Closed logo={logoBrand} />;
  }

  return (
    <PulseForm
      token={token}
      title={ctx.survey.title}
      intro={ctx.survey.intro}
      questions={ctx.survey.questions}
      anonymous={ctx.survey.anonymous}
      logo={logoBrand}
    />
  );
}
