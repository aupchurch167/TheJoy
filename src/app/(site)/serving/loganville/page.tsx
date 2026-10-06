import type { Metadata } from "next";
import Link from "next/link";
import { pageTwitter } from "@/lib/metadata";
import {
  BUSINESS,
  BUSINESS_ADDRESS_ONE_LINE,
  OG_IMAGE,
  SITE_URL,
} from "@/lib/site";
import { breadcrumbJsonLd, faqPageJsonLdFrom } from "@/lib/schema";
import { getSettings, toTelHref } from "@/lib/settings";
import JsonLd from "@/components/JsonLd";

/**
 * Loganville is where the home is, so this page does not use the drive-time
 * town template in landing.ts. Copy below the H1 is the Adam-approved draft.
 */

// Educational frame (§4): the homepage owns "personal care home in
// Loganville". This page answers the assisted living search.
const TITLE = "Looking at Assisted Living in Loganville? Options & Alternatives | Joy";
const DESCRIPTION =
  "Looking at assisted living in Loganville? The Joy is a small licensed personal care home on the Gwinnett edge. What that means, who it fits, and what to ask.";

const TOUR_QUESTIONS = "/blog/questions-to-ask-personal-care-home-tour";
const MEMORY_CARE_GUIDE = "/blog/memory-care-loganville-what-to-look-for";
// One Enjoy directory link on this page (Walton is canonical until Enjoy says otherwise).
const ENJOY_LOGANVILLE_DIRECTORY =
  "https://enjoysrliving.com/directory/in/walton/loganville";

const FAQS: { title: string; body: string }[] = [
  {
    title: "Is The Joy assisted living?",
    body: "No. The Joy is a licensed personal care home in Georgia. Our license is PCH012341. We have 24 beds and suites. Memory care is licensed throughout the home. The whole home is secured. We opened in 2024, and we've been compliant at every inspection.",
  },
  {
    title: 'So why do search results say "assisted living"?',
    body: 'Because most people search with that phrase. Directory sites and search engines group similar places under the words families type. "Assisted living Loganville" and "assisted living facilities Loganville GA" pull up personal care homes, larger campuses, and everything in between. The label in the search bar isn\'t the license on the wall.\n\nIf you care about the legal category, ask for the license type and number. Ask whether memory care is a separate unit or licensed across the home. Ask about overnight staffing and who gives medications. Those answers tell you more than the marketing name on a listing site.',
  },
  {
    title: "How many senior living communities are in Loganville?",
    body: "More than fifteen licensed communities operate in and around Loganville (one large campus, a mid-size community, and a dozen-plus small personal care homes). The exact list changes; the state's inspection records are the current source of truth, and Enjoy's Loganville directory keeps them in one place.",
  },
];

export const metadata: Metadata = pageTwitter({
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: "/serving/loganville" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/serving/loganville",
    type: "website",
    images: [OG_IMAGE],
  },
});

function serviceJsonLd() {
  const url = `${SITE_URL}/serving/loganville`;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "@id": `${url}#service`,
    name: "Personal care home in Loganville, GA",
    serviceType: "Personal care home",
    url,
    provider: {
      "@type": ["LocalBusiness", "SeniorCare"],
      "@id": `${SITE_URL}/#business`,
      name: BUSINESS.listingName,
    },
    areaServed: "Loganville, GA",
  };
}

const linkClass = "font-semibold text-clay underline underline-offset-2";

