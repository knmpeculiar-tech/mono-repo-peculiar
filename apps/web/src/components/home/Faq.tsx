// Answers here are customer-facing policy claims. Confirmed by the client
// (2026-10-03): 7-day returns, discreet packaging. Still unconfirmed: the
// delivery estimate and the "unopened packs" return condition — confirm
// before launch. Never add a shipping-cost claim (no free-shipping threshold
// exists). Confirmed facts live in lib/brandFacts.ts.
const FAQS = [
  {
    question: "How do I know which size to order?",
    answer:
      "If you're not sure, start with Medium — it's what most people order first. Small suits lighter days, Large suits heavier or overnight use. See our sizing guide on the blog for more detail.",
  },
  {
    question: "What's the difference between Regular and Jumbo packs?",
    answer:
      "Only the pad count — Regular Pack has fewer pads, Jumbo Pack has more. Same size, same pad, just a different quantity per box.",
  },
  {
    question: "How long does delivery take?",
    answer: "Most orders arrive within a few business days of placing your order.",
  },
  {
    question: "Can I return or exchange an order?",
    answer:
      "Unopened packs can be returned within 7 days of delivery — reach out and we'll sort it out.",
  },
  {
    question: "Is my payment information secure?",
    answer:
      "Yes. Checkout is handled by Razorpay — we never see or store your card details.",
  },
];

export function Faq() {
  return (
    <section className="bg-surface-muted border-border border-t">
      <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="mb-12 text-center">
          <p className="eyebrow mb-3">FAQ</p>
          <h2 className="text-heading-2">Common questions.</h2>
        </div>
        <div className="border-border divide-border divide-y border-t border-b">
          {FAQS.map((faq) => (
            <details key={faq.question} className="group py-5">
              <summary className="marker:content-none flex cursor-pointer list-none items-center justify-between gap-4 font-medium">
                {faq.question}
                <span className="text-muted-foreground shrink-0 text-xl leading-none transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="text-body text-muted-foreground mt-3 text-sm">{faq.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
