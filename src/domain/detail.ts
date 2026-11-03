/** A playable trailer. AniList IDs sometimes carry stray whitespace. */
export interface Trailer {
  site: "youtube" | "dailymotion"
  id: string
  watchUrl: string
  /** YouTube only: the no-cookie player, loaded when you press play. */
  embedUrl?: string
  thumbnail?: string
}

const VIDEO_ID = /^[\w-]{5,20}$/

export function parseTrailer(
  trailer: { id: string | null; site: string | null } | null | undefined,
): Trailer | null {
  const id = trailer?.id?.trim()
  if (!id || !VIDEO_ID.test(id)) return null
  switch (trailer?.site) {
    case "youtube":
      return {
        site: "youtube",
        id,
        watchUrl: `https://www.youtube.com/watch?v=${id}`,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      }
    case "dailymotion":
      return {
        site: "dailymotion",
        id,
        watchUrl: `https://www.dailymotion.com/video/${id}`,
      }
    default:
      return null
  }
}

export interface ExternalLink {
  id: number
  site: string
  url: string | null
  type: string | null
  language: string | null
  color: string | null
  icon: string | null
  isDisabled: boolean | null
}

export interface StreamingLink {
  id: number
  site: string
  url: string
  language: string | null
  /** A hex colour, or null if AniList's value isn't one. */
  color: string | null
  icon: string | null
}

const HEX_COLOR = /^#[\da-f]{3,8}$/i

/** An https URL; old `http://` links on AniList are upgraded, others dropped. */
function secureUrl(url: string | null): string | null {
  if (url?.startsWith("https://")) return url
  if (url?.startsWith("http://"))
    return `https://${url.slice("http://".length)}`
  return null
}

/** Streaming services from AniList's links, usable and without repeats. */
export function streamingLinks(
  links: ReadonlyArray<ExternalLink | null> | null | undefined,
): StreamingLink[] {
  const seen = new Set<string>()
  const result: StreamingLink[] = []
  for (const link of links ?? []) {
    if (!link || link.type !== "STREAMING" || link.isDisabled) continue
    const url = secureUrl(link.url)
    if (!url) continue
    const key = `${link.site}|${link.language ?? ""}`
    if (seen.has(key)) continue
    seen.add(key)
    result.push({
      id: link.id,
      site: link.site,
      url,
      language: link.language,
      color: link.color && HEX_COLOR.test(link.color) ? link.color : null,
      icon: link.icon,
    })
  }
  return result
}

/** "/anime/21" from route params, or null if it isn't a plausible AniList ID. */
export function parseAnimeId(value: string): number | null {
  if (!/^\d{1,8}$/.test(value)) return null
  const id = Number(value)
  return id > 0 ? id : null
}
