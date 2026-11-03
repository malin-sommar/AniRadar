import type {
  MediaFormat,
  MediaSeason,
  MediaSource,
  MediaStatus,
} from "@/lib/anilist/gql/graphql"

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

export const STATUS_LABELS: Record<MediaStatus, string> = {
  FINISHED: "Finished",
  RELEASING: "Airing",
  NOT_YET_RELEASED: "Upcoming",
  CANCELLED: "Cancelled",
  HIATUS: "On hiatus",
}

const SOURCE_LABELS: Record<MediaSource, string> = {
  ANIME: "Anime",
  COMIC: "Comic",
  DOUJINSHI: "Doujinshi",
  GAME: "Game",
  LIGHT_NOVEL: "Light novel",
  LIVE_ACTION: "Live action",
  MANGA: "Manga",
  MULTIMEDIA_PROJECT: "Multimedia project",
  NOVEL: "Novel",
  ORIGINAL: "Original",
  OTHER: "Other",
  PICTURE_BOOK: "Picture book",
  VIDEO_GAME: "Video game",
  VISUAL_NOVEL: "Visual novel",
  WEB_NOVEL: "Web novel",
}

export function sourceLabel(source: MediaSource | null | undefined) {
  return source ? SOURCE_LABELS[source] : undefined
}

/** "24 min", "1 h 50 min". */
export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return undefined
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  if (hours === 0) return `${rest} min`
  return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`
}

/** "12 × 24 min", "12 episodes", "1 h 50 min" (one-episode movies). */
export function episodesLabel({
  episodes,
  duration,
}: {
  episodes: number | null
  duration: number | null
}) {
  const length = formatDuration(duration)
  if (episodes === 1 && length) return length
  if (episodes && length) return `${episodes} × ${length}`
  if (episodes) return `${episodes} ${episodes === 1 ? "episode" : "episodes"}`
  return length ? `${length} per episode` : undefined
}

export interface FuzzyDate {
  year: number | null
  month: number | null
  day: number | null
}

const DATE_FORMATS = {
  day: new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
  month: new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }),
}

/** "7 Jan 2026", "Jan 2026" or "2026", depending on what's known. */
export function formatFuzzyDate(date: FuzzyDate | null | undefined) {
  if (!date?.year) return undefined
  if (!date.month) return String(date.year)
  const value = new Date(Date.UTC(date.year, date.month - 1, date.day ?? 1))
  return (date.day ? DATE_FORMATS.day : DATE_FORMATS.month).format(value)
}

/** "7 Jan 2026 – 25 Mar 2026", "7 Jan 2026 – " while airing, or one date. */
export function airedLabel(
  start: FuzzyDate | null | undefined,
  end: FuzzyDate | null | undefined,
  status: MediaStatus | null | undefined,
) {
  const from = formatFuzzyDate(start)
  const to = formatFuzzyDate(end)
  if (!from) return undefined
  if (to && to !== from) return `${from} – ${to}`
  if (status === "RELEASING") return `${from} – now`
  return from
}

const SEASON_NAMES: Record<MediaSeason, string> = {
  WINTER: "Winter",
  SPRING: "Spring",
  SUMMER: "Summer",
  FALL: "Fall",
}

/** "Winter 2026". */
export function seasonLabel(
  season: MediaSeason | null | undefined,
  year: number | null | undefined,
) {
  if (!season || !year) return undefined
  return `${SEASON_NAMES[season]} ${year}`
}
