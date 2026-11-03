/** One scheduled episode; `airingAt` is in seconds since the epoch. */
export interface ScheduledEpisode {
  episode: number
  airingAt: number
}

/** Episodes that haven't aired yet, soonest first. */
export function upcomingEpisodes(
  schedule: ReadonlyArray<ScheduledEpisode | null> | null | undefined,
  nowSeconds: number,
): ScheduledEpisode[] {
  return (schedule ?? [])
    .filter((item): item is ScheduledEpisode => item !== null)
    .filter((item) => item.airingAt > nowSeconds)
    .sort((a, b) => a.airingAt - b.airingAt)
}

const pad = (value: number) => String(value).padStart(2, "0")

/**
 * "2d 4h", "4h 12m", or "12:05" (minutes and seconds) during the last hour,
 * which ticks every second.
 */
export function formatLiveCountdown(secondsUntil: number): string {
  if (secondsUntil <= 0) return "now"
  const days = Math.floor(secondsUntil / 86_400)
  const hours = Math.floor((secondsUntil % 86_400) / 3600)
  const minutes = Math.floor((secondsUntil % 3600) / 60)
  const seconds = Math.floor(secondsUntil % 60)
  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${pad(minutes)}:${pad(seconds)}`
}

/** How often a countdown needs to redraw: every second in the last hour. */
export function countdownTickMs(secondsUntil: number): number {
  return secondsUntil <= 3600 ? 1000 : 30_000
}
