"use client"

import { CalendarClockIcon } from "lucide-react"

import { Skeleton } from "@/components/ui/skeleton"
import {
  formatLiveCountdown,
  upcomingEpisodes,
  type ScheduledEpisode,
} from "@/domain/airing"
import { useNow } from "@/hooks/use-now"
import type { MediaStatus } from "@/lib/anilist/gql/graphql"

import { DetailSection } from "./section"

/** "Tue 4 Nov, 17:30" in the viewer's own time zone. */
const airTime = new Intl.DateTimeFormat(undefined, {
  weekday: "short",
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
})

/**
 * Countdown to the next episode and the ones after it, in your time zone.
 * Times appear after hydration (the server doesn't know your zone). When an
 * episode airs, the countdown moves on to the next one by itself.
 */
export function AiringPanel({
  status,
  schedule,
  totalEpisodes,
}: {
  status: MediaStatus | null
  schedule: ScheduledEpisode[]
  totalEpisodes: number | null
}) {
  const minuteNow = useNow()
  const nextAt =
    minuteNow === null
      ? undefined
      : upcomingEpisodes(schedule, minuteNow / 1000)[0]?.airingAt
  // Tick every second only during the last hour before an episode.
  const fast =
    minuteNow !== null &&
    nextAt !== undefined &&
    nextAt - minuteNow / 1000 <= 3600
  const secondNow = useNow(fast ? "second" : "half-minute")
  const now = fast ? secondNow : minuteNow

  return (
    <DetailSection id="airing-title" title="Airing">
      <div className="rounded-3xl border bg-card p-5">
        {now === null ? (
          <AiringSkeleton rows={Math.max(0, schedule.length - 1)} />
        ) : (
          <AiringContent
            status={status}
            upcoming={upcomingEpisodes(schedule, now / 1000)}
            nowSeconds={now / 1000}
            totalEpisodes={totalEpisodes}
          />
        )}
      </div>
    </DetailSection>
  )
}

function AiringContent({
  status,
  upcoming,
  nowSeconds,
  totalEpisodes,
}: {
  status: MediaStatus | null
  upcoming: ScheduledEpisode[]
  nowSeconds: number
  totalEpisodes: number | null
}) {
  const [next, ...later] = upcoming
  if (!next) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <CalendarClockIcon className="size-4" aria-hidden="true" />
        {status === "RELEASING"
          ? "The next episode's date hasn't been announced yet."
          : "No air dates announced yet."}
      </p>
    )
  }

  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">
            Episode {next.episode}
            {totalEpisodes ? ` of ${totalEpisodes}` : ""}
          </p>
          <p className="text-3xl font-semibold tracking-tight text-airing tabular-nums">
            in {formatLiveCountdown(next.airingAt - nowSeconds)}
          </p>
        </div>
        <time
          dateTime={new Date(next.airingAt * 1000).toISOString()}
          className="text-sm text-muted-foreground"
        >
          {airTime.format(next.airingAt * 1000)}
        </time>
      </div>

      {later.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium">Coming up</h3>
          <ul className="divide-y rounded-2xl border">
            {later.map((episode) => (
              <li
                key={episode.episode}
                className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm"
              >
                <span>Episode {episode.episode}</span>
                <time
                  dateTime={new Date(episode.airingAt * 1000).toISOString()}
                  className="text-muted-foreground tabular-nums"
                >
                  {airTime.format(episode.airingAt * 1000)}
                </time>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Times in your time zone ({timeZone}).
          </p>
        </div>
      ) : null}
    </div>
  )
}

/** Roughly the content's height, so little moves when the times appear. */
function AiringSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-5" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-40" />
      </div>
      {rows > 0 ? (
        <div className="space-y-2">
          <Skeleton className="h-5 w-24" />
          <Skeleton
            className="rounded-2xl"
            style={{ height: `${rows * 2.6}rem` }}
          />
          <Skeleton className="h-4 w-48" />
        </div>
      ) : null}
    </div>
  )
}
