import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
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

/**
 * Renders Markdown to styled HTML. react-markdown does NOT render raw HTML by
 * default, so post bodies are safe to render even though authors type freely.
 * Used for both the admin live preview and the public post pages.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-joy space-y-5 text-lg leading-relaxed text-ink-soft [&_a]:text-clay [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-clay [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_img]:rounded-xl [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:text-ink">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeDemoteH1]}>
        {children}
      </ReactMarkdown>
    </div>
  );
}
