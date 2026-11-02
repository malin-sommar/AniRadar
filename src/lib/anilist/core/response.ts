import { AniListError, isErrorKind, type GraphQLErrorItem } from "./errors"

export interface TransportResponse {
  status: number
  headers: Headers
  body: unknown
}

/** Pause used when a 429 comes without timing headers (AniList's timeout is 1 min). */
export const DEFAULT_RATE_LIMIT_PAUSE_MS = 60_000

export interface RateLimitHeaders {
  limit?: number
  remaining?: number
}

function headerNumber(headers: Headers, name: string): number | undefined {
  const raw = headers.get(name)
  if (raw === null || raw.trim() === "") return undefined
  const value = Number(raw)
  return Number.isFinite(value) ? value : undefined
}

export function readRateLimitHeaders(headers: Headers): RateLimitHeaders {
  return {
    limit: headerNumber(headers, "x-ratelimit-limit"),
    remaining: headerNumber(headers, "x-ratelimit-remaining"),
  }
}

/**
 * How long to wait, from `Retry-After` (seconds or an HTTP date) or
 * `X-RateLimit-Reset` (Unix seconds).
 */
export function parseRetryAfterMs(
  headers: Headers,
  nowMs: number,
): number | undefined {
  const retryAfter = headers.get("retry-after")
  if (retryAfter) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
    const date = Date.parse(retryAfter)
    if (!Number.isNaN(date)) return Math.max(0, date - nowMs)
  }
  const reset = headerNumber(headers, "x-ratelimit-reset")
  if (reset !== undefined) return Math.max(0, reset * 1000 - nowMs)
  return undefined
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function readErrors(
  body: Record<string, unknown> | undefined,
): GraphQLErrorItem[] | undefined {
  if (!body || !Array.isArray(body.errors)) return undefined
  return body.errors.filter(isRecord).map((error) => ({
    ...(error as Partial<GraphQLErrorItem>),
    message:
      typeof error.message === "string" ? error.message : "Unknown error",
  }))
}

/**
 * Turns a raw response into data, or throws a typed AniListError. Works for
 * AniList itself and for our /api/anilist proxy, which mirrors its shape.
 */
export function interpretResponse<TData>(
  response: TransportResponse,
  nowMs: number,
): TData {
  const { status, headers } = response
  const body = isRecord(response.body) ? response.body : undefined
  const errors = readErrors(body)
  const errorStatus = errors?.find(
    (error) => typeof error.status === "number",
  )?.status
  const hintedKind = errors?.find((error) => isErrorKind(error.kind))?.kind
  const message = errors?.[0]?.message

  if (status === 429 || errorStatus === 429 || hintedKind === "rate_limited") {
    throw new AniListError("rate_limited", "AniList's rate limit was reached", {
      status: 429,
      retryAfterMs:
        parseRetryAfterMs(headers, nowMs) ?? DEFAULT_RATE_LIMIT_PAUSE_MS,
      errors,
    })
  }
  if (status === 403 || hintedKind === "api_disabled") {
    throw new AniListError(
      "api_disabled",
      message ?? "AniList refused the request",
      {
        status,
        retryAfterMs: parseRetryAfterMs(headers, nowMs),
        errors,
      },
    )
  }
  // Our proxy says exactly what went wrong; trust it over the HTTP status.
  if (hintedKind && hintedKind !== "aborted") {
    throw new AniListError(hintedKind, message ?? "AniList request failed", {
      status: errorStatus ?? status,
      errors,
    })
  }
  if (status >= 500) {
    throw new AniListError("server_error", `AniList returned HTTP ${status}`, {
      status,
      errors,
    })
  }
  if (!body) {
    throw new AniListError(
      "invalid_response",
      `Unexpected response (HTTP ${status})`,
      { status },
    )
  }
  // GraphQL reports query problems in `errors`, sometimes with HTTP 200.
  if (errors && errors.length > 0) {
    throw new AniListError("graphql", message ?? "AniList rejected the query", {
      status: errorStatus ?? status,
      errors,
    })
  }
  if (status < 200 || status >= 300 || !isRecord(body.data)) {
    throw new AniListError(
      "invalid_response",
      `Unexpected response (HTTP ${status})`,
      { status },
    )
  }
  return body.data as TData
}
