import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 sm:px-6">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="mt-4 h-10 w-40" />
    </div>
  );
}
