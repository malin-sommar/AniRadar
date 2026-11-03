import { StarIcon } from "lucide-react"
import type { ReactNode } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

/** "★ 86%" (AniList) or "MAL 8.55" in the detail hero. */
export function ScoreChip({
  label,
  value,
  description,
  href,
  className,
}: {
  label: ReactNode
  value: string
  /** Read out instead of the short label, e.g. "AniList average score". */
  description: string
  href?: string
  className?: string
}) {
  const classes = cn(
    "inline-flex h-8 items-center gap-1.5 rounded-full bg-background/70 px-3 text-sm font-semibold ring-1 ring-border backdrop-blur",
    href && "transition-colors hover:bg-background",
    className,
  )
  const content = (
    <>
      <span aria-hidden="true" className="text-muted-foreground">
        {label}
      </span>
      {value}
      <span className="sr-only"> {description}</span>
    </>
  )
  return href ? (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={classes}
    >
      {content}
    </a>
  ) : (
    <span className={classes}>{content}</span>
  )
}

export function AniListScoreChip({ score }: { score: number }) {
  return (
    <ScoreChip
      label={<StarIcon className="size-4 fill-score text-score" />}
      value={`${score}%`}
      description="AniList average score"
    />
  )
}

/** Same size as a chip, so the MAL score streams in without a jump. */
export function ScoreChipSkeleton() {
  return <Skeleton className="h-8 w-24 rounded-full" />
}
