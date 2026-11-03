// Stand-in for AniList (and Kitsu) in end-to-end tests: answers each
// GraphQL operation with its recorded fixture from
// tests/fixtures/anilist/<Operation>.json. BrowseAnime and SearchAnime are
// filtered and paged from the browse fixture (50 popular shows), so tests can
// check filters, search and infinite scroll. Like the real services, AniList's
// search here matches whole words only and Kitsu's (/kitsu/anime) matches
// partial words. AnimeDetail serves a recorded fixture where there is one
// (airing times moved to just ahead of now) and otherwise builds a bare
// page from the browse fixture; SeasonChain serves the recorded
// franchises; Jikan (/jikan/anime/:id) serves tests/fixtures/jikan.
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"

const port = Number(process.env.MOCK_ANILIST_PORT ?? 4010)
const fixtures = new URL("../fixtures/anilist/", import.meta.url)

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json", ...headers })
  response.end(typeof body === "string" ? body : JSON.stringify(body))
}

function words(text) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)
}

function titlesOf(media) {
  return Object.values(media.title ?? {}).filter(Boolean)
}

function matches(media, variables) {
  const { search, genres, season, seasonYear, formats, statuses, isAdult } =
    variables
  if (search) {
    const wanted = words(search)
    const found = titlesOf(media).some((title) => {
      const titleWords = words(title)
      return wanted.every((word) => titleWords.includes(word))
    })
    if (!found) return false
  }
  if (genres?.some((genre) => !media.genres?.includes(genre))) return false
  if (season && media.season !== season) return false
  if (seasonYear && media.seasonYear !== seasonYear) return false
  if (formats && !formats.includes(media.format)) return false
  if (statuses && !statuses.includes(media.status)) return false
  if (isAdult === false && media.isAdult) return false
  // Tags aren't in the fixture, so a tag filter is ignored.
  return true
}

function browse(all, variables) {
  const page = variables.page ?? 1
  const perPage = variables.perPage ?? 30
  const found = all.filter((media) => matches(media, variables))
  const start = (page - 1) * perPage
  return {
    data: {
      Page: {
        pageInfo: {
          hasNextPage: start + perPage < found.length,
          currentPage: page,
        },
        media: found.slice(start, start + perPage),
      },
    },
  }
}

function search(all, variables) {
  const { ids, search: _search, ...filters } = variables
  return {
    data: {
      matches: {
        media: all.filter(
          (media) => ids.includes(media.id) && matches(media, filters),
        ),
      },
      Page: browse(all, variables).data.Page,
    },
  }
}

/** Kitsu's anime search: partial matches, mapped to AniList IDs. */
function kitsu(all, url) {
  const text = (url.searchParams.get("filter[text]") ?? "").toLowerCase()
  const limit = Number(url.searchParams.get("page[limit]") ?? 10)
  const found = all
    .filter((media) =>
      titlesOf(media).some((title) => title.toLowerCase().includes(text)),
    )
    .slice(0, limit)
  return {
    data: found.map((media) => ({
      id: `k${media.id}`,
      type: "anime",
      relationships: {
        mappings: { data: [{ type: "mappings", id: `m${media.id}` }] },
      },
    })),
    included: found.map((media) => ({
      id: `m${media.id}`,
      type: "mappings",
      attributes: {
        externalSite: "anilist/anime",
        externalId: String(media.id),
      },
    })),
  }
}

async function browseFixture() {
  const raw = await readFile(new URL("BrowseAnime.json", fixtures), "utf8")
  return JSON.parse(raw).data.Page.media
}

async function readJson(url) {
  try {
    return JSON.parse(await readFile(url, "utf8"))
  } catch {
    return undefined
  }
}

const NOT_FOUND = {
  status: 404,
  body: {
    data: { Media: null },
    errors: [{ message: "Not Found.", status: 404 }],
  },
}

/** Moves a recorded schedule so the next episode airs 90 minutes from now. */
function shiftAiring(media) {
  const schedule = media.airingSchedule?.nodes ?? []
  const first = schedule[0]?.airingAt ?? media.nextAiringEpisode?.airingAt
  if (!first) return media
  const shift = Math.floor(Date.now() / 1000) + 90 * 60 - first
  return {
    ...media,
    nextAiringEpisode: media.nextAiringEpisode && {
      ...media.nextAiringEpisode,
      airingAt: media.nextAiringEpisode.airingAt + shift,
    },
    airingSchedule: {
      nodes: schedule.map((node) => ({
        ...node,
        airingAt: node.airingAt + shift,
      })),
    },
  }
}

