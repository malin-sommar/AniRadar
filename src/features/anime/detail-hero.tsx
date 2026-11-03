"use client"

import { BellIcon, PlusIcon, StarIcon } from "lucide-react"
import type { ReactNode } from "react"

import { CoverImage } from "@/components/anime/cover-image"
import { Button } from "@/components/ui/button"
import {
  STATUS_LABELS,
  displayTitle,
  mediaMeta,
  type MediaTitleFields,
} from "@/domain/media"
import { useDisplayTitle, usePreferences } from "@/hooks/use-preferences"
import type { MediaFormat, MediaStatus } from "@/lib/anilist/gql/graphql"
import { imageSrc } from "@/lib/images"

import { AniListScoreChip } from "./score-chip"

interface HeroMedia {
  id: number
  title: MediaTitleFields | null
  coverImage: {
    medium: string | null
    large: string | null
    extraLarge: string | null
    color: string | null
  } | null
  bannerImage: string | null
  format: MediaFormat | null
  episodes: number | null
  seasonYear: number | null
  status: MediaStatus | null
  averageScore: number | null
  isAdult: boolean | null
}

/** Other titles under the main one, e.g. romaji and Japanese under English. */
function useAlternativeTitles(title: MediaTitleFields | null) {
  const { titleLanguage } = usePreferences()
  const main = displayTitle(title, titleLanguage)
  return [title?.english, title?.romaji, title?.native]
    .map((value) => value?.trim())
    .filter(
      (value, index, all): value is string =>
        Boolean(value) && value !== main && all.indexOf(value) === index,
    )
}

/** Banner key art with the cover, titles, scores and (later) list actions. */
export function DetailHero({
  media,
  malScore,
}: {
  media: HeroMedia
  malScore: ReactNode
}) {
  const title = useDisplayTitle(media.title)
  const alternatives = useAlternativeTitles(media.title)
  const banner = imageSrc(media.bannerImage)
  const meta = mediaMeta(media)

  return (
    <header className="relative -mx-4 -mt-4 overflow-hidden sm:mx-0 sm:mt-0 sm:rounded-3xl">
      {/* A banner, or the cover blurred into one. */}
      <div className="absolute inset-0" aria-hidden="true">
        {banner ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={banner}
            alt=""
            fetchPriority="high"
            decoding="async"
            className="size-full object-cover"
          />
        ) : (
          <CoverImage
            cover={media.coverImage}
            alt=""
            sizes="100vw"
            priority
            className="size-full scale-125 opacity-60 blur-2xl"
          />
        )}
      </div>
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/75 to-background/20" />
      <div className="absolute inset-0 bg-linear-to-r from-background/80 via-background/30 to-transparent" />

      <div className="relative flex flex-col gap-5 px-4 pt-36 pb-6 sm:flex-row sm:items-end sm:px-8 sm:pt-44 sm:pb-8">
        <CoverImage
          cover={media.coverImage}
          alt=""
          sizes="(min-width: 640px) 176px, 128px"
          priority
          className="w-32 shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/10 sm:w-44"
        />
        <div className="min-w-0 space-y-3">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl">
              {title}
            </h1>
            {alternatives.length > 0 ? (
              <p className="text-sm text-muted-foreground">
                {alternatives.join(" · ")}
              </p>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {media.averageScore ? (
              <AniListScoreChip score={media.averageScore} />
            ) : null}
            {malScore}
            {media.status ? (
              <span className="inline-flex h-8 items-center rounded-full bg-(--cover)/20 px-3 text-sm font-medium ring-1 ring-(--cover)/40 backdrop-blur">
                {STATUS_LABELS[media.status]}
              </span>
            ) : null}
            {media.isAdult ? (
              <span className="inline-flex h-8 items-center rounded-full bg-destructive px-3 text-sm font-semibold text-background">
                18+
              </span>
            ) : null}
            {meta ? (
              <span className="text-sm text-muted-foreground">{meta}</span>
            ) : null}
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            {/* List actions arrive once AniList can be connected (Phase 4). */}
            <Button size="lg" className="rounded-full" disabled>
              <PlusIcon data-icon="inline-start" />
              Track
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="rounded-full"
              disabled
            >
              <StarIcon data-icon="inline-start" />
              Rate
            </Button>
            <Button
              size="icon-lg"
              variant="secondary"
              className="rounded-full"
              aria-label="Notify me about new episodes"
              disabled
            >
              <BellIcon />
            </Button>
            <span className="text-xs text-muted-foreground">
              Tracking arrives with AniList sign-in.
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
