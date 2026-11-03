import { TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { ReloadButton } from "@/components/reload-button"

/** AniList couldn't be reached and nothing was cached for this anime. */
export function DetailError() {
  return (
    <EmptyState
      icon={TriangleAlertIcon}
      title="Couldn't load this anime"
      description="AniList may be busy right now. Try again in a minute."
      className="mt-10"
    >
      <ReloadButton />
    </EmptyState>
  )
}
