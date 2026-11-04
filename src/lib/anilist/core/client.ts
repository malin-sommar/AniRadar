import { backoffDelayMs, sleep as defaultSleep } from "./backoff"
import { AniListError, toAniListError } from "./errors"
import type { Priority, RateLimiter } from "./limiter"
import {
  DEFAULT_RATE_LIMIT_PAUSE_MS,
  interpretResponse,
  readRateLimitHeaders,
  type TransportResponse,
} from "./response"
import { stableStringify } from "./stable-stringify"

export interface AniListDocument {
  operationName: string
  query: string
}

export interface TransportRequest {
  operationName: string
  query: string
  variables: Record<string, unknown>
  signal?: AbortSignal
  /** A user's AniList token, for their own list (server only). */
  token?: string
}

/** Sends one request. Server: straight to AniList. Browser: to our proxy. */
export type AniListTransport = (
  request: TransportRequest,
) => Promise<TransportResponse>

export type AniListClientEvent =
  /** A request is going out over the network. */
  | { type: "request"; operationName: string; at: number }
  | {
      type: "success"
      operationName: string
      at: number
      durationMs: number
      status: number
    }
  | {
      type: "error"
      operationName: string
      at: number
      error: AniListError
      attempt: number
      willRetry: boolean
      durationMs: number | undefined
    }
  /** Joined an identical request that was already in flight. */
  | { type: "deduped"; operationName: string; at: number }

export interface RequestOptions {
  priority?: Priority
  signal?: AbortSignal
  /** Sends the request as this AniList user (server only, never shared). */
  token?: string
}

export interface AniListClient {
  request<TData>(
    document: AniListDocument,
    variables?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<TData>
  readonly limiter: RateLimiter
}

export interface AniListClientOptions {
  transport: AniListTransport
  limiter: RateLimiter
  /** Retries after the first attempt, for transient errors only. */
  maxRetries?: number
  /** How long to stop calling AniList after it reports the API as disabled. */
  circuitBreakerMs?: number
  now?: () => number
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>
  random?: () => number
  onEvent?: (event: AniListClientEvent) => void
}

export function createAniListClient({
  transport,
  limiter,
  maxRetries = 3,
  circuitBreakerMs = 5 * 60_000,
  now = Date.now,
  sleep = defaultSleep,
  random = Math.random,
  onEvent,
}: AniListClientOptions): AniListClient {
  const inflight = new Map<string, Promise<unknown>>()
  let circuitOpenUntil = 0

  async function execute<TData>(
    { operationName, query }: AniListDocument,
    variables: Record<string, unknown>,
    { priority = "interactive", signal, token }: RequestOptions,
  ): Promise<TData> {
    for (let attempt = 0; ; attempt++) {
      if (now() < circuitOpenUntil) {
        throw new AniListError(
          "api_disabled",
          "AniList is unavailable right now",
          {
            retryAfterMs: circuitOpenUntil - now(),
            source: "queue",
          },
        )
      }

      let error: AniListError
      let startedAt: number | undefined
      try {
        const response = await limiter.schedule(
          () => {
            startedAt = now()
            onEvent?.({ type: "request", operationName, at: startedAt })
            return transport({ operationName, query, variables, signal, token })
          },
          { priority, signal },
        )
        limiter.observe(readRateLimitHeaders(response.headers))
        const data = interpretResponse<TData>(response, now())
        onEvent?.({
          type: "success",
          operationName,
          at: now(),
          durationMs: now() - (startedAt ?? now()),
          status: response.status,
        })
        return data
      } catch (caught) {
        error = toAniListError(caught, signal)
      }

      const fromUpstream = error.source === "upstream"
      if (error.kind === "rate_limited" && fromUpstream) {
        limiter.onRateLimited(error.retryAfterMs ?? DEFAULT_RATE_LIMIT_PAUSE_MS)
      }
      if (error.kind === "api_disabled" && fromUpstream) {
        circuitOpenUntil = now() + circuitBreakerMs
      }

      const willRetry =
        error.transient &&
        fromUpstream &&
        attempt < maxRetries &&
        !signal?.aborted
      onEvent?.({
        type: "error",
        operationName,
        at: now(),
        error,
        attempt,
        willRetry,
        durationMs: startedAt === undefined ? undefined : now() - startedAt,
      })
      if (!willRetry) throw error

      // A rate-limited retry waits inside the paused limiter; everything
      // else backs off first.
      if (error.kind !== "rate_limited") {
        await sleep(backoffDelayMs(attempt, random), signal).catch((reason) => {
          throw toAniListError(reason, signal)
        })
      }
    }
  }

  function request<TData>(
    document: AniListDocument,
    variables: Record<string, unknown> = {},
    options: RequestOptions = {},
  ): Promise<TData> {
    // Cancellable requests aren't shared: aborting one caller mustn't
    // cancel another's. Nor are a user's own: their answer is theirs alone.
    if (options.signal || options.token) {
      return execute<TData>(document, variables, options)
    }

    const key = `${document.operationName}:${stableStringify(variables)}`
    const existing = inflight.get(key)
    if (existing) {
      onEvent?.({
        type: "deduped",
        operationName: document.operationName,
        at: now(),
      })
      return existing as Promise<TData>
    }
    const promise = execute<TData>(document, variables, options).finally(() => {
      inflight.delete(key)
    })
    inflight.set(key, promise)
    return promise
  }

  return { request, limiter }
}
