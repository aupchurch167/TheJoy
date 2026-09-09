/**
 * Flatten Markdown to clean plain text. Event page copy can be Markdown, but the
 * invite email renders its intro as plain text, so strip the syntax there rather
 * than leak raw "**bold**" into an inbox. Links become "text (url)" so the
 * address is still visible in an email.
 */
export function stripMarkdown(md: string): string {
  return (md || "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "") // images: drop
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1 ($2)") // links -> text (url)
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)(.*?)\1/g, "$2") // italic
    .replace(/`([^`]+)`/g, "$1") // inline code
    .replace(/^\s{0,3}#{1,6}\s+/gm, "") // headings
    .replace(/^\s{0,3}>\s?/gm, "") // blockquotes
    .replace(/^\s*[-*+]\s+/gm, "• ") // bullet lists
    .replace(/^\s*\d+\.\s+/gm, "") // ordered list markers
    .replace(/\n{3,}/g, "\n\n") // collapse extra blank lines
    .trim();
}
