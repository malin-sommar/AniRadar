export interface BackoffOptions {
  baseMs?: number
  maxMs?: number
}

/**
 * Exponential back-off with full jitter: a random delay between 0 and
 * min(maxMs, baseMs × 2^attempt). Attempt 0 is the first retry.
 */
export function backoffDelayMs(
  attempt: number,
  random: () => number = Math.random,
  { baseMs = 500, maxMs = 8000 }: BackoffOptions = {},
): number {
  const ceiling = Math.min(maxMs, baseMs * 2 ** Math.max(0, attempt))
  return Math.round(ceiling * random())
}

export function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason)
      return
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal?.reason)
    }
    signal?.addEventListener("abort", onAbort, { once: true })
  })
}
