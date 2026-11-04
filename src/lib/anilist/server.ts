import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { serverEnv } from "@/lib/env/server"

import {
  createAniListClient,
  type AniListClient,
  type AniListTransport,
  type RequestOptions,
} from "./core/client"
import {
  fromAniListErrorData,
  isAniListError,
  toAniListErrorData,
  type AniListErrorData,
} from "./core/errors"
import { RateLimiter } from "./core/limiter"
import { canonicalize } from "./core/stable-stringify"
import { createStats, recordEvent, type AniListStats } from "./core/stats"
import { ERROR_CACHE_LIFE, cacheLifeProfile } from "./cache-policy"
import {
  cachePolicyFor,
  cachePolicyForData,
  documentFor,
  type OperationData,
  type OperationName,
  type OperationVariables,
} from "./registry"

interface ServerState {
  client: AniListClient
  stats: AniListStats
}

// Kept on globalThis so server components, route handlers and dev reloads
// all share one limiter. AniList's limit is per IP, not per module.
const STATE_KEY = Symbol.for("aniradar.anilist.server")

const upstreamTransport: AniListTransport = async ({
  query,
  variables,
  signal,
  token,
}) => {
  const timeout = AbortSignal.timeout(serverEnv.ANILIST_TIMEOUT_MS)
  const response = await fetch(serverEnv.ANILIST_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  })
  const body: unknown = await response.json().catch(() => undefined)
  return { status: response.status, headers: response.headers, body }
}

function state(): ServerState {
  const scope = globalThis as typeof globalThis & { [STATE_KEY]?: ServerState }
  if (!scope[STATE_KEY]) {
    const stats = createStats()
    const limiter = new RateLimiter({
      requestsPerMinute: serverEnv.ANILIST_REQUESTS_PER_MINUTE,
      maxRequestsPerMinute: serverEnv.ANILIST_MAX_REQUESTS_PER_MINUTE,
    })
    const client = createAniListClient({
      transport: upstreamTransport,
      limiter,
      onEvent: (event) => recordEvent(stats, event),
    })
    scope[STATE_KEY] = { client, stats }
  }
  return scope[STATE_KEY]
}

/** Calls AniList without caching (still rate limited and retried). */
export function requestAniList<N extends OperationName>(
  name: N,
  variables: OperationVariables<N>,
  options?: RequestOptions,
): Promise<OperationData<N>> {
  return state().client.request<OperationData<N>>(
    documentFor(name),
    variables as Record<string, unknown>,
    options,
  )
}

type CachedResult = { data: unknown } | { error: AniListErrorData }

// Errors thrown inside `'use cache'` lose their class on the way out, so
// AniList errors come back as data and are rebuilt in getAniList.
async function cachedAniList(
  name: OperationName,
  variables: Record<string, unknown>,
): Promise<CachedResult> {
  "use cache"
  cacheTag("anilist", `anilist:${name}`)
  try {
    const data = await requestAniList(
      name,
      variables as OperationVariables<OperationName>,
    )
    // Set after the response, since some operations cache by what came back.
    cacheLife(cacheLifeProfile(cachePolicyForData(name, data)))
    return { data }
  } catch (error) {
    if (!isAniListError(error)) throw error
    // "Not found" is a stable answer, cached like data.
    cacheLife(
      error.notFound
        ? cacheLifeProfile(cachePolicyFor(name))
        : ERROR_CACHE_LIFE,
    )
    return { error: toAniListErrorData(error) }
  }
}

/**
 * Cached AniList call for server components and the /api/anilist proxy.
 * Entries live as long as the operation's cache policy says.
 */
export async function getAniList<N extends OperationName>(
  name: N,
  variables: OperationVariables<N>,
): Promise<OperationData<N>> {
  state().stats.lookups++
  // Sorted keys, so the same variables in a different order share an entry.
  const key = canonicalize(variables) as Record<string, unknown>
  const result = await cachedAniList(name, key)
  if ("error" in result) throw fromAniListErrorData(result.error)
  return result.data as OperationData<N>
}

export function getServerAniListSnapshot() {
  const { client, stats } = state()
  return { stats, limiter: client.limiter.snapshot() }
}
