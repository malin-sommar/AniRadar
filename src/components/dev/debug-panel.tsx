"use client"

import { useQueryClient } from "@tanstack/react-query"
import { BugIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { browserStats, getBrowserAniListClient } from "@/lib/anilist/browser"
import type { LimiterSnapshot } from "@/lib/anilist/core/limiter"
import type { AniListStats } from "@/lib/anilist/core/stats"
import { cn } from "@/lib/utils"

interface ServerSnapshot {
  stats: AniListStats
  limiter: LimiterSnapshot
}

const REFRESH_MS = 2000

/**
 * Development-only window into the AniList layer: how many lookups were
 * answered from cache, what actually went over the network, and the rate
 * limiter's state on both sides.
 */
export function DebugPanel() {
  const [open, setOpen] = useState(false)
  const [server, setServer] = useState<ServerSnapshot | null>(null)
  const [, setTick] = useState(0)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!open) return
    let cancelled = false
    const load = async () => {
      try {
        const response = await fetch("/api/dev/anilist-stats", {
          cache: "no-store",
        })
        if (!cancelled && response.ok)
          setServer((await response.json()) as ServerSnapshot)
      } catch {
        // The panel is best-effort; ignore failed polls.
      }
      if (!cancelled) setTick((value) => value + 1)
    }
    void load()
    const interval = setInterval(load, REFRESH_MS)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [open])

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-3 bottom-20 z-50 flex size-10 items-center justify-center rounded-full border bg-popover/90 text-muted-foreground shadow-lg backdrop-blur hover:text-foreground md:bottom-4"
        aria-label="Open AniList debug panel"
      >
        <BugIcon className="size-5" />
      </button>
    )
  }

  const browser = {
    stats: browserStats,
    limiter: getBrowserAniListClient().limiter.snapshot(),
  }
  const cachedQueries = queryClient.getQueryCache().getAll().length

  return (
    <aside
      aria-label="AniList debug panel"
      className="fixed inset-x-3 bottom-20 z-50 max-h-[70dvh] overflow-y-auto rounded-2xl border bg-popover/95 p-4 text-xs shadow-2xl backdrop-blur md:inset-x-auto md:right-4 md:bottom-4 md:w-96"
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="font-semibold">AniList debug</p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Close debug panel"
        >
          <XIcon className="size-4" />
        </button>
      </div>

      <Block title="Server → AniList">
        {server ? (
          <>
            <Row label="Data lookups" value={server.stats.lookups} />
            <Row label="Sent to AniList" value={server.stats.sent} />
            <p className="text-[11px] text-muted-foreground">
              Pages served from Next&apos;s cache don&apos;t count as lookups at
              all.
            </p>
            <LimiterRows limiter={server.limiter} />
            <ErrorRows stats={server.stats} />
          </>
        ) : (
          <p className="text-muted-foreground">Loading…</p>
        )}
      </Block>

      <Block title="Browser → /api/anilist">
        <Row label="Lookups" value={browser.stats.lookups} />
        <Row label="Sent to proxy" value={browser.stats.sent} />
        <Row label="Queries in cache" value={cachedQueries} />
        <LimiterRows limiter={browser.limiter} />
        <ErrorRows stats={browser.stats} />
      </Block>

      <Block title="Recent server requests">
        {server && server.stats.recent.length > 0 ? (
          <ul className="space-y-1">
            {server.stats.recent.map((entry) => (
              <li
                key={`${entry.at}-${entry.operationName}`}
                className="flex justify-between gap-2"
              >
                <span className="truncate">{entry.operationName}</span>
                <span
                  className={cn(
                    entry.outcome === "ok"
                      ? "text-muted-foreground"
                      : "text-destructive",
                  )}
                >
                  {entry.outcome}
                  {entry.durationMs !== undefined
                    ? ` · ${entry.durationMs} ms`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground">
            None yet: everything came from cache.
          </p>
        )}
      </Block>
    </aside>
  )
}

function Block({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="mb-3 rounded-xl border p-3 last:mb-0">
      <h3 className="mb-2 font-medium">{title}</h3>
      <div className="space-y-1">{children}</div>
    </section>
  )
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  )
}

function LimiterRows({ limiter }: { limiter: LimiterSnapshot }) {
  const queued =
    limiter.queued.interactive +
    limiter.queued.prefetch +
    limiter.queued.background
  return (
    <>
      <Row label="Budget" value={`${limiter.requestsPerMinute}/min`} />
      <Row label="Tokens" value={`${limiter.tokens} / ${limiter.capacity}`} />
      <Row
        label="In flight · queued"
        value={`${limiter.inFlight} · ${queued}`}
      />
      {limiter.pausedForMs > 0 ? (
        <Row
          label="Paused (429)"
          value={`${Math.ceil(limiter.pausedForMs / 1000)} s`}
        />
      ) : null}
      {limiter.reportedLimit !== undefined ? (
        <Row
          label="AniList limit · remaining"
          value={`${limiter.reportedLimit} · ${limiter.reportedRemaining ?? "?"}`}
        />
      ) : null}
    </>
  )
}

function ErrorRows({ stats }: { stats: AniListStats }) {
  const entries = Object.entries(stats.errors)
  if (entries.length === 0) return <Row label="Errors" value={0} />
  return (
    <>
      {entries.map(([kind, count]) => (
        <Row key={kind} label={`Errors: ${kind}`} value={count} />
      ))}
      <Row label="Retries" value={stats.retries} />
    </>
  )
}
