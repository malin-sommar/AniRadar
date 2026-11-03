import { ExternalLinkIcon } from "lucide-react"
import type { Route } from "next"
import Link from "next/link"
import type { ReactNode } from "react"

import {
  STATUS_LABELS,
  airedLabel,
  episodesLabel,
  formatLabel,
  isPresent,
  seasonLabel,
  sourceLabel,
} from "@/domain/media"
import { serializeBrowse } from "@/features/browse/search-params"

import type { AnimeDetail } from "./load"
import { DetailSection } from "./section"

const SEASON_SLUGS = {
  WINTER: "winter",
  SPRING: "spring",
  SUMMER: "summer",
  FALL: "fall",
} as const

const numbers = new Intl.NumberFormat("en")

/** The fact sheet: format, episodes, dates, studio, source and genres. */
export function Facts({ media }: { media: AnimeDetail }) {
  const studios = (media.studios?.nodes ?? []).filter(isPresent)
  const genres = (media.genres ?? []).filter(isPresent)
  const season = seasonLabel(media.season, media.seasonYear)

  const rows: [string, ReactNode][] = [
    ["Format", formatLabel(media.format)],
    ["Episodes", episodesLabel(media)],
    ["Status", media.status ? STATUS_LABELS[media.status] : undefined],
    [
      "Season",
      season && media.season ? (
        <Link
          href={
            serializeBrowse("/browse", {
              season: SEASON_SLUGS[media.season],
              year: media.seasonYear,
            }) as Route
          }
          className="underline-offset-2 hover:underline"
        >
          {season}
        </Link>
      ) : undefined,
    ],
    ["Aired", airedLabel(media.startDate, media.endDate, media.status)],
    [
      studios.length > 1 ? "Studios" : "Studio",
      studios.length > 0
        ? studios.map((studio) => studio.name).join(", ")
        : undefined,
    ],
    ["Source", sourceLabel(media.source)],
    [
      "Popularity",
      media.popularity
        ? `${numbers.format(media.popularity)} on AniList`
        : undefined,
    ],
  ]

  return (
    <DetailSection id="facts-title" title="Details">
      <dl className="divide-y rounded-3xl border bg-card px-5 text-sm">
        {rows
          .filter(([, value]) => value !== undefined && value !== "")
          .map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium">{value}</dd>
            </div>
          ))}
      </dl>

      {genres.length > 0 ? (
        <ul aria-label="Genres" className="flex flex-wrap gap-2">
          {genres.map((genre) => (
            <li key={genre}>
              <Link
                href={serializeBrowse("/browse", { genres: [genre] }) as Route}
                className="inline-flex h-8 items-center rounded-full bg-(--cover)/15 px-3 text-sm font-medium ring-1 ring-(--cover)/35 transition-colors hover:bg-(--cover)/25"
              >
                {genre}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
        {media.siteUrl ? (
          <li>
            <ExternalLink href={media.siteUrl}>View on AniList</ExternalLink>
          </li>
        ) : null}
        {media.idMal ? (
          <li>
            <ExternalLink href={`https://myanimelist.net/anime/${media.idMal}`}>
              MyAnimeList
            </ExternalLink>
          </li>
        ) : null}
      </ul>
    </DetailSection>
  )
}

function ExternalLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
    >
      {children}
      <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
    </a>
  )
}
