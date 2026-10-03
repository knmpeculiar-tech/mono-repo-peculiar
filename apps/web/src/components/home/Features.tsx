import { RulerIcon, ShieldIcon, TagIcon, TruckIcon } from "@/components/icons";

const FEATURES = [
  {
    icon: RulerIcon,
    title: "Sizes that fit your day",
    description: "Pick the size and pack that actually matches your flow — nothing one-size-fits-all.",
  },
  {
    icon: TagIcon,
    title: "Straightforward pricing",
    description: "Clear pricing per pack, no surprise fees at checkout.",
  },
  {
    icon: ShieldIcon,
    title: "Discreet packaging",
    description: "Every order ships in plain, unbranded packaging.",
  },
  {
    icon: TruckIcon,
    title: "Quick reordering",
    description: "Once you know your size, checking out again takes under a minute.",
  },
];

export function Features() {
  return (
    <section id="features" className="border-border border-t">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <p className="eyebrow mb-3">Why Peculiar</p>
          <h2 className="text-heading-2">Built around how you actually shop for this.</h2>
        </div>
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <div key={title} className="flex flex-col items-start gap-3">
              <div className="bg-surface-muted flex h-11 w-11 items-center justify-center rounded-full">
                <Icon className="text-brand h-5 w-5" />
              </div>
              <h3 className="text-heading-3 text-lg">{title}</h3>
              <p className="text-body text-muted-foreground text-sm">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