export default async function LoganvillePage() {
  const settings = await getSettings();
  const phone = settings.phone || BUSINESS.phone;
  const address = settings.address || BUSINESS_ADDRESS_ONE_LINE;
  const mapQuery = `${BUSINESS.listingName}, ${address}`;
  const mapHref = `https://maps.google.com/?q=${encodeURIComponent(mapQuery)}`;
  const mapEmbed = `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&z=15&output=embed`;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Serving Loganville", path: "/serving/loganville" },
        ])}
      />
      <JsonLd data={serviceJsonLd()} />
      <JsonLd
        data={faqPageJsonLdFrom(
          FAQS.map((f) => ({
            title: f.title,
            body: f.body.replace(/\n+/g, " "),
          })),
          `${SITE_URL}/serving/loganville#faq`
        )}
      />

      <article className="mx-auto max-w-2xl px-5 pt-14 pb-20 sm:pt-20">
        <h1 className="max-w-[18ch] font-display text-4xl font-semibold text-ink text-balance sm:text-5xl">
          Personal Care Home in Loganville, GA
        </h1>

        <div className="mt-8 space-y-5 text-lg leading-relaxed text-ink-soft">
          <p>
            If you&apos;ve typed &quot;assisted living Loganville&quot; into a
            search bar, you&apos;re probably looking for a place where your mom
            or dad can get real help with daily life. Meals. Medications.
            Someone awake at night. A door that doesn&apos;t leave them alone
            with confusion or a fall risk.
          </p>
          <p>
            In Georgia, a lot of what people mean by that search points to a
            smaller licensed home, not a big assisted living campus. Georgia
            calls that a personal care home. Smaller. Residential. Regulated
            under a different label than the one Google shows you first.
          </p>
          <p>
            The Joy is one of those homes. We&apos;re on Conyers Road in
            Loganville, on the Walton County side of the Gwinnett edge. This
            page is what that actually means, who we fit, and what to ask
            before you decide anything.
          </p>
        </div>

        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            What a licensed personal care home is
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              Georgia licenses personal care homes to provide housing, meals,
              and help with activities of daily living. That help can include
              bathing, dressing, toileting, transfers, and medication assistance
              when the resident&apos;s needs match what the home is licensed and
              staffed to provide.
            </p>
            <p>
              A large assisted living campus often runs hundreds of apartments,
              multiple buildings, and a dining room that feels like a hotel.
              Staff rotate. Faces change. Your dad may get good care there. He
              may also feel like one more name on a whiteboard.
            </p>
            <p>
              A personal care home is usually smaller. At The Joy, we have 24
              beds and suites. Your mom sees the same caregivers on the same
              shifts. The house has a rhythm. Staff know who needs the long walk
              after lunch and who needs quiet when the afternoon gets hard.
            </p>
            <p>
              The{" "}
              <Link href="/cost" className={linkClass}>
                monthly rate
              </Link>{" "}
              at a personal care home typically covers care, meals, and help
              with ADLs. We don&apos;t put dollar amounts on this page. Numbers
              change, and a phone call is the honest way to talk through what
              your parent needs.
            </p>
            <p>
              <Link href="/memory-care" className={linkClass}>
                Memory care
              </Link>{" "}
              is part of how we&apos;re licensed. The Joy is licensed for memory
              care throughout the home. The whole home is secured. There
              isn&apos;t a separate locked wing your parent gets moved into
              later. If dementia progresses, they stay in the house they already
              know, with people who already know them.
            </p>
            <p>
              We opened in 2024. Our license number is PCH012341. We&apos;ve
              been compliant at every inspection.
            </p>
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Who it fits (and who needs something else)
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              This kind of home tends to fit when your parent needs more
              structure than unsupervised time at home, but doesn&apos;t need a
              hospital floor or a skilled nursing facility.
            </p>
            <p>Common reasons families call:</p>
            <ul className="space-y-2">
              <li className="ml-5 list-disc">
                Mom isn&apos;t safe alone overnight.
              </li>
              <li className="ml-5 list-disc">
                Dad misses medications even with reminders and pill boxes.
              </li>
              <li className="ml-5 list-disc">
                Wandering, sundowning, or confusion has started to scare
                everyone.
              </li>
              <li className="ml-5 list-disc">
                <Link href={MEMORY_CARE_GUIDE} className={linkClass}>
                  Home care hours keep climbing
                </Link>
                , and you&apos;re still the backup at 2 a.m.
              </li>
              <li className="ml-5 list-disc">
                You need a place close enough that you can stop by on a
                weeknight, not only on Sundays.
              </li>
            </ul>
            <p>
              It may not fit if your parent needs a higher clinical level of
              care than a personal care home can provide. We&apos;re not going
              to invent medical criteria on a website. If you&apos;re unsure,
              call us at{" "}
              <a href={toTelHref(phone)} className={linkClass}>
                {phone}
              </a>{" "}
              and tell us what you&apos;re seeing. We&apos;ll say when we can
              help and when you should look elsewhere. That conversation is
              worth more than a perfect web page.
            </p>
            <p>
              Pets are welcome in many cases, and we have pet therapy visits.
              Ask about the details for your parent&apos;s animal. Dementia
              training for caregivers is part of how Georgia memory care homes
              operate. We also host support groups for families on site.
            </p>
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Where we are
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              We&apos;re at{" "}
              <strong className="text-ink">
                {BUSINESS.address.street}, {BUSINESS.address.city},{" "}
                {BUSINESS.address.state}
              </strong>
              , in Walton County, right on the edge of Gwinnett. That puts us
              close for families in Loganville, Snellville, Grayson,
              Lawrenceville, Dacula, and nearby Walton and Monroe areas.
            </p>
            <p>
              More for{" "}
              <Link href="/serving/walton-county" className={linkClass}>
                Walton County
              </Link>{" "}
              and{" "}
              <Link href="/serving/gwinnett-county" className={linkClass}>
                Gwinnett County
              </Link>{" "}
              families.
            </p>
            <p>
              Phone:{" "}
              <a href={toTelHref(phone)} className={linkClass}>
                <strong>{phone}</strong>
              </a>
            </p>
          </div>

          <address className="not-italic rounded-2xl border border-line bg-white p-5 text-ink">
            <p className="font-semibold">{BUSINESS.listingName}</p>
            <p className="mt-2 leading-relaxed">
              <a
                href={mapHref}
                target="_blank"
                rel="noopener noreferrer"
                className={linkClass}
              >
                {address}
              </a>
            </p>
            <p className="mt-1">
              <a href={toTelHref(phone)} className={linkClass}>
                {phone}
              </a>
            </p>
          </address>

          <div className="overflow-hidden rounded-2xl border border-line">
            <iframe
              title={`Map of ${BUSINESS.listingName}, ${address}`}
              src={mapEmbed}
              className="h-72 w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <p className="text-lg leading-relaxed text-ink-soft">
            Distance matters more than people admit on the first tour. If your
            sister lives in Lawrenceville and you work toward Snellville, a
            home on Conyers Road is a stop on the way home, not a weekend
            pilgrimage. That changes how often you visit. Visiting often is one
            of the best things you can still do for your mom or dad after they
            move.
          </p>
        </section>

        <section id="faq" className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            FAQ: Is The Joy assisted living?
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              <strong className="text-ink">No.</strong>{" "}
              {FAQS[0].body.replace(/^No\.\s*/, "")}
            </p>
            {FAQS.slice(1).map((faq) => (
              <div key={faq.title} className="space-y-5">
                <p className="font-semibold text-ink">{faq.title}</p>
                {faq.body.split(/\n\n/).map((para) => (
                  <p key={para}>{para}</p>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Honest Map (Adam-approved). "Assisted living" appears in this
            section only in the three frames from the draft: the opening
            search sentence, The Retreat's offering line, and the license
            bullet. No competitor sites. One Enjoy link, Walton URL. */}
        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Every option in Loganville, honestly
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              If you&apos;re searching for assisted living in Loganville,
              here&apos;s what you&apos;ll actually find. We&apos;d rather you
              hear it from someone local than from a national website
              that&apos;s never been here.
            </p>
            <p>
              Loganville has three kinds of senior living. Which kind fits her
              matters more than any brochure.
            </p>
            <p>
              <strong className="text-ink">The large campus.</strong> The
              Retreat at Loganville is the big one (a full campus off Tommy Lee
              Fuller Drive offering independent living, assisted living, and
              memory care in one place). Campuses like this make sense when
              she&apos;s mostly independent today and wants to move once, or
              when she wants a built-in calendar of activities and a lot of
              neighbors. The trade: more residents per caregiver, and a
              different face helping her more often.
            </p>
            <p>
              <strong className="text-ink">The mid-size community.</strong>{" "}
              Magnolia Senior Living on Ozora Road sits in the middle (bigger
              than a house, smaller than a campus). More structure than a small
              home, more scale than one too.
            </p>
            <p>
              <strong className="text-ink">The small homes.</strong> And then
              there are more than a dozen small, state-licensed personal care
              homes in and around Loganville (real houses, usually six to
              twenty-four residents, where the same few caregivers cook the
              meals, pass the time, and notice when something&apos;s off). The
              Joy is one of them. We&apos;re 24 private suites on Conyers Road,
              and yes (we&apos;re telling you about our competitors on our own
              website). That should tell you something about how we run the
              place.
            </p>
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            How to choose between them
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              Not by the brochures. All three kinds will show you a clean lobby
              and a smiling photo. Ask these instead, anywhere you tour
              (including here):
            </p>
            <ul className="space-y-4">
              <li className="ml-5 list-disc">
                <strong className="text-ink">Show me your state license.</strong>{" "}
                Georgia licenses personal care homes and assisted living
                communities differently, and the license (not the sign out
                front) tells you what a place is allowed to do. If memory care
                is the need, ask to see the memory care certificate too. Anyone
                who hesitates has answered a question you didn&apos;t ask.
              </li>
              <li className="ml-5 list-disc">
                <strong className="text-ink">Who&apos;s awake at night?</strong>{" "}
                Not &quot;is someone on call.&quot; Awake, in the building,
                every night.
              </li>
              <li className="ml-5 list-disc">
                <strong className="text-ink">
                  Can I see your last inspection?
                </strong>{" "}
                Every licensed community in Georgia gets inspected by the
                state, and the reports are public. You can read inspection
                records for every Loganville community (ours included) on{" "}
                <a
                  href={ENJOY_LOGANVILLE_DIRECTORY}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Enjoy Senior Living&apos;s Loganville directory
                </a>
                , which pulls them straight from the state.
              </li>
              <li className="ml-5 list-disc">
                <strong className="text-ink">
                  Will you tell me if she&apos;s not a fit?
                </strong>{" "}
                The right place says no fast. We turn away families when her
                needs are beyond what a small home should handle, and
                we&apos;ll tell you who to call instead.
              </li>
            </ul>
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Who should tour Joy (and who shouldn&apos;t)
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              Come see us if she needs daily help in a place that feels like a
              home: meals cooked in the kitchen she can smell, the same faces
              every morning, a porch instead of a lobby. Come if memory is the
              worry and you want a small, secured home where the night staff
              knows her by name.
            </p>
            <p>
              Don&apos;t come if she needs skilled nursing (vents, IVs,
              round-the-clock medical care) or if she&apos;d be happiest with
              two hundred neighbors and an activities director. That&apos;s a
              different kind of place, and we&apos;ll say so in the first phone
              call, not after the deposit.
            </p>
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <h2 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
            Soft next step
          </h2>
          <div className="space-y-5 text-lg leading-relaxed text-ink-soft">
            <p>
              You don&apos;t have to decide from a web page. Print a short list.
              Tour more than one place. Write the answers down so you can
              compare them later when the day got long and the details blur.
            </p>
            <p>
              We&apos;ve published a set of{" "}
              <Link href={TOUR_QUESTIONS} className={linkClass}>
                questions to ask on a tour
              </Link>{" "}
              in the tour-questions guide on joyseniorcare.com. Use it at every
              home you visit, including ours. Ask about overnight staff,
              medication checks, dementia training, and how the home stays
              secured. Straight answers beat polished tours.
            </p>
            <p>
              What families have written is on our{" "}
              <Link href="/reviews" className={linkClass}>
                reviews
              </Link>{" "}
              page.
            </p>
            <p>
              When you&apos;re ready to talk through whether The Joy fits your
              mom or dad, call{" "}
              <a href={toTelHref(phone)} className={linkClass}>
                {phone}
              </a>
              . Ask for Mellissa Daniel, our Executive Director. She&apos;ll
              walk you through what we do and what we don&apos;t.
            </p>
            <p>
              No pressure to book today. This is a big decision. Take the time
              you need.
            </p>
          </div>
        </section>
      </article>
    </>
  );
}
