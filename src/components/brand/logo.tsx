import { cn } from "@/lib/utils"

/** The radar mark. Colours come from `currentColor` and the airing token. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={cn("size-6 text-primary", className)}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".4"
        strokeWidth="1.5"
      />
      <circle
        cx="12"
        cy="12"
        r="5.5"
        fill="none"
        stroke="currentColor"
        strokeOpacity=".4"
        strokeWidth="1.5"
      />
      <path
        d="M12 12 L12 2 A10 10 0 0 1 21.51 8.91 Z"
        fill="currentColor"
        fillOpacity=".85"
      />
      <circle cx="7.6" cy="16.2" r="1.7" fill="var(--color-airing)" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function Logo({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-lg font-semibold tracking-tight",
        className,
      )}
    >
      <LogoMark />
      <span>
        Ani<span className="text-primary">Radar</span>
      </span>
    </span>
  )
}
