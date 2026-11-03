import { describe, expect, it } from "vitest"

import {
  DEFAULT_RATE_LIMIT_PAUSE_MS,
  interpretResponse,
  parseRetryAfterMs,
  readRateLimitHeaders,
  type TransportResponse,
} from "./response"

const NOW = Date.UTC(2026, 10, 2, 12, 0, 0)

function response(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): TransportResponse {
  return { status, headers: new Headers(headers), body }
}

function caught(fn: () => unknown) {
  try {
    fn()
  } catch (error) {
    return error
  }
  throw new Error("Expected an error")
}

describe("parseRetryAfterMs", () => {
  it("reads Retry-After in seconds", () => {
    expect(parseRetryAfterMs(new Headers({ "Retry-After": "30" }), NOW)).toBe(
      30_000,
    )
  })

  it("reads Retry-After as an HTTP date", () => {
    const date = new Date(NOW + 45_000).toUTCString()
    expect(parseRetryAfterMs(new Headers({ "Retry-After": date }), NOW)).toBe(
      45_000,
    )
  })

  it("falls back to X-RateLimit-Reset (Unix seconds)", () => {
    const reset = String(NOW / 1000 + 20)
    expect(
      parseRetryAfterMs(new Headers({ "X-RateLimit-Reset": reset }), NOW),
    ).toBe(20_000)
  })

  it("returns undefined without timing headers", () => {
    expect(parseRetryAfterMs(new Headers(), NOW)).toBeUndefined()
  })
})

describe("readRateLimitHeaders", () => {
  it("parses the limit and what's left", () => {
    const headers = new Headers({
      "X-RateLimit-Limit": "30",
      "X-RateLimit-Remaining": "0",
    })
    expect(readRateLimitHeaders(headers)).toEqual({ limit: 30, remaining: 0 })
  })

  it("ignores missing or garbage values", () => {
    expect(
      readRateLimitHeaders(new Headers({ "X-RateLimit-Limit": "lots" })),
    ).toEqual({
      limit: undefined,
      remaining: undefined,
    })
  })
})

describe("interpretResponse", () => {
  it("returns data on success", () => {
    expect(
      interpretResponse(response(200, { data: { Page: {} } }), NOW),
    ).toEqual({ Page: {} })
  })

  it("classifies 429 with its Retry-After", () => {
    const error = caught(() =>
      interpretResponse(
        response(
          429,
          {
            data: null,
            errors: [{ message: "Too Many Requests.", status: 429 }],
          },
          { "Retry-After": "12" },
        ),
        NOW,
      ),
    )
    expect(error).toMatchObject({
      kind: "rate_limited",
      retryAfterMs: 12_000,
      source: "upstream",
    })
  })

  it("assumes AniList's one-minute timeout when a 429 has no timing headers", () => {
    expect(
      caught(() => interpretResponse(response(429, {}), NOW)),
    ).toMatchObject({
      retryAfterMs: DEFAULT_RATE_LIMIT_PAUSE_MS,
    })
  })

  it("spots a rate limit reported only inside the GraphQL errors", () => {
    const body = {
      data: null,
      errors: [{ message: "Too Many Requests.", status: 429 }],
    }
    expect(
      caught(() => interpretResponse(response(200, body), NOW)),
    ).toMatchObject({ kind: "rate_limited" })
  })

  it("treats 403 as the API being disabled", () => {
    const body = {
      data: null,
      errors: [
        {
          message: "The AniList API has been temporarily disabled",
          status: 403,
        },
      ],
    }
    expect(
      caught(() => interpretResponse(response(403, body), NOW)),
    ).toMatchObject({
      kind: "api_disabled",
      message: "The AniList API has been temporarily disabled",
    })
  })

  it("classifies 5xx as a server error", () => {
    expect(
      caught(() => interpretResponse(response(502, "Bad gateway"), NOW)),
    ).toMatchObject({
      kind: "server_error",
      status: 502,
    })
  })

  it("classifies a missing or non-JSON body as invalid", () => {
    expect(
      caught(() => interpretResponse(response(200, undefined), NOW)),
    ).toMatchObject({
      kind: "invalid_response",
    })
    expect(
      caught(() => interpretResponse(response(200, { data: null }), NOW)),
    ).toMatchObject({
      kind: "invalid_response",
    })
  })

  it("trusts the kind our proxy reports over its HTTP status", () => {
    const rejected = {
      data: null,
      errors: [
        {
          message: "AniList rejected the request",
          status: 502,
          kind: "graphql",
        },
      ],
    }
    expect(
      caught(() => interpretResponse(response(502, rejected), NOW)),
    ).toMatchObject({ kind: "graphql" })

    const disabled = {
      data: null,
      errors: [{ message: "Unavailable", status: 503, kind: "api_disabled" }],
    }
    expect(
      caught(() => interpretResponse(response(503, disabled), NOW)),
    ).toMatchObject({ kind: "api_disabled" })
  })
})
