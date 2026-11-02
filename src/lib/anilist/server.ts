import "server-only"

import { cacheLife, cacheTag } from "next/cache"

import { serverEnv } from "@/lib/env/server"

import {
  createAniListClient,
  type AniListClient,
  type AniListTransport,
  type RequestOptions,
} from "./core/client"
import { RateLimiter } from "./core/limiter"
import { canonicalize } from "./core/stable-stringify"
import { createStats, recordEvent, type AniListStats } from "./core/stats"
import { cacheLifeProfile } from "./cache-policy"
import {
  cachePolicyFor,
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
}) => {
  const timeout = AbortSignal.timeout(serverEnv.ANILIST_TIMEOUT_MS)
  const response = await fetch(serverEnv.ANILIST_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
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

async function cachedAniList(
  name: OperationName,
  variables: Record<string, unknown>,
) {
  "use cache"
  cacheLife(cacheLifeProfile(cachePolicyFor(name)))
  cacheTag("anilist", `anilist:${name}`)
  return requestAniList(name, variables as OperationVariables<OperationName>)
}

/**
 * Cached AniList call for server components and the /api/anilist proxy.
 * Entries live as long as the operation's cache policy says.
 */
export function getAniList<N extends OperationName>(
  name: N,
  variables: OperationVariables<N>,
): Promise<OperationData<N>> {
  state().stats.lookups++
  // Sorted keys, so the same variables in a different order share an entry.
  const key = canonicalize(variables) as Record<string, unknown>
  return cachedAniList(name, key) as Promise<OperationData<N>>
}

export function getServerAniListSnapshot() {
  const { client, stats } = state()
  return { stats, limiter: client.limiter.snapshot() }
}
