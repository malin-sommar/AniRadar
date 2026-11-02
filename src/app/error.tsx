"use client"

import { TriangleAlertIcon } from "lucide-react"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <EmptyState
      icon={TriangleAlertIcon}
      title="Something went wrong"
      description="This page hit an unexpected error. Trying again usually helps."
      className="mt-10"
    >
      <Button variant="secondary" onClick={reset}>
        Try again
      </Button>
    </EmptyState>
  )
}
