import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import {
  CACHE_POLICIES,
  ERROR_CACHE_LIFE,
  cacheLifeProfile,
} from "@/lib/anilist/cache-policy"
import { RateLimiter } from "@/lib/anilist/core/limiter"
import { serverEnv } from "@/lib/env/server"

import { malScoreFromJikan, type MalScore } from "./mal-score"

/*
 * Jikan is an unofficial MyAnimeList API (PLAN.md §6): 3 requests a second,
 * 60 a minute, and not always up. It only ever adds a score chip, so every
 * failure ends in "no score" rather than an error.
 */

interface JikanState {
  limiter: RateLimiter
  /** After a failure, Jikan is skipped until this `performance.now()` time. */
  pausedUntil: number
}

const STATE_KEY = Symbol.for("aniradar.jikan.server")
const PAUSE_AFTER_FAILURE_MS = 5 * 60_000

function state(): JikanState {
  const scope = globalThis as typeof globalThis & { [STATE_KEY]?: JikanState }
  scope[STATE_KEY] ??= {
    limiter: new RateLimiter({
      requestsPerMinute: 50,
      capacity: 3,
      maxConcurrent: 1,
    }),
    pausedUntil: 0,
  }
  return scope[STATE_KEY]
}

/** `null` when MAL has no such entry; throws when Jikan can't answer. */
async function fetchMalScore(malId: number): Promise<MalScore | null> {
  return state().limiter.schedule(async () => {
    const response = await fetch(`${serverEnv.JIKAN_API_URL}/anime/${malId}`, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(serverEnv.JIKAN_TIMEOUT_MS),
    })
    if (response.status === 404) return null
    if (!response.ok) throw new Error(`Jikan answered HTTP ${response.status}`)
    return malScoreFromJikan(await response.json())
  })
}

// Errors thrown inside `'use cache'` fail a prerender even when caught
// outside, so failures come back as data.
async function cachedMalScore(
  malId: number,
): Promise<{ score: MalScore | null } | { failed: string }> {
  "use cache"
  cacheTag("jikan")
  try {
    const score = await fetchMalScore(malId)
    cacheLife(cacheLifeProfile(CACHE_POLICIES.mal))
    return { score }
  } catch (error) {
    cacheLife(ERROR_CACHE_LIFE)
    return { failed: String(error) }
  }
}

/**
 * MyAnimeList's score for an anime, cached for a day. Returns null when
 * there's no MAL entry or Jikan is unavailable; after a failure Jikan is
 * left alone for five minutes.
 */
export async function getMalScore(malId: number): Promise<MalScore | null> {
  const jikan = state()
  if (performance.now() < jikan.pausedUntil) return null
  const result = await cachedMalScore(malId)
  if ("score" in result) return result.score
  jikan.pausedUntil = performance.now() + PAUSE_AFTER_FAILURE_MS
  console.warn("[jikan] MAL score unavailable:", result.failed)
  return null
}
