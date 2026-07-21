import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders Markdown to styled HTML. react-markdown does NOT render raw HTML by
 * default, so post bodies are safe to render even though authors type freely.
 * Used for both the admin live preview and the public post pages.
 */
export default function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-joy space-y-5 text-lg leading-relaxed text-ink-soft [&_a]:text-clay [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-clay [&_blockquote]:pl-5 [&_blockquote]:italic [&_h2]:mt-10 [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-semibold [&_h2]:text-ink [&_h3]:mt-8 [&_h3]:font-display [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-ink [&_img]:rounded-xl [&_li]:ml-5 [&_li]:list-disc [&_ol_li]:list-decimal [&_strong]:text-ink">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
