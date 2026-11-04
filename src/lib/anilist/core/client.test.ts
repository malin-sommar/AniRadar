import { describe, expect, it, vi } from "vitest"

import {
  createAniListClient,
  type AniListClientOptions,
  type TransportRequest,
} from "./client"
import { AniListError } from "./errors"
import type { RateLimiter } from "./limiter"
import type { TransportResponse } from "./response"

const document = { operationName: "Test", query: "query Test { x }" }

function respond(
  status: number,
  body: unknown,
  headers: Record<string, string> = {},
): TransportResponse {
  return { status, headers: new Headers(headers), body }
}

/** Runs tasks immediately and records what the client tells it. */
function fakeLimiter() {
  return {
    schedule: vi.fn((task: () => Promise<unknown>) => task()),
    observe: vi.fn(),
    onRateLimited: vi.fn(),
    snapshot: vi.fn(),
  }
}

function setup(
  responses: (TransportResponse | Error)[],
  options: Partial<AniListClientOptions> = {},
) {
  const requests: TransportRequest[] = []
  const transport = vi.fn(async (request: TransportRequest) => {
    requests.push(request)
    const next = responses.shift()
    if (!next) throw new Error("No more fake responses")
    if (next instanceof Error) throw next
    return next
  })
  const limiter = fakeLimiter()
  const sleep = vi.fn(async (_ms: number) => {})
  const client = createAniListClient({
    transport,
    limiter: limiter as unknown as RateLimiter,
    sleep,
    random: () => 1,
    ...options,
  })
  return { client, transport, limiter, sleep, requests }
}

