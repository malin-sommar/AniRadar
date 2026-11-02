import { WifiOffIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"
import { ReloadButton } from "@/components/reload-button"

export const metadata: Metadata = { title: "Offline" }

// The service worker serves this page when a navigation fails offline.
export default function OfflinePage() {
  return (
    <EmptyState
      icon={WifiOffIcon}
      title="You're offline"
      description="This page isn't saved on your device yet. Reconnect and try again. Saved lists come in a later phase."
      className="mt-10"
    >
      <ReloadButton />
    </EmptyState>
  )
}
