import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/Button";
import { BRAND_FACTS } from "@/lib/brandFacts";
import { BUSINESS } from "@/lib/businessInfo";

export const metadata: Metadata = {
  title: "About",
  description:
    "Peculiar is a Delhi-based sanitary pad brand: one product, made properly, with clear sizes, honest pricing and a founder you can actually reach.",
  alternates: { canonical: "/about" },
};

// Only client-confirmed facts appear on this page (brandFacts / businessInfo,
// plus the pad construction shown in LayerTech). No founding year,
// certifications or "Made in India" claim: none of those are confirmed yet.
const PRINCIPLES = [
  {
    title: "One product, done properly",
    body: "We make sanitary pads and nothing else. Every size and pack we sell is one we'd use ourselves, and that focus is what keeps the quality consistent.",
  },
  {
    title: "Built in six layers",
    body: "A soft top sheet, an anti-anion chip for freshness, and a gel and SAP core that locks fluid away. Each pad comes individually wrapped.",
  },
  {
    title: "Clear from the first click",
    body: "Sizes are labelled plainly, the price you see is the price you pay, and orders arrive in discreet packaging.",
  },
  {
    title: "We put things right",
    body: `If a pack arrives damaged, defective or wrong, tell us within ${BRAND_FACTS.issueReportDays} days of delivery and we'll sort it out.`,
  },
];

export default function AboutPage() {
  return (
    <div>
      <section className="bg-surface-muted">
        <div className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24">
          <div>
            <p className="eyebrow mb-3">About Peculiar</p>
            <h1 className="text-heading-1">Comfort you can count on, every month.</h1>
            <p className="text-body text-muted-foreground mt-5">
              Peculiar is a sanitary pad brand from Delhi. We make one product and put all our care
              into it, so buying pads feels simple and wearing them feels like nothing at all.
            </p>
          </div>
          <div className="relative aspect-square overflow-hidden rounded-3xl">
            <Image
              src="/about.png"
              alt="Hands folding soft linen next to a cup of tea and a rose"
              fill
              priority
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-2xl px-4 py-16 sm:px-6 md:py-20">
        <p className="eyebrow mb-3">Our story</p>
        <h2 className="text-heading-2">It started with a simple question.</h2>
        <div className="text-body text-muted-foreground mt-6 flex flex-col gap-5">
          <p>
            Why does something every woman needs, every month, feel so confusing to buy? Shelves
            full of near-identical packs, sizing that means something different on every brand,
            and pads that promise comfort but still leave you checking all day.
          </p>
          <p>
            Peculiar is our answer. Instead of a long catalogue, we focused on one pad and got the
            details right: the layers inside it, the sizes it comes in, and how it reaches you.
            Then we made buying it as easy as it should have been all along.
          </p>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="max-w-xl">
              <p className="eyebrow mb-3">The people we make it for</p>
              <h2 className="text-heading-2">Trusted by women, one pack at a time.</h2>
            </div>
            <p className="text-muted-foreground md:text-right">
              <span className="font-display text-foreground block text-4xl font-semibold">
                {BRAND_FACTS.packsSold}
              </span>
              packs sold so far
            </p>
          </div>
          <figure>
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl md:aspect-16/10">
              <Image
                src="/customers.jpeg"
                alt="A large group of women and girls sitting together, each holding up a Peculiar pack"
                fill
                sizes="(min-width: 1152px) 1104px, 100vw"
                className="object-cover"
              />
            </div>
            <figcaption className="text-caption mt-3">
              Some of our customers with their Peculiar packs.
            </figcaption>
          </figure>
        </div>
      </section>

      <section className="bg-surface-muted">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-20">
          <div className="mb-12 max-w-xl">
            <p className="eyebrow mb-3">What we stand for</p>
            <h2 className="text-heading-2">Small promises we keep every time.</h2>
          </div>
          <ol className="grid gap-x-10 gap-y-10 sm:grid-cols-2">
            {PRINCIPLES.map((principle, index) => (
              <li key={principle.title} className="border-border flex gap-5 border-t pt-6">
                <span
                  aria-hidden="true"
                  className="font-display text-brand text-2xl leading-none font-semibold"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="text-heading-3 text-lg">{principle.title}</h3>
                  <p className="text-body text-muted-foreground mt-2 text-sm">{principle.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24">
        <figure className="md:order-2">
          {/* The source photo is a tall phone shot with empty ceiling and floor;
              the crop is pulled down to frame the group and the event banner. */}
          <div className="relative aspect-4/3 overflow-hidden rounded-3xl">
            <Image
              src="/kunja.jpeg"
              alt="Peculiar's founder with fellow business owners holding certificates at the 15 Secrets of Success event in East Delhi"
              fill
              sizes="(min-width: 768px) 40vw, 90vw"
              className="object-cover object-[50%_60%]"
            />
          </div>
          <figcaption className="text-caption mt-3">
            At the &ldquo;15 Secrets of Success&rdquo; business event, East Delhi, July 2026.
          </figcaption>
        </figure>
        <div className="md:order-1">
          <p className="eyebrow mb-3">Behind the brand</p>
          <h2 className="text-heading-2">A founder you can actually reach.</h2>
          <div className="text-body text-muted-foreground mt-6 flex flex-col gap-5">
            <p>
              Peculiar is run by {BUSINESS.proprietorName} from Delhi. There&apos;s no faceless
              head office: every order, question and complaint reaches the same small team that
              makes the decisions.
            </p>
            <p>
              That&apos;s how we like it. When you write to us, you hear back from people who care
              how the product works for you, and who can change things when it doesn&apos;t.
            </p>
          </div>
          <Link
            href="/contact"
            className="text-brand mt-6 inline-block text-sm font-medium hover:underline"
          >
            Get in touch &rarr;
          </Link>
        </div>
      </section>

      <section className="border-border border-t">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-20 text-center sm:px-6">
          <h2 className="text-heading-2">Find your fit.</h2>
          <p className="text-body text-muted-foreground">
            Choose your size and pack. Checkout takes under a minute.
          </p>
          <Link href="/#shop" className={buttonClassName({ size: "md" })}>
            Shop now
          </Link>
        </div>
      </section>
    </div>
  );
}
