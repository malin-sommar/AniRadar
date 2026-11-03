"use client"

import { BookOpenIcon, ExternalLinkIcon, StarIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { CoverImage } from "@/components/anime/cover-image"
import { Button } from "@/components/ui/button"
import { STATUS_LABELS, formatLabel } from "@/domain/media"
import {
  RELATION_LABELS,
  formatStartDate,
  seriesSummary,
  type RelatedEntry,
  type SeasonGroups,
  type SeasonNode,
} from "@/domain/seasons"
import { mainStoryLabel, yearsLabel } from "@/domain/series"
import { useDisplayTitle, usePreferences } from "@/hooks/use-preferences"
import { cn } from "@/lib/utils"

import { DetailSection } from "./section"

/** Side stories shown before "Show all". */
const SIDE_PREVIEW = 6

function useAllowed() {
  const { showAdult } = usePreferences()
  return (node: SeasonNode) => showAdult || !node.isAdult
}

/**
 * The series first (PLAN.md §10.0): every season of the main story in
 * order, each with its own numbers, and a summary of the whole series.
 * The season you're looking at is marked.
 */
export function SeriesOverview({
  currentId,
  main: allMain,
  incomplete,
}: {
  currentId: number
  main: SeasonGroups["main"]
  incomplete: boolean
}) {
  const allowed = useAllowed()
  const main = allMain.filter(allowed)
  const seriesTitle = useDisplayTitle(main[0]?.title)
  const summary = seriesSummary(main)
  const current = main.findIndex((node) => node.id === currentId)

  const facts = [
    mainStoryLabel(main.map((node) => node.format)),
    yearsLabel(summary.years),
    summary.episodes ? `${summary.episodes} episodes` : undefined,
  ].filter(Boolean)

  return (
    <DetailSection id="series-title" title="Seasons">
      <div className="space-y-1">
        <p className="text-sm">
          <span className="font-medium">{seriesTitle}</span>
          <span className="text-muted-foreground"> · {facts.join(" · ")}</span>
          {summary.averageScore ? (
            <span className="text-muted-foreground">
              {" · "}
              <StarIcon
                className="inline size-3.5 -translate-y-px fill-score text-score"
                aria-hidden="true"
              />{" "}
              {summary.averageScore}% average
            </span>
          ) : null}
        </p>
        {current >= 0 ? (
          <p className="text-xs text-muted-foreground">
            You&apos;re looking at entry {current + 1} of {main.length}.
          </p>
        ) : null}
      </div>
      <ol className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {main.map((node, index) => (
          <li key={node.id} className="w-32 shrink-0 sm:w-36">
            <SeasonCard
              node={node}
              current={node.id === currentId}
              label={`${index + 1}`}
            />
          </li>
        ))}
      </ol>
      {incomplete ? (
        <p className="text-xs text-muted-foreground">
          This franchise is long; some entries may be missing.
        </p>
      ) : null}
    </DetailSection>
  )
}

/**
 * Side stories, specials and spin-offs (separate series, still listed
 * here), then the source material.
 */
export function RelatedList({
  currentId,
  side: allSide,
  source,
}: {
  currentId: number
  side: SeasonGroups["side"]
  source: SeasonGroups["source"]
}) {
  const allowed = useAllowed()
  const [showAllSide, setShowAllSide] = useState(false)
  const side = allSide.filter((entry) => allowed(entry.node))
  const visibleSide = showAllSide ? side : side.slice(0, SIDE_PREVIEW)
  if (side.length === 0 && source.length === 0) return null

  return (
    <DetailSection id="related-title" title="Side stories & related">
      {side.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Side stories & specials
          </h3>
          <ul id="side-stories" className="grid gap-2 sm:grid-cols-2">
            {visibleSide.map((entry) => (
              <li key={entry.node.id}>
                <RelatedRow
                  entry={entry}
                  current={entry.node.id === currentId}
                />
              </li>
            ))}
          </ul>
          {side.length > SIDE_PREVIEW ? (
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full"
              aria-expanded={showAllSide}
              aria-controls="side-stories"
              onClick={() => setShowAllSide(!showAllSide)}
            >
              {showAllSide ? "Show fewer" : `Show all ${side.length}`}
            </Button>
          ) : null}
        </div>
      ) : null}

      {source.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Source material
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {source.map((entry) => (
              <li key={entry.node.id}>
                <SourceRow entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </DetailSection>
  )
}

function SeasonCard({
  node,
  current,
  label,
}: {
  node: SeasonNode
  current: boolean
  label: string
}) {
  const title = useDisplayTitle(node.title)
  const upcoming = node.status === "NOT_YET_RELEASED"
  const airing = node.status === "RELEASING"
  const details = [
    formatLabel(node.format),
    node.format === "MOVIE" || !node.episodes
      ? undefined
      : `${node.episodes} ${node.episodes === 1 ? "ep" : "eps"}`,
    upcoming
      ? formatStartDate(node)
      : (node.startDate?.year ?? node.seasonYear),
  ]
    .filter(Boolean)
    .join(" · ")

  return (
    <Link
      href={`/anime/${node.id}`}
      aria-current={current ? "page" : undefined}
      className="group block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/60"
    >
      <div
        className={cn(
          "relative overflow-hidden rounded-xl ring-1 ring-border transition",
          current ? "ring-2 ring-(--cover)" : "group-hover:ring-(--cover)/60",
        )}
      >
        <CoverImage cover={node.coverImage} alt="" sizes="144px" />
        <span className="absolute top-1.5 left-1.5 rounded-full bg-background/80 px-1.5 text-[11px] font-semibold backdrop-blur">
          {label}
        </span>
        {node.averageScore ? (
          <span className="absolute top-1.5 right-1.5 inline-flex items-center gap-0.5 rounded-full bg-background/80 px-1.5 text-[11px] font-semibold backdrop-blur">
            <StarIcon
              className="size-2.5 fill-score text-score"
              aria-hidden="true"
            />
            {node.averageScore}%<span className="sr-only"> average score</span>
          </span>
        ) : null}
        {current ? (
          <span className="absolute inset-x-0 bottom-0 bg-(--cover)/90 py-0.5 text-center text-[11px] font-semibold text-background">
            You&apos;re here
          </span>
        ) : (airing || upcoming) && node.status ? (
          <span className="absolute inset-x-0 bottom-0 bg-background/85 py-0.5 text-center text-[11px] font-semibold text-airing backdrop-blur">
            {STATUS_LABELS[node.status]}
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium">{title}</p>
      <p className="text-[11px] text-muted-foreground">{details}</p>
    </Link>
  )
}

function RelatedRow({
  entry,
  current,
}: {
  entry: RelatedEntry
  current: boolean
}) {
  const title = useDisplayTitle(entry.node.title)
  const kind = entry.relation
    ? RELATION_LABELS[entry.relation]
    : formatLabel(entry.node.format)
  return (
    <Link
      href={`/anime/${entry.node.id}`}
      aria-current={current ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-2xl border bg-card p-2 transition-colors hover:bg-accent",
        current && "border-(--cover)",
      )}
    >
      <CoverImage
        cover={entry.node.coverImage}
        alt=""
        sizes="40px"
        className="w-10 shrink-0 rounded-lg"
      />
      <span className="min-w-0">
        <span className="line-clamp-2 text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {[kind, formatLabel(entry.node.format), formatStartDate(entry.node)]
            .filter((part, index, all) => part && all.indexOf(part) === index)
            .join(" · ")}
        </span>
      </span>
    </Link>
  )
}

function SourceRow({ entry }: { entry: RelatedEntry }) {
  const title = useDisplayTitle(entry.node.title)
  const content = (
    <>
      <BookOpenIcon
        className="size-5 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
      <span className="min-w-0">
        <span className="line-clamp-1 text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">
          {[
            entry.relation ? RELATION_LABELS[entry.relation] : undefined,
            formatLabel(entry.node.format),
            "on AniList",
          ]
            .filter(Boolean)
            .join(" · ")}
        </span>
      </span>
      <ExternalLinkIcon
        className="ml-auto size-4 shrink-0 text-muted-foreground"
        aria-hidden="true"
      />
    </>
  )
  const classes =
    "flex items-center gap-3 rounded-2xl border bg-card p-3 transition-colors hover:bg-accent"
  return entry.node.siteUrl ? (
    <a
      href={entry.node.siteUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {content}
    </a>
  ) : (
    <div className={classes}>{content}</div>
  )
}