describe("AniList client", () => {
  it("returns data and reports rate-limit headers to the limiter", async () => {
    const { client, limiter, requests } = setup([
      respond(
        200,
        { data: { x: 1 } },
        { "X-RateLimit-Limit": "30", "X-RateLimit-Remaining": "29" },
      ),
    ])

    await expect(client.request(document, { id: 1 })).resolves.toEqual({ x: 1 })
    expect(requests[0]).toMatchObject({
      operationName: "Test",
      variables: { id: 1 },
    })
    expect(limiter.observe).toHaveBeenCalledWith({ limit: 30, remaining: 29 })
  })

  it("treats GraphQL errors sent with HTTP 200 as failures, without retrying", async () => {
    const { client, transport } = setup([
      respond(200, {
        data: null,
        errors: [{ message: "Cannot query field", status: 400 }],
      }),
    ])

    await expect(client.request(document)).rejects.toMatchObject({
      kind: "graphql",
      status: 400,
    })
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it("marks AniList's 404 as not found", async () => {
    const { client } = setup([
      respond(404, {
        data: null,
        errors: [{ message: "Not Found.", status: 404 }],
      }),
    ])

    const error = await client
      .request(document)
      .catch((caught: unknown) => caught)
    expect(error).toBeInstanceOf(AniListError)
    expect((error as AniListError).notFound).toBe(true)
  })

  it("retries server errors with exponential back-off", async () => {
    const { client, sleep } = setup([
      respond(500, {}),
      respond(502, {}),
      respond(200, { data: { ok: true } }),
    ])

    await expect(client.request(document)).resolves.toEqual({ ok: true })
    // random() = 1, so the delays are the full back-off ceilings.
    expect(sleep.mock.calls.map(([ms]) => ms)).toEqual([500, 1000])
  })

  it("gives up after the maximum number of retries", async () => {
    const { client, transport } = setup(
      [respond(503, {}), respond(503, {}), respond(503, {}), respond(503, {})],
      { maxRetries: 3 },
    )

    await expect(client.request(document)).rejects.toMatchObject({
      kind: "server_error",
    })
    expect(transport).toHaveBeenCalledTimes(4)
  })

  it("retries network failures", async () => {
    const { client } = setup([
      new TypeError("fetch failed"),
      respond(200, { data: { ok: true } }),
    ])
    await expect(client.request(document)).resolves.toEqual({ ok: true })
  })

  it("pauses the limiter for Retry-After on a 429, then retries", async () => {
    const { client, limiter, sleep } = setup([
      respond(
        429,
        {
          data: null,
          errors: [{ message: "Too Many Requests.", status: 429 }],
        },
        { "Retry-After": "30" },
      ),
      respond(200, { data: { ok: true } }),
    ])

    await expect(client.request(document)).resolves.toEqual({ ok: true })
    expect(limiter.onRateLimited).toHaveBeenCalledWith(30_000)
    // The paused limiter does the waiting; no extra back-off sleep.
    expect(sleep).not.toHaveBeenCalled()
  })

  it("doesn't retry when its own queue gave up waiting", async () => {
    const { client, transport, limiter } = setup([])
    limiter.schedule.mockRejectedValueOnce(
      new AniListError("rate_limited", "Too many requests", {
        source: "queue",
        retryAfterMs: 50_000,
      }),
    )

    await expect(client.request(document)).rejects.toMatchObject({
      kind: "rate_limited",
      source: "queue",
    })
    expect(transport).not.toHaveBeenCalled()
    expect(limiter.onRateLimited).not.toHaveBeenCalled()
  })

  it("stops calling AniList for a while after it reports the API as disabled", async () => {
    let now = 0
    const disabled = respond(403, {
      data: null,
      errors: [
        {
          message: "The AniList API has been temporarily disabled",
          status: 403,
        },
      ],
    })
    const { client, transport } = setup(
      [disabled, respond(200, { data: { ok: true } })],
      {
        now: () => now,
        circuitBreakerMs: 60_000,
      },
    )

    await expect(client.request(document)).rejects.toMatchObject({
      kind: "api_disabled",
    })
    await expect(client.request(document)).rejects.toMatchObject({
      kind: "api_disabled",
      source: "queue",
    })
    expect(transport).toHaveBeenCalledTimes(1)

    now = 60_001
    await expect(client.request(document)).resolves.toEqual({ ok: true })
    expect(transport).toHaveBeenCalledTimes(2)
  })

  it("shares identical requests that are already in flight", async () => {
    let release: (response: TransportResponse) => void = () => {}
    const transport = vi.fn(
      () => new Promise<TransportResponse>((resolve) => (release = resolve)),
    )
    const client = createAniListClient({
      transport,
      limiter: fakeLimiter() as unknown as RateLimiter,
    })

    const first = client.request(document, { a: 1, b: 2 })
    const second = client.request(document, { b: 2, a: 1 })
    release(respond(200, { data: { shared: true } }))

    await expect(Promise.all([first, second])).resolves.toEqual([
      { shared: true },
      { shared: true },
    ])
    expect(transport).toHaveBeenCalledTimes(1)
  })

  it("sends a user's token and never shares their requests", async () => {
    const { client, transport, requests } = setup([
      respond(200, { data: { viewer: "a" } }),
      respond(200, { data: { viewer: "b" } }),
    ])
    const [a, b] = await Promise.all([
      client.request(document, {}, { token: "token-a" }),
      client.request(document, {}, { token: "token-b" }),
    ])
    expect([a, b]).toEqual([{ viewer: "a" }, { viewer: "b" }])
    expect(transport).toHaveBeenCalledTimes(2)
    expect(requests.map((request) => request.token)).toEqual([
      "token-a",
      "token-b",
    ])
  })

  it("doesn't share cancellable requests", async () => {
    const { client, transport } = setup([
      respond(200, { data: { n: 1 } }),
      respond(200, { data: { n: 2 } }),
    ])
    const controller = new AbortController()

    await Promise.all([
      client.request(document, {}, { signal: controller.signal }),
      client.request(document, {}, { signal: controller.signal }),
    ])
    expect(transport).toHaveBeenCalledTimes(2)
  })

  it("reports what happened through onEvent", async () => {
    const onEvent = vi.fn()
    const { client } = setup([respond(500, {}), respond(200, { data: {} })], {
      onEvent,
    })

    await client.request(document)
    expect(onEvent.mock.calls.map(([event]) => event.type)).toEqual([
      "request",
      "error",
      "request",
      "success",
    ])
    expect(onEvent.mock.calls[1]?.[0]).toMatchObject({
      willRetry: true,
      attempt: 0,
    })
  })
})
