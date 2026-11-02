import { ListVideoIcon } from "lucide-react"
import type { Metadata } from "next"

import { EmptyState } from "@/components/empty-state"

export const metadata: Metadata = { title: "My List" }

export default function ListPage() {
  return (
    <EmptyState
      icon={ListVideoIcon}
      tag="Coming in Phase 4"
      title="Your list"
      description="Once you sign in and connect AniList, your list shows up here: Watching, Awaiting new episodes, Want to watch and more."
      className="mt-10"
    />
  )
}
