import type { Metadata } from "next";
import { BUSINESS, OG_IMAGE } from "./site";

/**
 * Same "%s | Joy Senior Living" pattern as the root layout title template.
 * Twitter titles are not run through that template on their own, so pages
 * build the finished string here and the tab title and twitter:title match.
 */
export const TITLE_TEMPLATE = `%s | ${BUSINESS.name}`;

/** The title string Next will put in <title> for this metadata object. */
export function socialTitle(
  title: Metadata["title"] | undefined
): string | undefined {
  if (!title) return undefined;
  if (typeof title === "string") return TITLE_TEMPLATE.replace("%s", title);
  if ("absolute" in title && title.absolute) return title.absolute;
  if ("default" in title && typeof title.default === "string") {
    return TITLE_TEMPLATE.replace("%s", title.default);
  }
  return undefined;
}

/**
 * Set twitter:title and twitter:description from this page's own title and
 * description. The root layout only supplies the card type and default image;
 * an explicit twitter title there would be inherited by every page.
 *
 * Setting `twitter` replaces the parent object, so the card and image are
 * repeated here. A page can still override them by passing `twitter`.
 */
export function pageTwitter<T extends Metadata>(metadata: T): T {
  const title = socialTitle(metadata.title);
  const description =
    typeof metadata.description === "string" ? metadata.description : undefined;

  return {
    ...metadata,
    twitter: {
      card: "summary_large_image",
      images: [OG_IMAGE.url],
      ...metadata.twitter,
      ...(title ? { title } : {}),
      ...(description ? { description } : {}),
    },
  };
}
