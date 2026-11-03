"use client"

import { ShieldAlertIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { usePreferences } from "@/hooks/use-preferences"

/**
 * Adult entries only show once adult content is switched on in settings
 * (after the 18+ confirmation). Until settings load, they stay hidden.
 */
export function AdultGate({
  isAdult,
  children,
}: {
  isAdult: boolean
  children: ReactNode
}) {
  const { showAdult } = usePreferences()
  if (!isAdult || showAdult) return children

  return (
    <EmptyState
      icon={ShieldAlertIcon}
      title="Adult content"
      description="This anime is marked 18+. To see it, switch on adult content in your settings."
      className="mt-10"
    >
      <Button asChild variant="secondary">
        <Link href="/me">Open settings</Link>
      </Button>
    </EmptyState>
  )
}
