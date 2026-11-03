import { CircleUserRoundIcon } from "lucide-react"
import Link from "next/link"

import { Logo } from "@/components/brand/logo"
import { SearchOverlay } from "@/components/search/search-overlay"
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { Button } from "@/components/ui/button"

import { DesktopNav } from "./desktop-nav"

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" aria-label="AniRadar home" className="shrink-0">
          <Logo />
        </Link>

        <DesktopNav className="hidden md:flex" />

        <div className="ml-auto flex items-center gap-1">
          <SearchOverlay />
          <ThemeToggle className="hidden size-9 md:inline-flex" />
          <Button
            asChild
            variant="ghost"
            size="icon-lg"
            className="hidden rounded-full md:inline-flex"
          >
            <Link href="/me" aria-label="Me">
              <CircleUserRoundIcon className="size-5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  )
}
