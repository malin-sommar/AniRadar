import { AniListError } from "./errors"

export type Priority = "interactive" | "prefetch" | "background"

/** Highest priority first. */
export const PRIORITIES: readonly Priority[] = [
  "interactive",
  "prefetch",
  "background",
]

export interface LimiterOptions {
  /** Starting refill rate. */
  requestsPerMinute: number
  /** Upper bound when AniList's headers report a higher limit. */
  maxRequestsPerMinute?: number
  /** Burst size: how many requests may go out back to back. */
  capacity?: number
  /** Requests allowed in flight at once (keeps AniList's burst limiter happy). */
  maxConcurrent?: number
  /** Longest a request may wait for a slot before it fails fast. */
  maxWaitMs?: Partial<Record<Priority, number>>
  /** Share of AniList's reported limit we use, leaving headroom. */
  headroom?: number
  now?: () => number
}

export interface LimiterSnapshot {
  requestsPerMinute: number
  tokens: number
  capacity: number
  inFlight: number
  queued: Record<Priority, number>
  pausedForMs: number
  reportedLimit: number | undefined
  reportedRemaining: number | undefined
}

const DEFAULT_MAX_WAIT: Record<Priority, number> = {
  interactive: 15_000,
  prefetch: 30_000,
  background: 5 * 60_000,
}
const MIN_RATE = 5
/** After a 429, don't speed up again for this long. */
const RAISE_COOLDOWN_MS = 10 * 60_000

interface Waiter {
  priority: Priority
  deadline: number
  start: () => void
  fail: (error: unknown) => void
}

/**
 * Token bucket with priority lanes. Everything that talks to AniList goes
 * through one of these, so a burst of requests queues up instead of
 * tripping the rate limit.
 */
export class RateLimiter {
  private readonly now: () => number
  private readonly capacity: number
  private readonly maxConcurrent: number
  private readonly maxRate: number
  private readonly headroom: number
  private readonly maxWait: Record<Priority, number>
  private rate: number
  private tokens: number
  private lastRefill: number
  private pausedUntil = 0
  private last429At = Number.NEGATIVE_INFINITY
  private inFlight = 0
  private reportedLimit: number | undefined
  private reportedRemaining: number | undefined
  private readonly queues: Record<Priority, Waiter[]> = {
    interactive: [],
    prefetch: [],
    background: [],
  }
  private timer: ReturnType<typeof setTimeout> | undefined
  private timerAt = Number.POSITIVE_INFINITY

  constructor(options: LimiterOptions) {
    this.now = options.now ?? Date.now
    this.capacity = options.capacity ?? 5
    this.maxConcurrent = options.maxConcurrent ?? 2
    this.maxRate = options.maxRequestsPerMinute ?? options.requestsPerMinute
    this.headroom = options.headroom ?? 0.85
    this.maxWait = { ...DEFAULT_MAX_WAIT, ...options.maxWaitMs }
    this.rate = Math.min(options.requestsPerMinute, this.maxRate)
    this.tokens = this.capacity
    this.lastRefill = this.now()
  }

