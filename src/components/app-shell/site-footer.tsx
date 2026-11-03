import Link from "next/link"

export function SiteFooter() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-4 pt-6 pb-28 text-xs text-muted-foreground sm:px-6 md:pb-8">
      <div className="flex flex-col gap-1 border-t pt-6 sm:flex-row sm:justify-between">
        <p>
          Anime data from{" "}
          <a
            href="https://anilist.co"
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            AniList
          </a>
          . AniRadar is not affiliated with AniList.
        </p>
        <p className="flex gap-3">
          <Link href="/about" className="underline-offset-4 hover:underline">
            About
          </Link>
          <Link href="/privacy" className="underline-offset-4 hover:underline">
            Privacy
          </Link>
          <span>AniRadar · personal project</span>
        </p>
      </div>
    </footer>
  )
}
