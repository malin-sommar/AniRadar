import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { cacheLifeProfile, CACHE_POLICIES } from "@/lib/anilist/cache-policy"
import { RateLimiter } from "@/lib/anilist/core/limiter"
import { serverEnv } from "@/lib/env/server"

import {
  aniListIdsFromKitsu,
  kitsuSearchParams,
  normalizeSearchText,
} from "./title-matches"

// Shared like the AniList limiter (see lib/anilist/server.ts). Kitsu
// publishes no limit; this keeps us a polite, low-volume client.
const LIMITER_KEY = Symbol.for("aniradar.kitsu.limiter")

function limiter(): RateLimiter {
  const scope = globalThis as typeof globalThis & {
    [LIMITER_KEY]?: RateLimiter
  }
  scope[LIMITER_KEY] ??= new RateLimiter({
    requestsPerMinute: 60,
    capacity: 5,
    maxConcurrent: 2,
  })
  return scope[LIMITER_KEY]
}

async function fetchKitsuMatches(text: string): Promise<number[]> {
  const url = `${serverEnv.KITSU_API_URL}/anime?${kitsuSearchParams(text)}`
  return limiter().schedule(async () => {
    const response = await fetch(url, {
      headers: { Accept: "application/vnd.api+json" },
      signal: AbortSignal.timeout(serverEnv.KITSU_TIMEOUT_MS),
    })
    if (!response.ok) throw new Error(`Kitsu answered HTTP ${response.status}`)
    return aniListIdsFromKitsu(await response.json())
  })
}

async function cachedTitleMatches(text: string) {
  "use cache"
  // Same lifetime as browse results. Errors aren't cached, so a failed
  // lookup is retried on the next search.
  cacheLife(cacheLifeProfile(CACHE_POLICIES.browse))
  cacheTag("kitsu")
  return fetchKitsuMatches(text)
}

/**
 * AniList IDs of shows whose titles match `text`, partial words included,
 * best match first. Throws if Kitsu can't be reached.
 */
export function getTitleMatches(text: string): Promise<number[]> {
  return cachedTitleMatches(normalizeSearchText(text))
}
