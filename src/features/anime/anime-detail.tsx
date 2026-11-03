import type { CSSProperties, ReactNode } from "react"

import { isPresent } from "@/domain/media"
import { parseTrailer, streamingLinks } from "@/domain/detail"
import { sanitizeDescription } from "@/lib/sanitize"

import { AdultGate } from "./adult-gate"
import { AiringPanel } from "./airing-panel"
import { CharactersSection } from "./characters"
import { DetailHero } from "./detail-hero"
import { Facts } from "./facts"
import type { AnimeDetail } from "./load"
import { Recommendations } from "./recommendations"
import { StreamingLinks } from "./streaming-links"
import { Synopsis } from "./synopsis"
import { TagList } from "./tag-list"
import { TrailerPlayer } from "./trailer"

/**
 * The detail page. Sections without data are left out. The MAL score and
 * the season chain arrive as slots that stream in on their own.
 */
export function AnimeDetailView({
  media,
  malScore,
  seasons,
}: {
  media: AnimeDetail
  malScore: ReactNode
  seasons: ReactNode
}) {
  const accent = {
    "--cover": media.coverImage?.color ?? "var(--primary)",
  } as CSSProperties
  const description = sanitizeDescription(media.description)
  const streaming = streamingLinks(media.externalLinks)
  const trailer = parseTrailer(media.trailer)
  const schedule = (media.airingSchedule?.nodes ?? []).filter(isPresent)
  const showAiring =
    media.status === "RELEASING" ||
    (media.status === "NOT_YET_RELEASED" && schedule.length > 0)
  const characters = (media.characters?.edges ?? []).filter(isPresent)
  const recommendations = (media.recommendations?.nodes ?? [])
    .map((node) => node?.mediaRecommendation)
    .filter(isPresent)

  return (
    <AdultGate isAdult={media.isAdult === true}>
      <article className="space-y-8 pb-6" style={accent}>
        <DetailHero
          media={{
            id: media.id,
            title: media.title,
            coverImage: media.coverImage,
            bannerImage: media.bannerImage,
            format: media.format,
            episodes: media.episodes,
            seasonYear: media.seasonYear,
            status: media.status,
            averageScore: media.averageScore,
            isAdult: media.isAdult,
          }}
          malScore={malScore}
        />

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-10">
            {showAiring ? (
              <AiringPanel
                status={media.status}
                schedule={schedule}
                totalEpisodes={media.episodes}
              />
            ) : null}
            {description ? <Synopsis html={description} /> : null}
            {streaming.length > 0 ? <StreamingLinks links={streaming} /> : null}
            {seasons}
            {characters.length > 0 ? (
              <CharactersSection
                animeId={media.id}
                initial={characters}
                hasMore={media.characters?.pageInfo?.hasNextPage === true}
              />
            ) : null}
            {trailer ? <TrailerPlayer trailer={trailer} /> : null}
          </div>

          <aside className="space-y-8" aria-label="Details">
            <Facts media={media} />
            <TagList tags={(media.tags ?? []).filter(isPresent)} />
          </aside>
        </div>

        {recommendations.length > 0 ? (
          <Recommendations media={recommendations} />
        ) : null}
      </article>
    </AdultGate>
  )
}
