"use client"

import { StarIcon } from "lucide-react"
import Link from "next/link"
import type { CSSProperties } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { formatLabel, mediaMeta, type MediaTitleFields } from "@/domain/media"
import { useDisplayTitle } from "@/hooks/use-preferences"
import type { MediaCardFragment } from "@/lib/anilist/gql/graphql"
import { cn } from "@/lib/utils"

import { AiringBadge } from "./airing-badge"
import { CoverImage } from "./cover-image"

/** Rendered widths of a card in the standard grid, for `sizes`. */
export const CARD_GRID_SIZES =
  "(min-width: 1280px) 200px, (min-width: 1024px) 19vw, (min-width: 768px) 24vw, (min-width: 640px) 32vw, 48vw"

export function CardGrid({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className,
      )}
    >
      {children}
    </ul>
  )
}

/** Extra details when a card stands for a whole series (see SeriesCard). */
export interface CardSeriesInfo {
  /** "6 seasons" or "3 entries"; replaces the episode count. */
  count?: string
  /** "2013–2023"; replaces the year. */
  years?: string
  /** The next episode of whichever season airs soonest. */
  airing?: { episode: number; airingAt: number } | null
  /** The season this one continues, when that one isn't on the page. */
  continues?: MediaTitleFields | null
  /** Any season in the series is adult. */
  isAdult?: boolean
}

export function AnimeCard({
  media,
  priority = false,
  series,
}: {
  media: MediaCardFragment
  priority?: boolean
  series?: CardSeriesInfo
}) {
  const title = useDisplayTitle(media.title)
  const continues = useDisplayTitle(series?.continues)
  const meta = series?.count
    ? [formatLabel(media.format), series.count, series.years]
        .filter(Boolean)
        .join(" · ")
    : mediaMeta(media)
  const airing = series?.airing ?? media.nextAiringEpisode
  const isAdult = series?.isAdult ?? media.isAdult
  const accent = {
    "--cover": media.coverImage?.color ?? "var(--primary)",
  } as CSSProperties

  return (
    <li>
      <Link
        href={`/anime/${media.id}`}
        className="group block rounded-2xl outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
        style={accent}
      >
        <div className="relative overflow-hidden rounded-2xl shadow-sm ring-1 ring-border transition duration-300 group-hover:-translate-y-1 group-hover:shadow-(--cover)/20 group-hover:shadow-lg group-hover:ring-(--cover)/60">
          <CoverImage
            cover={media.coverImage}
            alt=""
            sizes={CARD_GRID_SIZES}
            priority={priority}
            className="transition-transform duration-500 group-hover:scale-[1.04]"
          />
          {isAdult ? (
            <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold text-background">
              18+
              <span className="sr-only"> adult content</span>
            </span>
          ) : null}
          {media.averageScore ? (
            <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold backdrop-blur">
              <StarIcon
                className="size-3 fill-score text-score"
                aria-hidden="true"
              />
              {media.averageScore}%
              <span className="sr-only"> average score</span>
            </span>
          ) : null}
          {airing ? (
            <AiringBadge
              episode={airing.episode}
              airingAt={airing.airingAt}
              className="absolute bottom-2 left-2"
            />
          ) : null}
        </div>
        <div className="mt-2 space-y-0.5 px-0.5">
          <h3 className="line-clamp-2 text-sm leading-snug font-medium group-hover:text-foreground">
            {title}
          </h3>
          {meta ? (
            <p className="text-xs text-muted-foreground">{meta}</p>
          ) : null}
          {series?.continues ? (
            <p className="line-clamp-1 text-xs text-muted-foreground">
              Continues {continues}
            </p>
          ) : null}
        </div>
      </Link>
    </li>
  )
}

export function AnimeCardSkeleton() {
  return (
    <li aria-hidden="true">
      <Skeleton className="aspect-[2/3] rounded-2xl" />
      <Skeleton className="mt-2 h-4 w-4/5" />
      <Skeleton className="mt-1.5 h-3 w-1/2" />
    </li>
  )
}

export function CardGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <CardGrid>
      {Array.from({ length: count }, (_, index) => (
        <AnimeCardSkeleton key={index} />
      ))}
    </CardGrid>
  )
}
