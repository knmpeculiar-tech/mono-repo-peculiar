import Image from "next/image";
import { buttonClassName } from "@/components/ui/Button";

// texture.png is purely decorative here (alt=""): the overlay is what keeps
// the white text readable over the light linen, so don't lighten it without
// re-checking contrast. object-cover crops the texture on wide screens, which
// is fine for a background — there's no subject in it to lose.
export function FinalCta() {
  return (
    <section className="relative isolate overflow-hidden">
      <Image src="/texture.png" alt="" fill sizes="100vw" className="-z-20 object-cover" />
      <div aria-hidden="true" className="bg-brand-950/70 absolute inset-0 -z-10" />
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 px-4 py-24 text-center sm:px-6 sm:py-28">
        <h2 className="text-heading-2 text-white">Ready to feel the difference?</h2>
        <p className="text-body text-white/85">
          Pick your size, add it to cart, and you&apos;re done in under a minute.
        </p>
        <a href="#shop" className={buttonClassName({ variant: "secondary", size: "md" })}>
          Shop now
        </a>
      </div>
    </section>
  );
}
