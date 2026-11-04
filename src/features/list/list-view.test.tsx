// @vitest-environment happy-dom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { NuqsTestingAdapter } from "nuqs/adapters/testing"
import type { ReactNode } from "react"
import { afterEach, describe, expect, it, vi } from "vitest"

import type { ListEntry } from "@/domain/my-list"

import { ListView } from "./list-view"
import type { MyListResponse } from "./types"

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

const NOW = Date.now()

function entry(
  id: number,
  changes: Partial<ListEntry> & { title: string; year?: number },
): ListEntry {
  const { title, year = 2020, ...rest } = changes
  return {
    entryId: id * 10,
    mediaId: id,
    seriesId: id,
    status: "COMPLETED",
    progress: 12,
    score: null,
    repeat: 0,
    updatedAt: 100,
    sequels: [],
    services: [],
    ...rest,
    media: {
      id,
      title: { english: title, romaji: null, native: null },
      coverImage: null,
      format: "TV",
      status: "FINISHED",
      episodes: 12,
      season: null,
      seasonYear: year,
      averageScore: null,
      genres: [],
      isAdult: false,
      nextAiringEpisode: null,
      startDate: { year, month: 1, day: 1 },
      ...rest.media,
    },
  }
}

const LIST: MyListResponse = {
  status: "ok",
  fetchedAt: NOW,
  myServices: ["Netflix"],
  entries: [
    entry(1, {
      title: "Attack on Titan",
      year: 2013,
      seriesId: 1,
      score: 9,
      services: ["Crunchyroll"],
    }),
    entry(2, {
      title: "Attack on Titan Season 2",
      seriesId: 1,
      year: 2017,
      status: "CURRENT",
      progress: 4,
      updatedAt: 500,
    }),
    entry(3, {
      title: "Frieren",
      services: ["Netflix", "Crunchyroll"],
      sequels: [
        {
          id: 30,
          format: "TV",
          status: "NOT_YET_RELEASED",
          startDate: { year: 2027, month: 1 },
          title: { english: "Frieren Season 3", romaji: null, native: null },
        },
      ],
    }),
    entry(4, { title: "Bocchi the Rock!", status: "PLANNING", progress: 0 }),
  ],
}

function renderList(response: MyListResponse, status = 200) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json(response, { status })),
  )
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <NuqsTestingAdapter>
      <QueryClientProvider client={client}>
        <ListView />
      </QueryClientProvider>
    </NuqsTestingAdapter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("ListView", () => {
  it("asks you to sign in when you aren't", async () => {
    renderList({ status: "signed-out" }, 401)
    expect(
      await screen.findByText("Sign in to see your list"),
    ).toBeInTheDocument()
  })

  it("asks you to connect AniList, or to reconnect", async () => {
    renderList({ status: "expired" })
    expect(
      await screen.findByRole("link", { name: "Reconnect AniList" }),
    ).toHaveAttribute("href", "/auth/anilist/start")
  })

  it("shows one row per series with its current season", async () => {
    renderList(LIST)
    const rows = await screen.findAllByRole("listitem")
    expect(rows).toHaveLength(3)
    const titan = rows.find((row) =>
      row.textContent?.includes("Attack on Titan"),
    )!
    // Season 2 is the one you're watching.
    expect(within(titan).getByText("Watching")).toBeInTheDocument()
    expect(within(titan).getByText("Ep 4 / 12")).toBeInTheDocument()
    expect(
      within(titan).getByRole("button", { name: /2 on list/ }),
    ).toBeInTheDocument()
  })

  it("says Awaiting with the announced season", async () => {
    renderList(LIST)
    const frieren = (await screen.findAllByRole("listitem")).find((row) =>
      row.textContent?.includes("Frieren"),
    )!
    expect(within(frieren).getByText("Awaiting")).toBeInTheDocument()
    expect(
      within(frieren).getByText("Frieren Season 3 · Jan 2027"),
    ).toBeInTheDocument()
  })

  it("filters by tab, search and service", async () => {
    const user = userEvent.setup()
    renderList(LIST)
    await screen.findAllByRole("listitem")

    await user.click(screen.getByRole("button", { name: /Want to watch/ }))
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    await user.click(screen.getByRole("button", { name: /^All/ }))

    await user.type(
      screen.getByRole("searchbox", { name: "Search your list" }),
      "titan",
    )
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    await user.clear(
      screen.getByRole("searchbox", { name: "Search your list" }),
    )

    await user.click(screen.getByRole("button", { name: "On my services" }))
    expect(screen.getAllByRole("listitem")).toHaveLength(1)
    expect(screen.getByText("Frieren")).toBeInTheDocument()
  })
})
