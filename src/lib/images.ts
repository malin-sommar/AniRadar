import { clientEnv } from "@/lib/env/client"

const ANILIST_CDN = "https://s4.anilist.co/"
const YOUTUBE_THUMBNAILS = "https://i.ytimg.com/"

/**
 * Routes AniList images and YouTube trailer thumbnails through our own /img
 * proxy, so the browser only talks to AniRadar (privacy) and the service
 * worker can cache them (same-origin). NEXT_PUBLIC_IMAGE_PROXY=off loads
 * them from the original hosts.
 */
export function imageSrc(url: string | null | undefined): string | undefined {
  if (!url) return undefined
  if (clientEnv.NEXT_PUBLIC_IMAGE_PROXY === "off") return url
  if (url.startsWith(ANILIST_CDN))
    return `/img/anilist/${url.slice(ANILIST_CDN.length)}`
  if (url.startsWith(YOUTUBE_THUMBNAILS))
    return `/img/youtube/${url.slice(YOUTUBE_THUMBNAILS.length)}`
  return url
}
