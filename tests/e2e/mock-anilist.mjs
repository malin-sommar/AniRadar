// Stand-in for AniList in end-to-end tests: answers each GraphQL operation
// with its recorded fixture from tests/fixtures/anilist/<Operation>.json.
import { readFile } from "node:fs/promises"
import { createServer } from "node:http"

const port = Number(process.env.MOCK_ANILIST_PORT ?? 4010)
const fixtures = new URL("../fixtures/anilist/", import.meta.url)

function send(response, status, body, headers = {}) {
  response.writeHead(status, { "Content-Type": "application/json", ...headers })
  response.end(typeof body === "string" ? body : JSON.stringify(body))
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST") {
    response
      .writeHead(200, { "Content-Type": "text/plain" })
      .end("mock AniList is up")
    return
  }

  let raw = ""
  for await (const chunk of request) raw += chunk
  const query = JSON.parse(raw || "{}").query ?? ""
  const name = /^\s*(?:query|mutation)\s+(\w+)/m.exec(query)?.[1]

  try {
    const fixture = await readFile(new URL(`${name}.json`, fixtures), "utf8")
    send(response, 200, fixture, {
      "X-RateLimit-Limit": "90",
      "X-RateLimit-Remaining": "89",
    })
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
