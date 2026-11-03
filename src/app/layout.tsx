import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import { BottomNav } from "@/components/app-shell/bottom-nav"
import { SiteFooter } from "@/components/app-shell/site-footer"
import { SiteHeader } from "@/components/app-shell/site-header"
import { DebugPanel } from "@/components/dev/debug-panel"
import { AppProviders } from "@/components/providers/app-providers"
import { Toaster } from "@/components/ui/sonner"
import { clientEnv } from "@/lib/env/client"
import { THEME_COLORS, themeInitScript } from "@/lib/theme"
import { cn } from "@/lib/utils"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  // Only the dev debug panel uses it; don't spend bandwidth preloading it.
  preload: false,
})

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_SITE_URL),
  applicationName: "AniRadar",
  title: { default: "AniRadar", template: "%s · AniRadar" },
  description:
    "Find anime, track what you watch with AniList, and never miss an episode.",
  appleWebApp: {
    capable: true,
    title: "AniRadar",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  themeColor: THEME_COLORS.dark,
  colorScheme: "dark light",
  viewportFit: "cover",
}

const showDebugPanel =
  process.env.NODE_ENV === "development" || clientEnv.NEXT_PUBLIC_DEBUG_PANEL

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      // Dark is the default; the inline script switches before first paint
      // if a different theme was saved.
      className={cn(geistSans.variable, geistMono.variable, "dark antialiased")}
      style={{ colorScheme: "dark" }}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-primary px-4 py-2 text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <AppProviders>
          <SiteHeader />
          <main
            id="main"
            className="mx-auto w-full max-w-7xl flex-1 px-4 pt-4 sm:px-6 sm:pt-6"
          >
            {children}
          </main>
          <SiteFooter />
          <BottomNav />
          <Toaster position="top-center" />
          {showDebugPanel ? <DebugPanel /> : null}
        </AppProviders>
      </body>
    </html>
  )
}
