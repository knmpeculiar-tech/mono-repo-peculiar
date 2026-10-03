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

export function ProductFaq() {
  return (
    <section aria-labelledby="product-faq-heading" className="border-border mt-16 border-t pt-12">
      <h2 id="product-faq-heading" className="text-heading-2">
        Good to know before you buy
      </h2>
      <div className="border-border divide-border mt-6 max-w-3xl divide-y border-t border-b">
        {FAQS.map((faq) => (
          <details key={faq.question} className="group py-5">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium marker:content-none">
              {faq.question}
              <span
                aria-hidden="true"
                className="text-muted-foreground shrink-0 text-xl leading-none transition-transform group-open:rotate-45 motion-reduce:transition-none"
              >
                +
              </span>
            </summary>
            <p className="text-body text-muted-foreground mt-3 max-w-[65ch] text-sm">{faq.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
