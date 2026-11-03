import type { MediaFormat } from "@/lib/anilist/gql/graphql"

export type TitleLanguage = "english" | "romaji" | "native"

export interface MediaTitleFields {
  romaji: string | null
  english: string | null
  native: string | null
}

const TITLE_ORDER: Record<TitleLanguage, (keyof MediaTitleFields)[]> = {
  english: ["english", "romaji", "native"],
  romaji: ["romaji", "english", "native"],
  native: ["native", "romaji", "english"],
}

/** The title in the preferred language, falling back to the others. */
export function displayTitle(
  title: MediaTitleFields | null | undefined,
  language: TitleLanguage = "english",
): string {
  if (!title) return "Untitled"
  for (const key of TITLE_ORDER[language]) {
    const value = title[key]?.trim()
    if (value) return value
  }
  return "Untitled"
}

const FORMAT_LABELS: Record<MediaFormat, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
  MANGA: "Manga",
  NOVEL: "Light Novel",
  ONE_SHOT: "One-shot",
}

export function formatLabel(
  format: MediaFormat | null | undefined,
): string | undefined {
  return format ? FORMAT_LABELS[format] : undefined
}

/** "TV · 12 eps · 2026" (parts that are unknown are left out). */
export function mediaMeta({
  format,
  episodes,
  seasonYear,
}: {
  format: MediaFormat | null
  episodes: number | null
  seasonYear: number | null
}): string {
  const parts = [
    formatLabel(format),
    // A one-episode movie doesn't need "1 ep".
    episodes && !(format === "MOVIE" && episodes === 1)
      ? `${episodes} ${episodes === 1 ? "ep" : "eps"}`
      : undefined,
    seasonYear ? String(seasonYear) : undefined,
  ]
  return parts.filter(Boolean).join(" · ")
}

/** "in 2d", "in 5h", "in 12m", or "now" once it's time. */
export function formatCountdown(secondsUntil: number): string {
  if (secondsUntil <= 0) return "now"
  const minutes = Math.floor(secondsUntil / 60)
  if (minutes < 60) return `in ${Math.max(1, minutes)}m`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `in ${hours}h`
  return `in ${Math.floor(hours / 24)}d`
}

export function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined
}