  /** Runs `task` once a slot is free. Rejects early if the wait would be too long. */
  schedule<T>(
    task: () => Promise<T>,
    {
      priority = "interactive",
      signal,
    }: { priority?: Priority; signal?: AbortSignal } = {},
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      if (signal?.aborted) {
        reject(signal.reason)
        return
      }
      const onAbort = () => {
        this.remove(waiter)
        reject(signal?.reason)
      }
      const waiter: Waiter = {
        priority,
        deadline: this.now() + this.maxWait[priority],
        start: () => {
          signal?.removeEventListener("abort", onAbort)
          this.inFlight++
          let result: Promise<T>
          try {
            result = task()
          } catch (error) {
            result = Promise.reject(error)
          }
          result.then(resolve, reject).finally(() => {
            this.inFlight--
            this.pump()
          })
        },
        fail: (error) => {
          signal?.removeEventListener("abort", onAbort)
          reject(error)
        },
      }
      signal?.addEventListener("abort", onAbort, { once: true })
      this.queues[priority].push(waiter)
      this.pump()
    })
  }

  /** Feeds in `X-RateLimit-*` headers from a response. */
  observe({ limit, remaining }: { limit?: number; remaining?: number }) {
    const now = this.now()
    if (limit !== undefined && limit > 0) {
      this.reportedLimit = limit
      const target = Math.max(
        MIN_RATE,
        Math.min(this.maxRate, Math.floor(limit * this.headroom)),
      )
      // Slow down right away; speed up only if there's been no recent 429.
      if (target < this.rate || now - this.last429At > RAISE_COOLDOWN_MS) {
        this.rate = target
      }
    }
    if (remaining !== undefined) {
      this.reportedRemaining = remaining
      if (remaining <= 2) {
        this.refill(now)
        this.tokens = Math.min(this.tokens, 0)
      }
    }
  }

  /** AniList answered 429: everything waits until it says we may continue. */
  onRateLimited(retryAfterMs: number) {
    const now = this.now()
    this.last429At = now
    this.pausedUntil = Math.max(
      this.pausedUntil,
      now + Math.max(0, retryAfterMs),
    )
    this.rate = Math.max(MIN_RATE, Math.floor(this.rate / 2))
    this.refill(now)
    this.tokens = 0
    this.pump()
  }

  snapshot(): LimiterSnapshot {
    const now = this.now()
    this.refill(now)
    return {
      requestsPerMinute: this.rate,
      tokens: Math.floor(this.tokens * 10) / 10,
      capacity: this.capacity,
      inFlight: this.inFlight,
      queued: {
        interactive: this.queues.interactive.length,
        prefetch: this.queues.prefetch.length,
        background: this.queues.background.length,
      },
      pausedForMs: Math.max(0, this.pausedUntil - now),
      reportedLimit: this.reportedLimit,
      reportedRemaining: this.reportedRemaining,
    }
  }

  private refill(now: number) {
    const elapsed = now - this.lastRefill
    if (elapsed <= 0) return
    this.tokens = Math.min(
      this.capacity,
      this.tokens + (elapsed * this.rate) / 60_000,
    )
    this.lastRefill = now
  }

  private remove(waiter: Waiter) {
    const queue = this.queues[waiter.priority]
    const index = queue.indexOf(waiter)
    if (index !== -1) queue.splice(index, 1)
  }

  private hasWaiting(): boolean {
    return PRIORITIES.some((priority) => this.queues[priority].length > 0)
  }

  private takeNext(): Waiter | undefined {
    for (const priority of PRIORITIES) {
      const waiter = this.queues[priority].shift()
      if (waiter) return waiter
    }
    return undefined
  }

  private earliestDeadline(): number {
    let earliest = Number.POSITIVE_INFINITY
    for (const priority of PRIORITIES) {
      for (const waiter of this.queues[priority]) {
        earliest = Math.min(earliest, waiter.deadline)
      }
    }
    return earliest
  }

  /** Fails waiters that can't start before their deadline. */
  private expire(now: number) {
    const earliestStart = Math.max(now, this.pausedUntil)
    for (const priority of PRIORITIES) {
      const queue = this.queues[priority]
      for (let index = queue.length - 1; index >= 0; index--) {
        const waiter = queue[index]!
        if (waiter.deadline >= earliestStart) continue
        queue.splice(index, 1)
        waiter.fail(
          new AniListError(
            "rate_limited",
            "Too many AniList requests right now. Try again shortly.",
            {
              status: 429,
              retryAfterMs: Math.max(0, this.pausedUntil - now),
              source: "queue",
            },
          ),
        )
      }
    }
  }

  private pump() {
    const now = this.now()
    this.refill(now)
    this.expire(now)
    while (this.inFlight < this.maxConcurrent && this.hasWaiting()) {
      if (now < this.pausedUntil) {
        this.wakeAt(Math.min(this.pausedUntil, this.earliestDeadline()))
        return
      }
      if (this.tokens < 1) {
        const nextToken = now + ((1 - this.tokens) * 60_000) / this.rate
        this.wakeAt(Math.min(nextToken, this.earliestDeadline() + 1))
        return
      }
      this.tokens -= 1
      this.takeNext()?.start()
    }
  }

  private wakeAt(at: number) {
    if (this.timer !== undefined && at >= this.timerAt) return
    if (this.timer !== undefined) clearTimeout(this.timer)
    this.timerAt = at
    this.timer = setTimeout(
      () => {
        this.timer = undefined
        this.timerAt = Number.POSITIVE_INFINITY
        this.pump()
      },
      Math.max(0, at - this.now()),
    )
    // Don't keep a Node.js process alive just for this timer.
    const timer = this.timer as { unref?: () => void }
    timer.unref?.()
  }
}
