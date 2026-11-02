import {
  createAniListClient,
  type AniListClient,
  type AniListTransport,
  type RequestOptions,
} from "./core/client"
import { RateLimiter } from "./core/limiter"
import { stableStringify } from "./core/stable-stringify"
import { createStats, recordEvent, type AniListStats } from "./core/stats"
import {
  documentFor,
  type OperationData,
  type OperationName,
  type OperationVariables,
} from "./registry"

/**
 * The browser never calls AniList directly: it asks our /api/anilist proxy,
 * which validates the operation, caches at the CDN and shares one limiter.
 */
const proxyTransport: AniListTransport = async ({
  operationName,
  variables,
  signal,
}) => {
  const params = new URLSearchParams({ v: stableStringify(variables) })
  const response = await fetch(`/api/anilist/${operationName}?${params}`, {
    headers: { Accept: "application/json" },
    signal,
  })
  const body: unknown = await response.json().catch(() => undefined)
  return { status: response.status, headers: response.headers, body }
}

let client: AniListClient | undefined

export const browserStats: AniListStats = createStats()

export function getBrowserAniListClient(): AniListClient {
  client ??= createAniListClient({
    transport: proxyTransport,
    // Most proxy calls are CDN hits, so this only guards against bursts
    // (fast scrolling, rapid filter changes).
    limiter: new RateLimiter({
      requestsPerMinute: 60,
      capacity: 8,
      maxConcurrent: 4,
    }),
    onEvent: (event) => recordEvent(browserStats, event),
  })
  return client
}

export function fetchAniList<N extends OperationName>(
  name: N,
  variables: OperationVariables<N>,
  options?: RequestOptions,
): Promise<OperationData<N>> {
  browserStats.lookups++
  return getBrowserAniListClient().request<OperationData<N>>(
    documentFor(name),
    variables as Record<string, unknown>,
    options,
  )
}