/** A detail page with only card data: no banner, MAL entry or extras. */
function bareDetail(card) {
  return {
    ...card,
    type: "ANIME",
    idMal: null,
    siteUrl: `https://anilist.co/anime/${card.id}`,
    bannerImage: null,
    description: "<p>A show from the browse fixture.</p>",
    duration: 24,
    source: "ORIGINAL",
    countryOfOrigin: "JP",
    popularity: null,
    favourites: null,
    startDate: { year: card.seasonYear, month: null, day: null },
    endDate: null,
    studios: { nodes: [] },
    tags: [],
    trailer: null,
    externalLinks: [],
    airingSchedule: { nodes: [] },
    relations: { edges: [] },
    characters: { pageInfo: { hasNextPage: false }, edges: [] },
    recommendations: { nodes: [] },
  }
}

async function detailMedia(id) {
  const recorded = await readJson(new URL(`AnimeDetail-${id}.json`, fixtures))
  if (recorded) return shiftAiring(recorded.data.Media)
  const card = (await browseFixture()).find((media) => media.id === id)
  return card ? bareDetail(card) : undefined
}

async function animeDetail({ id }) {
  const media = await detailMedia(id)
  return media ? { status: 200, body: { data: { Media: media } } } : NOT_FOUND
}

async function animeCharacters({ id, page = 1 }) {
  const media = await detailMedia(id)
  if (!media) return NOT_FOUND
  const edges = page === 1 ? media.characters.edges : []
  return {
    status: 200,
    body: {
      data: {
        Media: {
          id,
          characters: {
            pageInfo: { hasNextPage: false, currentPage: page },
            edges,
          },
        },
      },
    },
  }
}

async function seasonChain({ ids }) {
  const items = new Map()
  for (const name of ["attack-on-titan", "monogatari"]) {
    const franchise = await readJson(
      new URL(`franchises/${name}.json`, fixtures),
    )
    for (const item of franchise?.items ?? []) items.set(item.id, item)
  }
  return {
    status: 200,
    body: {
      data: { Page: { media: ids.flatMap((id) => items.get(id) ?? []) } },
    },
  }
}

const jikanFixtures = new URL("../fixtures/jikan/", import.meta.url)

async function jikanAnime(pathname) {
  const id = Number(pathname.split("/").at(-1))
  const fixture = await readJson(new URL(`anime-${id}.json`, jikanFixtures))
  return fixture
    ? { status: 200, body: fixture }
    : { status: 404, body: { status: 404, message: "Resource does not exist" } }
}

const HANDLERS = {
  AnimeDetail: animeDetail,
  AnimeCharacters: animeCharacters,
  SeasonChain: seasonChain,
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", "http://localhost")
  if (request.method === "GET" && url.pathname === "/kitsu/anime") {
    send(response, 200, kitsu(await browseFixture(), url))
    return
  }
  if (request.method === "GET" && url.pathname.startsWith("/jikan/anime/")) {
    const { status, body } = await jikanAnime(url.pathname)
    send(response, status, body)
    return
  }
  if (request.method !== "POST") {
    response
      .writeHead(200, { "Content-Type": "text/plain" })
      .end("mock AniList is up")
    return
  }

  let raw = ""
  for await (const chunk of request) raw += chunk
  const { query = "", variables = {} } = JSON.parse(raw || "{}")
  const name = /^\s*(?:query|mutation)\s+(\w+)/m.exec(query)?.[1]
  const headers = {
    "X-RateLimit-Limit": "90",
    "X-RateLimit-Remaining": "89",
  }

  try {
    if (name === "BrowseAnime") {
      send(response, 200, browse(await browseFixture(), variables), headers)
    } else if (name === "SearchAnime") {
      send(response, 200, search(await browseFixture(), variables), headers)
    } else if (name in HANDLERS) {
      const { status, body } = await HANDLERS[name](variables)
      send(response, status, body, headers)
    } else {
      const fixture = await readFile(new URL(`${name}.json`, fixtures), "utf8")
      send(response, 200, fixture, headers)
    }
  } catch {
    send(response, 400, {
      data: null,
      errors: [
        {
          message: `No fixture for ${name ?? "unknown operation"}`,
          status: 400,
        },
      ],
    })
  }
})

server.listen(port, "127.0.0.1", () => {
  console.log(`Mock AniList listening on http://127.0.0.1:${port}`)
})
