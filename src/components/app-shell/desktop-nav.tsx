"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Suspense } from "react"

import { cn } from "@/lib/utils"

import { NAV_ITEMS, isActive } from "./nav-items"

// "Me" lives in the header's right-hand corner on desktop.
const ITEMS = NAV_ITEMS.filter((item) => item.href !== "/me")

function DesktopNavLinks({
  pathname,
  className,
}: {
  pathname: string | null
  className?: string
}) {
  return (
    <nav aria-label="Main" className={cn("items-center gap-1", className)}>
      {ITEMS.map((item) => {
        const active = pathname !== null && isActive(pathname, item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              active && "bg-accent text-foreground",
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}

function ActiveDesktopNav({ className }: { className?: string }) {
  return <DesktopNavLinks pathname={usePathname()} className={className} />
}

/**
 * On routes with dynamic params the pathname is only known at request time,
 * so the prerendered shell shows the links without the active highlight.
 */
export function DesktopNav({ className }: { className?: string }) {
  return (
    <Suspense
      fallback={<DesktopNavLinks pathname={null} className={className} />}
    >
      <ActiveDesktopNav className={className} />
    </Suspense>
  )
}
