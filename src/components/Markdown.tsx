import ReactMarkdown, { defaultUrlTransform } from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { Element, Root, Text } from "hast";
import Photo from "@/components/Photo";
import {
  BLOG_PROSE_SIZES,
  COMPACT_PROSE_SIZES,
  sameImage,
} from "@/lib/optimizable-image";

/**
 * react-markdown drops any URL whose protocol is not http(s), mailto, irc, or
 * xmpp. Phone numbers in a post are written as tel: links, so those stay.
 * Anything else still goes through the default transform.
 */
function urlTransform(value: string): string {
  if (/^tel:\+?[0-9]{7,15}$/.test(value)) return value;
  return defaultUrlTransform(value);
}

/**
 * The page template already renders each post's title as the one <h1>. Imported
 * Webflow bodies sometimes contain their own <h1> (section headings), which
 * gives the page duplicate H1s (bad for SEO). This rehype plugin demotes any
 * <h1> inside the body to <h2> so the heading outline is correct. Self-contained
 * (no extra dependency): it walks the hast tree and rewrites the tag name; the
 * [&_h2] styles below then style it like every other section heading.
 */
function rehypeDemoteH1() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type === "element") {
          if (child.tagName === "h1") child.tagName = "h2";
          walk(child);
        }
      }
    };
    walk(tree);
  };
}

/**
 * Drop a body image that repeats the post hero. The page template already
 * renders that photo above the article. Also drop the empty paragraph or link
 * left behind so the column does not gain a blank gap.
 */
function rehypeOmitImage(omitSrc?: string) {
  // Plugin factory. unified calls this, then runs the transformer it returns.
  return () => (tree: Root) => {
    if (!omitSrc) return;
    filterOmitted(tree, omitSrc);
  };
}

function filterOmitted(node: Root | Element, omitSrc: string) {
  const kept: unknown[] = [];
  for (const child of node.children) {
    if (child.type !== "element") {
      kept.push(child);
      continue;
    }
    if (
      child.tagName === "img" &&
      imageSrc(child) &&
      sameImage(imageSrc(child), omitSrc)
    ) {
      continue;
    }
    filterOmitted(child, omitSrc);
    if (
      (child.tagName === "p" || child.tagName === "a") &&
      !hasVisibleChild(child)
    ) {
      continue;
    }
    kept.push(child);
  }
  node.children = kept as typeof node.children;
}

function imageSrc(el: Element): string {
  const src = el.properties?.src;
  return typeof src === "string" ? src : "";
}

function hasVisibleChild(el: Element): boolean {
  return el.children.some((child) => {
    if (child.type === "text") return (child as Text).value.trim().length > 0;
    return child.type === "element";
  });
}

// Full-size prose for the blog; a tighter set for small cards (event pages).
const VARIANTS = {
  post: "prose-joy space-y-5 text-lg leading-relaxed text-ink-soft [&_a]:text-clay [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-clay [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_img]:rounded-xl [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:text-ink",
  compact:
    "space-y-2 text-[15px] leading-relaxed text-ink-soft [&_a]:text-clay [&_a]:underline [&_strong]:text-ink [&_em]:italic [&_ul]:space-y-1 [&_ol]:space-y-1 [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_h2]:mt-3 [&_h2]:font-display [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-2 [&_h3]:font-semibold [&_h3]:text-ink [&_blockquote]:border-l-2 [&_blockquote]:border-clay [&_blockquote]:pl-4 [&_blockquote]:italic",
} as const;

/**
 * Renders Markdown to styled HTML. react-markdown does NOT render raw HTML by
 * default, so bodies are safe to render even though authors type freely.
 * `variant="post"` (default) is the blog scale; `variant="compact"` fits the
 * small cards on event / RSVP pages. Used for public pages and admin previews.
 */
export default function Markdown({
  children,
  variant = "post",
  omitImageSrc,
}: {
  children: string;
  variant?: keyof typeof VARIANTS;
  /** Skip a body image whose URL is the post hero (already shown above). */
  omitImageSrc?: string;
}) {
  // In the compact (event) variant, a single Enter becomes a line break and a
  // blank line starts a new paragraph, which is what non-technical authors
  // expect. The blog keeps standard Markdown (single newlines collapse).
  const remarkPlugins =
    variant === "compact" ? [remarkGfm, remarkBreaks] : [remarkGfm];
  const sizes = variant === "compact" ? COMPACT_PROSE_SIZES : BLOG_PROSE_SIZES;
  return (
    <div className={VARIANTS[variant]}>
      <ReactMarkdown
        remarkPlugins={remarkPlugins}
        rehypePlugins={[rehypeDemoteH1, rehypeOmitImage(omitImageSrc)]}
        urlTransform={urlTransform}
        components={{
          img: ({ src, alt, title }) => {
            if (!src || typeof src !== "string") return null;
            if (omitImageSrc && sameImage(src, omitImageSrc)) return null;
            return (
              <Photo
                src={src}
                alt={alt ?? ""}
                title={typeof title === "string" ? title : undefined}
                fit="intrinsic"
                rounded="rounded-xl"
                sizes={sizes}
              />
            );
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
