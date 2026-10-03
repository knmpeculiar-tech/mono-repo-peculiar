import { Button } from "./Button";

export function ErrorState({
  title = "Something went wrong",
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="border-danger/30 bg-danger/5 flex flex-col items-center gap-3 rounded-lg border px-6 py-16 text-center">
      <p className="text-heading-3">{title}</p>
      {description ? <p className="text-caption max-w-sm">{description}</p> : null}
      {onRetry ? (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
