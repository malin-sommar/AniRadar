import type { AniListClientEvent } from "./client"
import type { AniListErrorKind } from "./errors"

export interface RecentRequest {
  operationName: string
  at: number
  outcome: "ok" | AniListErrorKind
  status?: number
  durationMs?: number
}

/** Counters behind the dev debug panel. */
export interface AniListStats {
  /** Times the app asked for data (cache hits included). */
  lookups: number
  /** Requests that actually went out over the network. */
  sent: number
  deduped: number
  retries: number
  errors: Partial<Record<AniListErrorKind, number>>
  recent: RecentRequest[]
}

const RECENT_LIMIT = 20

export function createStats(): AniListStats {
  return { lookups: 0, sent: 0, deduped: 0, retries: 0, errors: {}, recent: [] }
}

function remember(stats: AniListStats, entry: RecentRequest) {
  stats.recent.unshift(entry)
  if (stats.recent.length > RECENT_LIMIT) stats.recent.length = RECENT_LIMIT
}

export function recordEvent(stats: AniListStats, event: AniListClientEvent) {
  switch (event.type) {
    case "request":
      stats.sent++
      break
    case "deduped":
      stats.deduped++
      break
    case "success":
      remember(stats, {
        operationName: event.operationName,
        at: event.at,
        outcome: "ok",
        status: event.status,
        durationMs: event.durationMs,
      })
      break
    case "error": {
      const { kind, status } = event.error
      stats.errors[kind] = (stats.errors[kind] ?? 0) + 1
      if (event.willRetry) stats.retries++
      remember(stats, {
        operationName: event.operationName,
        at: event.at,
        outcome: kind,
        status,
        durationMs: event.durationMs,
      })
      break
    }
  }
}
