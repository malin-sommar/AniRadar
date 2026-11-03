// @vitest-environment happy-dom
import { render, screen } from "@testing-library/react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import type { MediaCardFragment } from "@/lib/anilist/gql/graphql"

import { AnimeCard } from "./anime-card"

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string
    children: ReactNode
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const media: MediaCardFragment = {
  id: 21,
  title: { english: null, romaji: "ONE PIECE", native: "ONE PIECE" },
  coverImage: {
    medium:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/small/bx21-x.jpg",
    large:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/medium/bx21-x.jpg",
    extraLarge:
      "https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx21-x.jpg",
    color: "#e4a15d",
  },
  format: "TV",
  status: "RELEASING",
  episodes: null,
  season: "FALL",
  seasonYear: 1999,
  averageScore: 87,
  genres: ["Action", "Adventure"],
  isAdult: false,
  nextAiringEpisode: {
    airingAt: Math.floor(Date.now() / 1000) + 2 * 86400,
    episode: 1181,
  },
}

function renderCard(overrides: Partial<MediaCardFragment> = {}) {
  render(
    <ul>
      <AnimeCard media={{ ...media, ...overrides }} />
    </ul>,
  )
}

describe("AnimeCard", () => {
  it("links to the detail page with a fallback title", () => {
    renderCard()
    const link = screen.getByRole("link")
    expect(link).toHaveAttribute("href", "/anime/21")
    expect(
      screen.getByRole("heading", { name: "ONE PIECE" }),
    ).toBeInTheDocument()
    expect(screen.getByText("TV · 1999")).toBeInTheDocument()
  })

  it("shows the score and the next episode with a countdown", () => {
    renderCard()
    expect(screen.getByText(/87%/)).toBeInTheDocument()
    expect(screen.getByText(/Ep 1181/)).toBeInTheDocument()
    expect(screen.getByText(/in 2d|in 1d/)).toBeInTheDocument()
  })

  it("loads covers through the image proxy, sized by srcset", () => {
    const { container } = render(
      <ul>
        <AnimeCard media={media} />
      </ul>,
    )
    const image = container.querySelector("img")
    expect(image?.getAttribute("src")).toBe(
      "/img/anilist/file/anilistcdn/media/anime/cover/medium/bx21-x.jpg",
    )
    expect(image?.getAttribute("srcset")).toContain(
      "/img/anilist/file/anilistcdn/media/anime/cover/large/bx21-x.jpg 460w",
    )
  })

  it("shows the title in the chosen language", () => {
    localStorage.setItem(
      "aniradar-preferences",
      JSON.stringify({ titleLanguage: "native" }),
    )
    renderCard({
      title: {
        english: "Frieren",
        romaji: "Sousou no Frieren",
        native: "葬送のフリーレン",
      },
    })
    expect(
      screen.getByRole("heading", { name: "葬送のフリーレン" }),
    ).toBeInTheDocument()
    localStorage.removeItem("aniradar-preferences")
  })

  it("marks adult entries", () => {
    renderCard({ isAdult: true })
    expect(screen.getByText("18+")).toBeInTheDocument()
  })

  it("leaves out badges it has no data for", () => {
    renderCard({ averageScore: null, nextAiringEpisode: null })
    expect(screen.queryByText(/average score/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ep \d+/)).not.toBeInTheDocument()
  })
})
