export function StatCard({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <div className="border-border bg-surface rounded-lg border p-5">
      <p className="text-caption">{label}</p>
      <p className="text-heading-2 mt-1">{value}</p>
      {sublabel ? <p className="text-caption mt-1">{sublabel}</p> : null}
    </div>
  );
}
