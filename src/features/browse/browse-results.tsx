"use client"

import { RefreshCwIcon, SearchXIcon, TriangleAlertIcon } from "lucide-react"

import {
  AnimeCardSkeleton,
  CardGrid,
  CardGridSkeleton,
} from "@/components/anime/anime-card"
import { SeriesCard } from "@/components/anime/series-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { groupIntoSeries } from "@/domain/series"
import { cn } from "@/lib/utils"

import type { BrowseVariables } from "./fetch-browse-page"
import { useBrowsePages } from "./use-browse-pages"

/** Start loading the next page this far before the end of the grid. */
const PRELOAD_MARGIN = "800px 0px"

export function BrowseResults({
  variables,
  hasFilters,
  onClearFilters,
}: {
  variables: BrowseVariables
  hasFilters: boolean
  onClearFilters: () => void
}) {
  const {
    data,
    isPending,
    isError,
    isFetching,
    isPlaceholderData,
    isFetchNextPageError,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useBrowsePages(variables)

  // Pages can overlap when AniList's order shifts between requests.
  const seen = new Set<number>()
  const media = (data?.pages ?? [])
    .flatMap((page) => page.media)
    .filter((item) => !seen.has(item.id) && seen.add(item.id))
  // One card per series, across every loaded page (PLAN.md §10.0).
  const series = groupIntoSeries(media)

  const canAutoLoad =
    hasNextPage && !isFetching && !isFetchNextPageError && !isPlaceholderData

  // React 19 ref callback with cleanup: watch the end of the grid and load
  // the next page as it comes near.
  const sentinelRef = (node: HTMLDivElement | null) => {
    if (!node || !canAutoLoad) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          observer.disconnect()
          void fetchNextPage()
        }
      },
      { rootMargin: PRELOAD_MARGIN },
    )
    observer.observe(node)
    return () => observer.disconnect()
  }

  let status: string
  let body: React.ReactNode

  if (isPending) {
    status = "Loading anime"
    body = <CardGridSkeleton count={12} />
  } else if (media.length === 0 && isError) {
    status = "Couldn't load anime"
    body = (
      <EmptyState
        icon={TriangleAlertIcon}
        title="Couldn't load anime"
        description="AniList may be busy right now. Try again in a minute."
        className="mt-6"
      >
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCwIcon className={isFetching ? "animate-spin" : undefined} />
          Try again
        </Button>
      </EmptyState>
    )
  } else if (media.length === 0) {
    status = "No anime found"
    body = (
      <EmptyState
        icon={SearchXIcon}
        title="No anime found"
        description={
          hasFilters
            ? "Nothing matches all of these filters. Try removing some."
            : "AniList returned no results."
        }
        className="mt-6"
      >
        {hasFilters ? (
          <Button variant="secondary" onClick={onClearFilters}>
            Clear search and filters
          </Button>
        ) : null}
      </EmptyState>
    )
  } else {
    status = `Showing ${series.length} series${hasNextPage ? ", scroll for more" : ""}`
    body = (
      <>
        <CardGrid
          className={cn(
            "transition-opacity",
            isPlaceholderData && "opacity-50",
          )}
        >
          {series.map((group, index) => (
            <SeriesCard
              key={group.first.id}
              group={group}
              priority={index < 6}
            />
          ))}
          {isFetchingNextPage
            ? Array.from({ length: 6 }, (_, index) => (
                <AnimeCardSkeleton key={`loading-${index}`} />
              ))
            : null}
        </CardGrid>

        <div className="flex flex-col items-center gap-2 py-8">
          {hasNextPage ? (
            <>
              <div
                ref={sentinelRef}
                aria-hidden="true"
                className="h-px self-stretch"
              />
              {isFetchNextPageError ? (
                <p className="text-sm text-muted-foreground">
                  Couldn&apos;t load more. AniList may be busy.
                </p>
              ) : null}
              <Button
                variant="secondary"
                className="rounded-full"
                onClick={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage
                  ? "Loading…"
                  : isFetchNextPageError
                    ? "Try again"
                    : "Load more"}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              That&apos;s everything.
            </p>
          )}
        </div>
      </>
    )
  }

  return (
    <section aria-label="Results" aria-busy={isPending || isPlaceholderData}>
      <p role="status" className="sr-only">
        {status}
      </p>
      {body}
    </section>
  )
}
