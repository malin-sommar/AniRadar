import { RadarIcon } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <EmptyState
      icon={RadarIcon}
      title="Nothing on the radar"
      description="We couldn't find that page."
      className="mt-10"
    >
      <Button asChild variant="secondary">
        <Link href="/">Back to Home</Link>
      </Button>
    </EmptyState>
  )
}
