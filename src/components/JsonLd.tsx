/**
 * Renders a schema.org JSON-LD block. Keeps the dangerouslySetInnerHTML
 * boilerplate in one place. `data` is a plain object from lib/schema.ts.
 */
export default function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
