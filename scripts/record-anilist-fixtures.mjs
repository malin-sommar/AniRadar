// Records real AniList responses as test fixtures (tests/fixtures/anilist).
// Run with `pnpm fixtures:record [Operation ...]` after changing an operation.
// It sends one request per operation, spaced out to respect AniList's rate
// limit.
import { mkdir, readFile, writeFile } from "node:fs/promises"
import { setTimeout as sleep } from "node:timers/promises"

const url = process.env.ANILIST_API_URL || "https://graphql.anilist.co"
const operationsDir = new URL("../src/lib/anilist/operations/", import.meta.url)
const fixturesDir = new URL("../tests/fixtures/anilist/", import.meta.url)

/** Operation name → its .graphql file and the variables the app uses. */
const OPERATIONS = {
  TrendingAnime: {
    file: "trending.graphql",
    variables: { page: 1, perPage: 25, isAdult: false },
  },
  // The e2e mock filters and pages through these 50 popular shows.
  BrowseAnime: {
    file: "browse.graphql",
    variables: {
      page: 1,
      perPage: 50,
      sort: ["POPULARITY_DESC"],
      isAdult: false,
    },
  },
  GenresAndTags: { file: "taxonomy.graphql", variables: {} },
}

const fragments = await readFile(
  new URL("fragments.graphql", operationsDir),
  "utf8",
)
await mkdir(fixturesDir, { recursive: true })

// `pnpm fixtures:record BrowseAnime` records just the operations named.
const only = process.argv.slice(2)
const selected = Object.entries(OPERATIONS).filter(
  ([name]) => only.length === 0 || only.includes(name),
)

let first = true
for (const [name, { file, variables }] of selected) {
  if (!first) await sleep(3000)
  first = false

  const operation = await readFile(new URL(file, operationsDir), "utf8")
  // AniList rejects documents with unused fragments.
  const query = operation.includes("...MediaCard")
    ? `${operation}\n${fragments}`
    : operation
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
  })
  const body = await response.json().catch(() => null)
  if (!response.ok || !body?.data || body.errors?.length) {
    console.error(
      `${name}: HTTP ${response.status}`,
      JSON.stringify(body?.errors ?? body),
    )
    process.exit(1)
  }

  await writeFile(
    new URL(`${name}.json`, fixturesDir),
    JSON.stringify({ data: body.data }, null, 2) + "\n",
  )
  console.log(`recorded ${name}`)
}
