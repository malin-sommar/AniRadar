import { ArrowRightIcon, FlameIcon, StarIcon } from "lucide-react"
import Link from "next/link"
import type { CSSProperties } from "react"

import { CoverImage } from "@/components/anime/cover-image"
import { Button } from "@/components/ui/button"
import { displayTitle, isPresent, mediaMeta } from "@/domain/media"
import type { TrendingAnimeQuery } from "@/lib/anilist/gql/graphql"
import { imageSrc } from "@/lib/images"

type TrendingMedia = NonNullable<
  NonNullable<NonNullable<TrendingAnimeQuery["Page"]>["media"]>[number]
>

/** Big key-art banner for the #1 trending show. */
export function TrendingHero({
  media,
  rank,
}: {
  media: TrendingMedia
  rank: number
}) {
  const title = displayTitle(media.title)
  const banner = imageSrc(media.bannerImage)
  const genres = (media.genres ?? []).filter(isPresent).slice(0, 3)
  const accent = {
    "--cover": media.coverImage?.color ?? "var(--primary)",
  } as CSSProperties

  return (
    <section
      aria-labelledby="hero-title"
      className="relative -mx-4 overflow-hidden sm:mx-0 sm:rounded-3xl"
      style={accent}
    >
      {banner ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={banner}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}
      {/* Scrims keep the text readable on any banner. */}
      <div className="absolute inset-0 bg-linear-to-t from-background via-background/70 to-background/10" />
      <div className="absolute inset-0 bg-linear-to-r from-background/90 via-background/40 to-transparent" />

      <div className="relative flex min-h-80 items-end gap-5 px-4 pt-24 pb-6 sm:min-h-96 sm:px-8 sm:pb-8">
        <CoverImage
          cover={media.coverImage}
          alt=""
          sizes="160px"
          priority
          className="hidden w-36 shrink-0 rounded-2xl shadow-2xl ring-1 ring-white/10 sm:block lg:w-40"
        />
        <div className="min-w-0 space-y-3">
          <p className="inline-flex items-center gap-1.5 rounded-full bg-(--cover)/20 px-3 py-1 text-xs font-semibold text-foreground ring-1 ring-(--cover)/40 backdrop-blur">
            <FlameIcon className="size-3.5" aria-hidden="true" />#{rank}{" "}
            trending now
          </p>
          <h2
            id="hero-title"
            className="line-clamp-2 text-3xl font-bold tracking-tight text-balance sm:text-4xl lg:text-5xl"
          >
            {title}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            {media.averageScore ? (
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <StarIcon
                  className="size-4 fill-score text-score"
                  aria-hidden="true"
                />
                {media.averageScore}%
              </span>
            ) : null}
            <span>{mediaMeta(media)}</span>
            {genres.length > 0 ? <span>{genres.join(" · ")}</span> : null}
          </div>
          <Button asChild size="lg" className="mt-1 rounded-full px-4">
            <Link href={`/anime/${media.id}`}>
              View details
              <ArrowRightIcon data-icon="inline-end" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
