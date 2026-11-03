"use client"

import { formatCountdown } from "@/domain/media"
import { useNow } from "@/hooks/use-now"
import { cn } from "@/lib/utils"

/** "Ep 7 · in 2d". The countdown appears after hydration. */
export function AiringBadge({
  episode,
  airingAt,
  className,
}: {
  episode: number
  airingAt: number
  className?: string
}) {
  const now = useNow()
  const countdown =
    now === null ? null : formatCountdown(airingAt - Math.floor(now / 1000))

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-background/80 px-2 py-0.5 text-[11px] font-semibold text-airing backdrop-blur",
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-airing" aria-hidden="true" />
      Ep {episode}
      {countdown ? (
        <span className="font-medium text-foreground/80">· {countdown}</span>
      ) : null}
    </span>
  )
}
