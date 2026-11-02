"use client"

import { RefreshCwIcon } from "lucide-react"

import { Button } from "@/components/ui/button"

export function ReloadButton({ label = "Try again" }: { label?: string }) {
  return (
    <Button variant="secondary" onClick={() => window.location.reload()}>
      <RefreshCwIcon />
      {label}
    </Button>
  )
}
