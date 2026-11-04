"use client"

import { ChevronDownIcon, StarIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { CoverImage } from "@/components/anime/cover-image"
import { formatCountdown } from "@/domain/media"
import { progressLabel, type ListEntry, type SeriesRow } from "@/domain/my-list"
import { formatStartDate } from "@/domain/seasons"
import type { SmartStatus } from "@/domain/smart-status"
import { useNow } from "@/hooks/use-now"
import { useDisplayTitle } from "@/hooks/use-preferences"
import type { MediaListStatus } from "@/lib/anilist/gql/graphql"
import { cn } from "@/lib/utils"

const STATUS_LABELS: Record<SmartStatus["display"], string> = {
  watching: "Watching",
  awaiting: "Awaiting",
  planning: "Want to watch",
  completed: "Completed",
  paused: "Paused",
  dropped: "Dropped",
}

const ANILIST_STATUS_LABELS: Record<MediaListStatus, string> = {
  CURRENT: "Watching",
  REPEATING: "Rewatching",
  PLANNING: "Want to watch",
  COMPLETED: "Completed",
  PAUSED: "Paused",
  DROPPED: "Dropped",
}

/** "Ep 9 · in 2d", "Season 2 · Jan 2027", "Season 2 is out". */
function useReason(smart: SmartStatus): string | undefined {
  const now = useNow()
  const sequelTitle = useDisplayTitle(
    smart.reason && smart.reason.kind !== "episode"
      ? smart.reason.sequel.title
      : null,
  )
  const reason = smart.reason
  if (!reason) return undefined
  if (reason.kind === "episode") {
    return now === null
      ? `Ep ${reason.episode}`
      : `Ep ${reason.episode} · ${formatCountdown(reason.airingAt - Math.floor(now / 1000))}`
  }
  const when = formatStartDate({
    startDate: reason.sequel.startDate
      ? { ...reason.sequel.startDate, day: null }
      : null,
    seasonYear: null,
  })
  return reason.kind === "sequel"
    ? `${sequelTitle} · ${when}`
    : `${sequelTitle} is out`
}

/** One series on your list: where you are, and its seasons on request. */
export function SeriesRowCard({ row }: { row: SeriesRow }) {
  const [open, setOpen] = useState(false)
  const title = useDisplayTitle(row.first.media.title)
  const currentTitle = useDisplayTitle(row.current.media.title)
  const reason = useReason(row.smart)
  const progress = progressLabel(row.current)
  const status = row.smart.rewatching
    ? "Rewatching"
    : STATUS_LABELS[row.smart.display]
  const many = row.members.length > 1
  const panelId = `seasons-${row.id}`

  return (
    <li className="rounded-2xl border bg-card">
      <div className="flex gap-3 p-2.5">
        <Link
          href={`/anime/${row.current.mediaId}`}
          className="flex min-w-0 flex-1 gap-3 rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
        >
          <CoverImage
            cover={row.current.media.coverImage}
            alt=""
            sizes="56px"
            className="w-14 shrink-0 rounded-lg"
          />
          <span className="min-w-0 space-y-0.5 py-0.5">
            <span className="line-clamp-2 font-medium">{title}</span>
            {many && currentTitle !== title ? (
              <span className="line-clamp-1 block text-xs text-muted-foreground">
                {currentTitle}
              </span>
            ) : null}
            <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-semibold",
                  row.smart.display === "awaiting"
                    ? "bg-airing/15 text-airing"
                    : "bg-muted text-foreground",
                )}
              >
                {status}
              </span>
              {progress ? (
                <span className="text-muted-foreground">{progress}</span>
              ) : null}
              {reason ? (
                <span className="text-muted-foreground">{reason}</span>
              ) : null}
            </span>
          </span>
        </Link>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          {row.score !== null ? (
            <span className="inline-flex items-center gap-1 text-sm font-semibold">
              <StarIcon
                className="size-3.5 fill-score text-score"
                aria-hidden="true"
              />
              {row.score}
              <span className="sr-only"> your score</span>
            </span>
          ) : (
            <span />
          )}
          {many ? (
            <button
              type="button"
              aria-expanded={open}
              aria-controls={panelId}
              onClick={() => setOpen(!open)}
              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
            >
              {row.members.length} on list
              <ChevronDownIcon
                className={cn(
                  "size-3.5 transition-transform",
                  open && "rotate-180",
                )}
                aria-hidden="true"
              />
            </button>
          ) : null}
        </div>
      </div>
      {many && open ? (
        <ul id={panelId} className="space-y-1 border-t px-2.5 py-2">
          {row.members.map((entry) => (
            <MemberRow key={entry.entryId} entry={entry} />
          ))}
        </ul>
      ) : null}
    </li>
  )
}

function MemberRow({ entry }: { entry: ListEntry }) {
  const title = useDisplayTitle(entry.media.title)
  const progress = progressLabel(entry)
  return (
    <li>
      <Link
        href={`/anime/${entry.mediaId}`}
        className="flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-accent"
      >
        <span className="min-w-0 truncate">{title}</span>
        <span className="shrink-0 text-xs text-muted-foreground">
          {[
            ANILIST_STATUS_LABELS[entry.status],
            progress,
            entry.score ? `★ ${entry.score}` : undefined,
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </Link>
    </li>
  )
}
