import Link from "next/link";

export function AboutTeaser() {
  return (
    <section className="border-border border-t">
      <div className="mx-auto max-w-2xl px-4 py-20 text-center sm:px-6">
        <p className="eyebrow mb-3">Our story</p>
        <h2 className="text-heading-2 mb-4">Why we started Peculiar</h2>
        <p className="text-body text-muted-foreground mb-6">
          Buying pads shouldn&apos;t be complicated. We keep the range simple, the sizing clear,
          and checkout fast.
        </p>
        <Link href="/about" className="text-brand text-sm font-medium hover:underline">
          Read our full story &rarr;
        </Link>
      </div>
    </section>
  );
}
