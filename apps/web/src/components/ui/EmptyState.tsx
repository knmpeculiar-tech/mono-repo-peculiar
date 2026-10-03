export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="bg-surface-muted flex flex-col items-center gap-3 rounded-2xl px-6 py-16 text-center">
      <p className="text-heading-3">{title}</p>
      {description ? <p className="text-caption max-w-sm">{description}</p> : null}
      {action}
    </div>
  );
}
