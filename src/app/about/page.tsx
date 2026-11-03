import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "About",
  description: "Where AniRadar's data comes from, and credits.",
}

const SOURCES = [
  {
    name: "AniList",
    href: "https://anilist.co",
    use: "All anime information, images and your list (through your own account).",
  },
  {
    name: "Kitsu",
    href: "https://kitsu.app",
    use: "Finding shows from part of a title in search.",
  },
  {
    name: "MyAnimeList, via Jikan",
    href: "https://jikan.moe",
    use: "The MyAnimeList score on detail pages.",
  },
]

/** Data sources, credits and disclaimers (PLAN.md §13). */
export default function AboutPage() {
  return (
    <article className="mx-auto max-w-prose space-y-6 py-4 text-[15px] leading-relaxed">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">About</h1>
        <p className="text-muted-foreground">
          AniRadar is a personal, non-commercial companion for AniList: find
          anime, follow the series you watch, and never miss an episode.
        </p>
      </header>

      <section aria-labelledby="sources-title" className="space-y-3">
        <h2 id="sources-title" className="text-lg font-semibold">
          Where the data comes from
        </h2>
        <ul className="space-y-3">
          {SOURCES.map((source) => (
            <li key={source.name} className="rounded-2xl border bg-card p-4">
              <a
                href={source.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline-offset-2 hover:underline"
              >
                {source.name}
              </a>
              <p className="text-sm text-muted-foreground">{source.use}</p>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted-foreground">
          AniRadar is not affiliated with AniList, Kitsu, MyAnimeList, Jikan,
          Anime News Network or TMDB. Titles and images belong to their
          respective owners. Streaming links come from AniList and may not be
          available in your region.
        </p>
      </section>

      <section aria-labelledby="privacy-title" className="space-y-2">
        <h2 id="privacy-title" className="text-lg font-semibold">
          Privacy
        </h2>
        <p>
          No ads, no analytics, no tracking. Read the{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>{" "}
          for what&apos;s stored and how to remove it.
        </p>
      </section>
    </article>
  )
}
