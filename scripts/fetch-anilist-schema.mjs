// Downloads AniList's GraphQL schema (one request) and saves it as SDL for
// GraphQL Code Generator. Run with `pnpm schema:fetch`, then `pnpm codegen`.
import { writeFile } from "node:fs/promises"

import { buildClientSchema, getIntrospectionQuery, printSchema } from "graphql"

const url = process.env.ANILIST_API_URL || "https://graphql.anilist.co"
const target = new URL("../src/lib/anilist/schema.graphql", import.meta.url)

// AniList's server doesn't support the newest introspection fields, so ask
// only for the classic set.
const query = getIntrospectionQuery({
  descriptions: true,
  specifiedByUrl: false,
  directiveIsRepeatable: false,
  schemaDescription: false,
  inputValueDeprecation: false,
  oneOf: false,
})

const response = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  body: JSON.stringify({ query }),
})

const body = await response.json().catch(() => null)

if (!response.ok || !body?.data || body.errors?.length) {
  console.error(`Schema request failed (HTTP ${response.status}).`)
  if (response.status === 429) {
    console.error(
      `Rate limited. Retry after ${response.headers.get("retry-after") ?? "60"}s.`,
    )
  }
  console.error(JSON.stringify(body?.errors ?? body, null, 2))
  process.exit(1)
}

const sdl = printSchema(buildClientSchema(body.data))
const header = `# AniList GraphQL schema, fetched ${new Date().toISOString().slice(0, 10)} with \`pnpm schema:fetch\`.\n# Generated file: don't edit by hand.\n\n`

await writeFile(target, header + sdl + "\n")
console.log(
  `Saved ${sdl.length.toLocaleString()} characters to src/lib/anilist/schema.graphql`,
)
