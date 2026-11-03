"use client"

import { BookOpenIcon, ExternalLinkIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import { CoverImage } from "@/components/anime/cover-image"
import { Button } from "@/components/ui/button"
import { formatLabel } from "@/domain/media"
import {
  RELATION_LABELS,
  formatStartDate,
  type RelatedEntry,
  type SeasonGroups,
  type SeasonNode,
} from "@/domain/seasons"
import { useDisplayTitle, usePreferences } from "@/hooks/use-preferences"
import { cn } from "@/lib/utils"

import { DetailSection } from "./section"

/** Side stories shown before "Show all". */
const SIDE_PREVIEW = 6

/** Seasons in order, then side stories and specials, then the source. */
export function SeasonsList({
  currentId,
  groups,
  incomplete,
}: {
  currentId: number
  groups: SeasonGroups
  incomplete: boolean
}) {
  const { showAdult } = usePreferences()
  const [showAllSide, setShowAllSide] = useState(false)
  const allowed = (node: SeasonNode) => showAdult || !node.isAdult
  const main = groups.main.filter(allowed)
  const side = groups.side.filter((entry) => allowed(entry.node))
  const visibleSide = showAllSide ? side : side.slice(0, SIDE_PREVIEW)

  return (
    <DetailSection id="seasons-title" title="Seasons & related">
      {main.length > 1 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Main story · {main.length} entries
          </h3>
          <ol className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
            {main.map((node, index) => (
              <li key={node.id} className="w-28 shrink-0 sm:w-32">
                <SeasonCard
                  node={node}
                  current={node.id === currentId}
                  label={`${index + 1}`}
                />
              </li>
            ))}
          </ol>
        </div>
      ) : null}

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

      {groups.source.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-muted-foreground">
            Source material
          </h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {groups.source.map((entry) => (
              <li key={entry.node.id}>
                <SourceRow entry={entry} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {incomplete ? (
        <p className="text-xs text-muted-foreground">
          This franchise is long; some entries may be missing.
        </p>
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
        <CoverImage cover={node.coverImage} alt="" sizes="128px" />
        <span className="absolute top-1.5 left-1.5 rounded-full bg-background/80 px-1.5 text-[11px] font-semibold backdrop-blur">
          {label}
        </span>
        {current ? (
          <span className="absolute inset-x-0 bottom-0 bg-(--cover)/90 py-0.5 text-center text-[11px] font-semibold text-background">
            You&apos;re here
          </span>
        ) : null}
      </div>
      <p className="mt-1.5 line-clamp-2 text-xs font-medium">{title}</p>
      <p className="text-[11px] text-muted-foreground">
        {[
          formatLabel(node.format),
          upcoming
            ? formatStartDate(node)
            : (node.startDate?.year ?? node.seasonYear),
        ]
          .filter(Boolean)
          .join(" · ")}
        {upcoming ? " · upcoming" : ""}
      </p>
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
