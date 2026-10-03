import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About",
  description: "The story behind Peculiar and how we think about making sanitary pads simple.",
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div>
      <section className="bg-surface-muted">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24">
          <div className="text-left">
            <p className="eyebrow mb-3">About Peculiar</p>
            <h1 className="text-heading-1">Buying pads shouldn&apos;t be complicated.</h1>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image
              src="/about.png"
              alt="Hands folding soft linen next to a cup of tea and a rose"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <div className="prose prose-headings:font-display max-w-none">
          <p>
            Peculiar started with a simple frustration: shelves full of options, vague sizing,
            and packaging that made a basic purchase feel more complicated than it needed to be.
          </p>
          <p>
            So we started over. One product, done properly &mdash; sanitary pads in the sizes and
            pack options that actually match how people shop for them, with pricing that&apos;s
            clear from the start and a checkout that takes under a minute.
          </p>
          <h2>How we think about it</h2>
          <p>
            We&apos;d rather do one product well than spread ourselves across a catalog of
            half-considered options. Every size and pack we offer is one we&apos;d stand behind
            ourselves &mdash; and if something isn&apos;t working, we&apos;d rather fix it than
            bury it in a bigger range.
          </p>
        </div>
        <div className="mt-10">
          <Link href="/#shop" className={buttonClassName({ size: "md" })}>
            Shop now
          </Link>
        </div>
      </section>
    </div>
  );
}
