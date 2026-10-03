import { BRAND_FACTS } from "@/lib/brandFacts";

// Every answer is backed by the client's product infographic, a confirmed fact
// (lib/brandFacts.ts), or how the site itself works (Razorpay checkout,
// account order history). Don't add answers that make unconfirmed claims.
const FAQS = [
  {
    question: "What does the anti-anion chip do?",
    answer:
      "It's a layer just beneath the soft top sheet that releases negative ions, for freshness and comfort through the day.",
  },
  {
    question: "How does the gel layer keep me dry?",
    answer:
      "Super-absorbent gel locks fluid in as soon as it's absorbed and helps prevent backflow, and the SAP paper core underneath spreads it evenly, so the surface against your skin stays drier.",
  },
  {
    question: "How big is the pad?",
    answer:
      "The Medium pad is 240 mm long and 70 mm wide, with secure wings that keep it from shifting. Each pad is individually wrapped in its own pouch, easy to carry in a bag.",
  },
  {
    question: "Is the packaging discreet?",
    answer:
      "Yes. Orders ship in a plain outer box that doesn't show what's inside, and every pad is individually wrapped.",
  },
  {
    question: "Can I return my order?",
    answer: `Yes, we offer ${BRAND_FACTS.returnWindowDays}-day easy returns.`,
  },
  {
    question: "Is paying online safe?",
    answer:
      "Yes. Checkout runs on Razorpay, so you can pay by UPI, card or netbanking. Your payment details go straight to Razorpay; we never see or store them.",
  },
  {
    question: "How do I track my order?",
    answer:
      "Sign in and open My orders to see your order's current status at any time. We also send you updates on WhatsApp as your order is confirmed, dispatched and delivered.",
  },
];

/** Chevron icon that rotates when the parent `<details>` is open. */
function ChevronIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="text-muted-foreground shrink-0 transition-transform duration-300 ease-out group-open:rotate-180 motion-reduce:transition-none"
    >
      <path d="M5 7.5L10 12.5L15 7.5" />
    </svg>
  );
}

export function ProductFaq() {
  return (
    <section aria-labelledby="product-faq-heading" className="mt-16 pt-12 sm:mt-20 sm:pt-14">
      {/* Eyebrow + heading */}
      <p className="eyebrow mb-2 sm:mb-3">FAQ</p>
      <h2
        id="product-faq-heading"
        className="text-heading-2"
      >
        Good to know before you buy
      </h2>

      {/* Accordion */}
      <div className="mt-8 flex max-w-3xl flex-col gap-3 sm:mt-10 sm:gap-4">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group bg-surface-muted/60 rounded-xl transition-colors duration-200 hover:bg-surface-muted sm:rounded-2xl"
          >
            <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-4 px-4 py-4 text-sm font-medium leading-snug marker:content-none sm:px-6 sm:py-5 sm:text-base sm:leading-normal">
              {faq.question}
              <ChevronIcon />
            </summary>
            <p className="text-muted-foreground px-4 pb-4 text-sm leading-relaxed sm:px-6 sm:pb-5 sm:text-base">
              {faq.answer}
            </p>
          </details>
        ))}
      </div>
    </section>
  );
}
