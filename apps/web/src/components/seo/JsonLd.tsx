// Renders a JSON-LD structured data block. `data` always comes from
// lib/seo/jsonld.ts's builders (our own trusted objects), never raw user
// input, so serializing it into a script tag here is safe.
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
