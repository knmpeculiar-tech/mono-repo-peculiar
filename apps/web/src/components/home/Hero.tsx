import Image from "next/image";
import { buttonClassName } from "@/components/ui/Button";
import { LockIcon, PackagesIcon, RefreshIcon } from "@/components/icons";
import { BRAND_FACTS } from "@/lib/brandFacts";

// Only client-confirmed claims (lib/brandFacts.ts). This row previously said
// "Free shipping over ₹499", which was demo copy and isn't true.
const TRUST_ITEMS = [
  { icon: PackagesIcon, label: `${BRAND_FACTS.packsSold} packs sold` },
  { icon: RefreshIcon, label: `${BRAND_FACTS.returnWindowDays}-day easy returns` },
  { icon: LockIcon, label: "Secure checkout" },
];

export function Hero() {
  return (
    <section className="bg-surface-muted">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 md:gap-16 md:py-24">
        <div className="flex flex-col items-start gap-6 text-left">
          <p className="eyebrow">Peculiar</p>
          <h1 className="text-heading-1">Pads that actually get it right.</h1>
          <p className="text-body text-muted-foreground max-w-md text-lg">
            Thoughtfully made sanitary pads &mdash; the size and pack that fits your day, nothing
            you don&apos;t need.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <a href="#shop" className={buttonClassName({ size: "md" })}>
              Shop now
            </a>
            <a href="#features" className={buttonClassName({ variant: "secondary", size: "md" })}>
              Why Peculiar
            </a>
          </div>

          <div className="text-muted-foreground mt-2 flex flex-wrap gap-x-6 gap-y-3 border-t border-black/5 pt-6 text-sm">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative order-first aspect-square overflow-hidden rounded-3xl md:order-last">
          <Image
            src="/peculiar-home.png"
            alt="Woman relaxing at home in soft morning light"
            fill
            priority
            sizes="(min-width: 768px) 40vw, 90vw"
            className="object-cover"
          />
        </div>
      </div>
    </section>
  );
}
