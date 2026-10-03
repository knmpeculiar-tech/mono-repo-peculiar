const STEPS = [
  {
    number: "01",
    title: "Choose your size",
    description: "Pick from Small, Medium, or Large, and a Regular or Jumbo pack.",
  },
  {
    number: "02",
    title: "Checkout in a minute",
    description: "Add to cart, enter your address, pay — no account required.",
  },
  {
    number: "03",
    title: "Delivered, discreetly",
    description: "Ships in plain packaging. Reorder in one click next time.",
  },
];

export function HowItWorks() {
  return (
    <section className="bg-surface-muted border-border border-t">
      <div className="mx-auto max-w-5xl px-4 py-20 sm:px-6">
        <div className="mx-auto mb-14 max-w-xl text-center">
          <p className="eyebrow mb-3">How it works</p>
          <h2 className="text-heading-2">Three steps, start to finish.</h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.number} className="flex flex-col items-start gap-2">
              <span className="font-display text-brand-200 text-4xl font-semibold">
                {step.number}
              </span>
              <h3 className="text-heading-3 text-lg">{step.title}</h3>
              <p className="text-body text-muted-foreground text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
