import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

/** A titled section of the detail page. */
export function DetailSection({
  id,
  title,
  action,
  children,
  className,
}: {
  id: string
  title: string
  /** Shown on the heading's right, e.g. "Show all". */
  action?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section aria-labelledby={id} className={cn("space-y-4", className)}>
      <div className="flex items-end justify-between gap-4">
        <h2 id={id} className="text-xl font-semibold tracking-tight">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  )
}
