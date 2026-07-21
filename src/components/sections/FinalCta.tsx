import { BUSINESS, BUSINESS_ADDRESS_ONE_LINE } from "@/lib/site";
import TourButton from "@/components/TourButton";
import LeadForm from "@/components/LeadForm";

export default function FinalCta() {
  return (
    <section id="contact" className="bg-ink py-16 text-white sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">
            Come see the home
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-white/80">
            The best way to know if Joy is right for your parent is to walk
            through it. Book a tour, or call and ask for {BUSINESS.director.name.split(" ")[0]}.
          </p>

          <div className="mt-8">
            <TourButton variant="light">Book a tour</TourButton>
          </div>

          <dl className="mt-10 space-y-4 text-white/90">
            <div>
              <dt className="text-sm uppercase tracking-wide text-white/50">
                Call
              </dt>
              <dd className="mt-1 text-xl font-semibold">
                <a href={BUSINESS.phoneHref} className="hover:text-white">
                  {BUSINESS.phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-wide text-white/50">
                Visit
              </dt>
              <dd className="mt-1 text-lg">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(
                    BUSINESS.name + " " + BUSINESS_ADDRESS_ONE_LINE
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  {BUSINESS_ADDRESS_ONE_LINE}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm uppercase tracking-wide text-white/50">
                Email
              </dt>
              <dd className="mt-1 text-lg">
                <a href={BUSINESS.emailHref} className="hover:text-white">
                  {BUSINESS.email}
                </a>
              </dd>
            </div>
          </dl>
        </div>

        <div>
          <p className="mb-4 text-lg font-medium text-white/90">
            Or send us a message and we will call you.
          </p>
          <LeadForm />
        </div>
      </div>
    </section>
  );
}
