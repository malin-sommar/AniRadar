const MINUTE = 60
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

export type CacheClass =
  | "static"
  | "detail"
  | "airing"
  | "trending"
  | "browse"
  | "seasonal"
  | "relations"

export interface CachePolicy {
  /** Seconds the data counts as fresh. */
  freshSeconds: number
  /** Seconds after which stale data is no longer shown, even while refreshing. */
  staleSeconds: number
  /** Kept in the on-device (IndexedDB) query cache, for instant loads and offline use. */
  persist: boolean
}

/** One table for every layer: TanStack Query, the CDN and Next's server cache. */
export const CACHE_POLICIES: Record<CacheClass, CachePolicy> = {
  /** Genre and tag lists. */
  static: { freshSeconds: 7 * DAY, staleSeconds: 30 * DAY, persist: true },
  /** Core media details. */
  detail: { freshSeconds: 6 * HOUR, staleSeconds: DAY, persist: true },
  /** Next episode and airing schedules. */
  airing: { freshSeconds: 15 * MINUTE, staleSeconds: HOUR, persist: true },
  trending: {
    freshSeconds: 30 * MINUTE,
    staleSeconds: 6 * HOUR,
    persist: true,
  },
  /** Search and filtered browse pages: too many combinations to keep. */
  browse: { freshSeconds: 30 * MINUTE, staleSeconds: 6 * HOUR, persist: false },
  seasonal: { freshSeconds: 6 * HOUR, staleSeconds: DAY, persist: true },
  /** Relations, season chains and characters. */
  relations: { freshSeconds: DAY, staleSeconds: 7 * DAY, persist: true },
}

/** Profile for Next's `cacheLife()`. */
export function cacheLifeProfile(policy: CachePolicy) {
  return {
    // How long the client router may reuse a page without asking the server.
    stale: 5 * MINUTE,
    revalidate: policy.freshSeconds,
    expire: Math.max(policy.staleSeconds, policy.freshSeconds + MINUTE),
  }
}

/**
 * Lifetime for output rendered after AniList failed: under five minutes, so
 * Next.js renders it at request time instead of baking it into a prerender.
 */
export const FAILURE_CACHE_LIFE = { stale: 30, revalidate: 30, expire: 120 }

/** `Cache-Control` for CDN-cached proxy responses. */
export function cdnCacheControl(policy: CachePolicy): string {
  const swr = Math.max(0, policy.staleSeconds - policy.freshSeconds)
  return `public, max-age=0, s-maxage=${policy.freshSeconds}, stale-while-revalidate=${swr}`
}
