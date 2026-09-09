import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import type { Root, Element } from "hast";

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
}: {
  children: string;
  variant?: keyof typeof VARIANTS;
}) {
  // In the compact (event) variant, a single Enter becomes a line break and a
  // blank line starts a new paragraph, which is what non-technical authors
  // expect. The blog keeps standard Markdown (single newlines collapse).
  const remarkPlugins =
    variant === "compact" ? [remarkGfm, remarkBreaks] : [remarkGfm];
  return (
    <div className={VARIANTS[variant]}>
      <ReactMarkdown remarkPlugins={remarkPlugins} rehypePlugins={[rehypeDemoteH1]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
