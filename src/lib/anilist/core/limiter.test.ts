import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RateLimiter, type LimiterOptions } from "./limiter"

beforeEach(() => {
  vi.useFakeTimers({ now: 0 })
})

afterEach(() => {
  vi.useRealTimers()
})

function makeLimiter(options: Partial<LimiterOptions> = {}) {
  return new RateLimiter({
    requestsPerMinute: 30,
    capacity: 2,
    maxConcurrent: 10,
    now: () => Date.now(),
    ...options,
  })
}

describe("RateLimiter", () => {
  it("lets a burst through, then spaces requests by the refill rate", async () => {
    const limiter = makeLimiter() // 30/min: one new slot every 2 s
    const started: number[] = []
    const task = async () => {
      started.push(Date.now())
      return "ok"
    }

    const results = Promise.all([1, 2, 3, 4].map(() => limiter.schedule(task)))
    expect(started).toEqual([0, 0])

    await vi.advanceTimersByTimeAsync(2000)
    expect(started).toEqual([0, 0, 2000])

    await vi.advanceTimersByTimeAsync(2000)
    expect(started).toEqual([0, 0, 2000, 4000])
    await expect(results).resolves.toEqual(["ok", "ok", "ok", "ok"])
  })

  it("serves interactive requests before background work", async () => {
    const limiter = makeLimiter({ capacity: 1, requestsPerMinute: 60 })
    const order: string[] = []
    await limiter.schedule(async () => order.push("first"))

    void limiter.schedule(async () => order.push("background"), {
      priority: "background",
    })
    void limiter.schedule(async () => order.push("interactive"))

    await vi.advanceTimersByTimeAsync(1000)
    expect(order).toEqual(["first", "interactive"])
    await vi.advanceTimersByTimeAsync(1000)
    expect(order).toEqual(["first", "interactive", "background"])
  })

  it("never runs more than maxConcurrent requests at once", async () => {
    const limiter = makeLimiter({ capacity: 10, maxConcurrent: 2 })
    let running = 0
    let peak = 0
    const task = async () => {
      running++
      peak = Math.max(peak, running)
      await new Promise((resolve) => setTimeout(resolve, 100))
      running--
    }

    const all = Promise.all(
      Array.from({ length: 6 }, () => limiter.schedule(task)),
    )
    await vi.advanceTimersByTimeAsync(1000)
    await all
    expect(peak).toBe(2)
  })

  it("pauses everything after a 429 and fails fast when the wait is too long", async () => {
    const limiter = makeLimiter({
      capacity: 5,
      maxWaitMs: { interactive: 15_000, background: 120_000 },
    })
    limiter.onRateLimited(60_000)

    // Can't start within 15 s, so it's rejected right away instead of hanging.
    await expect(limiter.schedule(async () => "never")).rejects.toMatchObject({
      kind: "rate_limited",
      source: "queue",
    })

    const started: number[] = []
    const background = limiter.schedule(
      async () => {
        started.push(Date.now())
        return "ok"
      },
      { priority: "background" },
    )
    await vi.advanceTimersByTimeAsync(59_000)
    expect(started).toEqual([])
    await vi.advanceTimersByTimeAsync(1_000)
    expect(started).toEqual([60_000])
    await expect(background).resolves.toBe("ok")
  })

  it("halves its rate after a 429", () => {
    const limiter = makeLimiter({ requestsPerMinute: 30 })
    limiter.onRateLimited(1000)
    expect(limiter.snapshot().requestsPerMinute).toBe(15)
  })

  it("adapts to AniList's reported limit, but only speeds up without recent 429s", () => {
    const limiter = makeLimiter({
      requestsPerMinute: 25,
      maxRequestsPerMinute: 76,
    })

    limiter.observe({ limit: 90, remaining: 80 })
    expect(limiter.snapshot().requestsPerMinute).toBe(76)

    limiter.observe({ limit: 30, remaining: 20 })
    expect(limiter.snapshot().requestsPerMinute).toBe(25)

    limiter.onRateLimited(1000)
    limiter.observe({ limit: 90 })
    expect(limiter.snapshot().requestsPerMinute).toBe(12)

    vi.advanceTimersByTime(10 * 60_000 + 1)
    limiter.observe({ limit: 90 })
    expect(limiter.snapshot().requestsPerMinute).toBe(76)
  })

  it("stops spending when AniList says only a couple of requests remain", () => {
    const limiter = makeLimiter({ capacity: 5 })
    limiter.observe({ remaining: 1 })
    expect(limiter.snapshot().tokens).toBe(0)
  })

  it("drops aborted requests from the queue", async () => {
    const limiter = makeLimiter({ capacity: 1, requestsPerMinute: 60 })
    await limiter.schedule(async () => "first")

    const controller = new AbortController()
    const pending = limiter.schedule(async () => "never", {
      signal: controller.signal,
    })
    expect(limiter.snapshot().queued.interactive).toBe(1)

    controller.abort()
    await expect(pending).rejects.toThrow()
    expect(limiter.snapshot().queued.interactive).toBe(0)
  })
})
