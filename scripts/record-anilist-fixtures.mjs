// Records real AniList responses as test fixtures (tests/fixtures/anilist).
// Run with `pnpm fixtures:record [Name ...]` after changing an operation;
// names are fixture names (e.g. `BrowseAnime`, `AnimeDetail-21`) or
// franchise names (e.g. `attack-on-titan`). Requests are spaced out to
// respect AniList's rate limit.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { setTimeout as sleep } from "node:timers/promises"

const url = process.env.ANILIST_API_URL || "https://graphql.anilist.co"
const operationsDir = new URL("../src/lib/anilist/operations/", import.meta.url)
const fixturesDir = new URL("../tests/fixtures/anilist/", import.meta.url)
const SPACING_MS = 3000

/** Fixture name → operation, its .graphql file and the variables to record. */
const FIXTURES = {
  TrendingAnime: {
    operation: "TrendingAnime",
    file: "trending.graphql",
    variables: { page: 1, perPage: 25, isAdult: false },
  },
  // The e2e mock filters and pages through these 50 popular shows.
  BrowseAnime: {
    operation: "BrowseAnime",
    file: "browse.graphql",
    variables: {
      page: 1,
      perPage: 50,
      sort: ["POPULARITY_DESC"],
      isAdult: false,
    },
  },
  // A search where one series has many results, for the grouping tests.
  "BrowseAnime-search-attack-on-titan": {
    operation: "BrowseAnime",
    file: "browse.graphql",
    variables: {
      page: 1,
      perPage: 30,
      search: "attack on titan",
      sort: ["SEARCH_MATCH"],
      isAdult: false,
    },
  },
  GenresAndTags: {
    operation: "GenresAndTags",
    file: "taxonomy.graphql",
    variables: {},
  },
  // A finished show with a long franchise, and an airing one.
  "AnimeDetail-16498": {
    operation: "AnimeDetail",
    file: "detail.graphql",
    variables: { id: 16498 },
  },
  "AnimeDetail-21": {
    operation: "AnimeDetail",
    file: "detail.graphql",
    variables: { id: 21 },
  },
}

/**
 * Franchises whose whole prequel/sequel chain is recorded (one SeasonChain
 * request per step), for the season-ordering tests.
 */
const FRANCHISES = {
  "attack-on-titan": 16498,
  monogatari: 5081,
}
const MAX_FRANCHISE_REQUESTS = 15

const fragmentsSource = await readFile(
  new URL("fragments.graphql", operationsDir),
  "utf8",
)
/** Fragment name → its definition. */
const fragments = new Map(
  fragmentsSource
    .split(/(?=^fragment )/m)
    .map((block) => [/^fragment (\w+)/.exec(block)?.[1], block.trim()])
    .filter(([name]) => name),
)

/** The operation plus every fragment it uses (AniList rejects unused ones). */
function documentFor(operation) {
  const used = new Set()
  const visit = (text) => {
    for (const [, name] of text.matchAll(/\.\.\.(\w+)/g)) {
      if (used.has(name) || !fragments.has(name)) continue
      used.add(name)
      visit(fragments.get(name))
    }
  }
  visit(operation)
  return [operation, ...[...used].map((name) => fragments.get(name))].join(
    "\n\n",
  )
}

let requests = 0
async function request(file, variables, label) {
  if (requests++ > 0) await sleep(SPACING_MS)
  const operation = await readFile(new URL(file, operationsDir), "utf8")
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query: documentFor(operation), variables }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.data || body.errors?.length) {
    console.error(
      `${label}: HTTP ${response.status}`,
      JSON.stringify(body?.errors ?? body),
    )
    process.exit(1)
  }
  return body.data
}

async function save(name, value) {
  const target = new URL(`${name}.json`, fixturesDir)
  await mkdir(new URL(".", target), { recursive: true })
  await writeFile(target, JSON.stringify(value, null, 2) + "\n")
  console.log(`recorded ${name}`)
}

const CHAIN = new Set(["PREQUEL", "SEQUEL"])

/** Every entry in the chain, as SeasonChain returns them. */
async function recordFranchise(name, startId) {
  const items = new Map()
  let frontier = [startId]
  let count = 0
  while (frontier.length > 0) {
    if (count++ >= MAX_FRANCHISE_REQUESTS) {
      console.error(
        `${name}: chain longer than ${MAX_FRANCHISE_REQUESTS} steps`,
      )
      process.exit(1)
    }
    const data = await request(
      "seasons.graphql",
      { ids: frontier },
      `${name} ${frontier.join(",")}`,
    )
    for (const item of data.Page.media) items.set(item.id, item)
    const next = new Set()
    for (const id of frontier) {
      for (const edge of items.get(id)?.relations?.edges ?? []) {
        const node = edge?.node
        if (!CHAIN.has(edge?.relationType) || node?.type !== "ANIME") continue
        if (!items.has(node.id)) next.add(node.id)
      }
    }
    frontier = [...next]
  }
  await save(`franchises/${name}`, { startId, items: [...items.values()] })
}

const only = process.argv.slice(2)
const wanted = (name) => only.length === 0 || only.includes(name)

for (const [name, { operation, file, variables }] of Object.entries(FIXTURES)) {
  if (!wanted(name)) continue
  await save(name, { data: await request(file, variables, operation) })
}
for (const [name, startId] of Object.entries(FRANCHISES)) {
  if (wanted(name)) await recordFranchise(name, startId)
}
