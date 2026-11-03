import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { connection } from "next/server"
import { Suspense } from "react"

import { displayTitle } from "@/domain/media"
import { parseAnimeId } from "@/domain/detail"
import { hasSeasonChain } from "@/domain/seasons"
import { AnimeDetailView } from "@/features/anime/anime-detail"
import { DetailError } from "@/features/anime/detail-error"
import { DetailSkeleton } from "@/features/anime/detail-skeleton"
import { getAnimeDetail, type AnimeDetail } from "@/features/anime/load"
import { MalScoreChip } from "@/features/anime/mal-score"
import { ScoreChipSkeleton } from "@/features/anime/score-chip"
import {
  RelatedSection,
  SeasonsSkeleton,
  SeriesSection,
} from "@/features/anime/seasons-section"
import { imageSrc } from "@/lib/images"
import { descriptionText } from "@/lib/sanitize"

/**
 * One real ID, so the build produces the page's shell. Every other anime
 * renders on its first visit (the shell shows at once) and is then cached
 * like a static page, for as long as its data stays fresh.
 */
export function generateStaticParams() {
  return [{ id: "16498" }]
}

async function detailOrNull(id: number): Promise<AnimeDetail | null> {
  try {
    return await getAnimeDetail(id)
  } catch {
    return null
  }
}

export async function generateMetadata({
  params,
}: PageProps<"/anime/[id]">): Promise<Metadata> {
  const id = parseAnimeId((await params).id)
  const media = id === null ? null : await detailOrNull(id)
  if (!media) return { title: "Anime" }

  const title = displayTitle(media.title)
  const description = descriptionText(media.description) || undefined
  const image =
    imageSrc(media.bannerImage) ?? imageSrc(media.coverImage?.extraLarge)
  return {
    title,
    description,
    alternates: { canonical: `/anime/${media.id}` },
    openGraph: {
      type: "video.tv_show",
      title,
      description,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: media.bannerImage ? "summary_large_image" : "summary",
      title,
      description,
    },
    // Adult entries stay out of link previews and search engines.
    robots: media.isAdult ? { index: false, follow: false } : undefined,
  }
}

async function AnimeDetailRoute({ params }: PageProps<"/anime/[id]">) {
  const id = parseAnimeId((await params).id)
  if (id === null) notFound()

  let media: AnimeDetail | null
  try {
    media = await getAnimeDetail(id)
  } catch (error) {
    console.warn(`[anime/${id}] AniList is unavailable:`, error)
    // Render this one at request time, so the error is never cached.
    await connection()
    return <DetailError />
  }
  if (!media) notFound()

  return (
    <AnimeDetailView
      media={media}
      malScore={
        <Suspense fallback={<ScoreChipSkeleton />}>
          <MalScoreChip id={id} />
        </Suspense>
      }
      series={
        // Only entries with a prequel or sequel get the series overview, so
        // one-off shows never flash its skeleton.
        hasSeasonChain(media) ? (
          <Suspense fallback={<SeasonsSkeleton />}>
            <SeriesSection id={id} />
          </Suspense>
        ) : null
      }
      related={
        <Suspense>
          <RelatedSection id={id} />
        </Suspense>
      }
    />
  )
}

export default function AnimePage(props: PageProps<"/anime/[id]">) {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <AnimeDetailRoute {...props} />
    </Suspense>
  )
}
