import { CalendarDaysIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"

export const metadata: Metadata = { title: "Schedule" }

export default function SchedulePage() {
  return (
    <EmptyState
      icon={CalendarDaysIcon}
      tag="Coming in Phase 6"
      title="Your airing schedule"
      description="A weekly calendar of new episodes and premieres for the shows on your list, plus every season at a glance."
      className="mt-10"
    />
  )
}
