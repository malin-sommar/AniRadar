import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import {
  CACHE_POLICIES,
  ERROR_CACHE_LIFE,
  cacheLifeProfile,
} from "@/lib/anilist/cache-policy"
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

// Errors thrown inside `'use cache'` lose their details (and fail
// prerenders), so failures come back as data.
async function cachedTitleMatches(
  text: string,
): Promise<{ ids: number[] } | { failed: string }> {
  "use cache"
  cacheTag("kitsu")
  try {
    const ids = await fetchKitsuMatches(text)
    // Same lifetime as browse results.
    cacheLife(cacheLifeProfile(CACHE_POLICIES.browse))
    return { ids }
  } catch (error) {
    cacheLife(ERROR_CACHE_LIFE)
    return { failed: String(error) }
  }
}

/**
 * AniList IDs of shows whose titles match `text`, partial words included,
 * best match first. Throws if Kitsu can't be reached.
 */
export async function getTitleMatches(text: string): Promise<number[]> {
  const result = await cachedTitleMatches(normalizeSearchText(text))
  if ("failed" in result) throw new Error(result.failed)
  return result.ids
}
