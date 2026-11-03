import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors the detail page's layout while it loads. */
export function DetailSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true" aria-label="Loading anime">
      <div className="relative -mx-4 -mt-4 flex flex-col gap-5 bg-muted/40 px-4 pt-36 pb-6 sm:mx-0 sm:mt-0 sm:flex-row sm:items-end sm:rounded-3xl sm:px-8 sm:pt-44 sm:pb-8">
        <Skeleton className="aspect-[2/3] w-32 shrink-0 rounded-2xl sm:w-44" />
        <div className="w-full max-w-xl space-y-3">
          <Skeleton className="h-10 w-4/5" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20 rounded-full" />
            <Skeleton className="h-8 w-24 rounded-full" />
            <Skeleton className="h-8 w-20 rounded-full" />
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-10 w-28 rounded-full" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="space-y-3">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="space-y-3">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-64 rounded-3xl" />
        </div>
      </div>
    </div>
  )
}
