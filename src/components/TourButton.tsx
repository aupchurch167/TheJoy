import { TOUR_URL } from "@/lib/site";

/**
 * The ONE tour path for the entire site (TalkFurther). Every "book a tour"
 * action on the site routes through here. Do not add other tour links.
 *
 * The destination comes from site settings (talkfurther_url); server components
 * pass it via `href`. Falls back to the env/phone tour path when omitted.
 */
export default function TourButton({
  children = "Book a tour",
  variant = "primary",
  className = "",
  href,
}: {
  children?: React.ReactNode;
  variant?: "primary" | "light";
  className?: string;
  href?: string;
}) {
  const url = href || TOUR_URL;
  const base =
    "inline-flex items-center justify-center rounded-full px-7 py-3.5 text-base font-semibold transition-colors";
  const styles =
    variant === "primary"
      ? "bg-clay text-white hover:bg-clay-dark"
      : "bg-white text-clay ring-1 ring-clay/30 hover:bg-clay/5";

  const external = /^https?:/i.test(url);

  return (
    <a
      href={url}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      data-tour-cta="talkfurther"
      className={`${base} ${styles} ${className}`}
    >
      {children}
    </a>
  );
}
