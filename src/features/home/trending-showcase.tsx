"use client"

import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react"

import {
  AnimeCard,
  CardGrid,
  CardGridSkeleton,
} from "@/components/anime/anime-card"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { isPresent } from "@/domain/media"
import { useAniListQuery } from "@/lib/anilist/hooks"

import { TrendingHero } from "./trending-hero"
import { TRENDING_VARIABLES } from "./trending-variables"

export function TrendingShowcase() {
  const { data, isPending, isError, isFetching, refetch } = useAniListQuery(
    "TrendingAnime",
    TRENDING_VARIABLES,
  )
  const media = (data?.Page?.media ?? []).filter(isPresent)

  if (isPending) return <TrendingSkeleton />

  if (media.length === 0) {
    return (
      <EmptyState
        icon={TriangleAlertIcon}
        title="Couldn't load trending anime"
        description={
          isError
            ? "AniList may be busy right now. Try again in a minute."
            : "AniList returned no results."
        }
        className="mt-10"
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
  }

  const heroIndex = media.findIndex((item) => item.bannerImage)
  const hero = heroIndex === -1 ? undefined : media[heroIndex]
  const grid = media.filter((item) => item !== hero).slice(0, 24)

  return (
    <div className="space-y-8">
      {hero ? <TrendingHero media={hero} rank={heroIndex + 1} /> : null}
      <section aria-labelledby="trending-title" className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2
              id="trending-title"
              className="text-xl font-semibold tracking-tight"
            >
              Trending now
            </h2>
            <p className="text-sm text-muted-foreground">
              What everyone is watching this week
            </p>
          </div>
          {isError ? (
            <p className="text-xs text-muted-foreground">
              AniList is busy: showing saved data
            </p>
          ) : null}
        </div>
        <CardGrid>
          {grid.map((item, index) => (
            <AnimeCard key={item.id} media={item} priority={index < 6} />
          ))}
        </CardGrid>
      </section>
    </div>
  )
}

export function TrendingSkeleton() {
  return (
    <div
      className="space-y-8"
      aria-busy="true"
      aria-label="Loading trending anime"
    >
      <Skeleton className="-mx-4 h-80 rounded-none sm:mx-0 sm:h-96 sm:rounded-3xl" />
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <CardGridSkeleton count={12} />
      </div>
    </div>
  )
}
