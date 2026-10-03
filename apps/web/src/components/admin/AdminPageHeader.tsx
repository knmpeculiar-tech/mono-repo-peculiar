import Link from "next/link";
import type { ReactNode } from "react";

// Shared header for every admin list/detail/form page: a back-link
// (breadcrumb) + title on the left, an actions slot (e.g. a Save button) on
// the right. Server Component — `actions` can still contain a Client
// Component (a submit button, a delete button), Next.js allows that.
export function AdminPageHeader({
  title,
  backHref,
  backLabel,
  actions,
}: {
  title: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {backHref ? (
          <Link href={backHref} className="text-caption hover:text-brand mb-1 inline-block">
            ← {backLabel ?? "Back"}
          </Link>
        ) : null}
        <h1 className="text-heading-1">{title}</h1>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}
