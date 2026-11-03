import { HttpResponse, http } from "msw"
import { describe, expect, it } from "vitest"

import { server, setupMockServer } from "../../../../tests/msw/server"

import { GET } from "./route"

setupMockServer()

const COVER = "file/anilistcdn/media/anime/cover/large/bx21-ELSYx3yMPcKM.jpg"

function call(path: string) {
  return GET(new Request(`http://localhost/img/${path}`), {
    params: Promise.resolve({ path: path.split("/") }),
  })
}

describe("GET /img/[...path]", () => {
  it("proxies AniList images with long-lived cache headers", async () => {
    server.use(
      http.get(`https://s4.anilist.co/${COVER}`, () =>
        HttpResponse.arrayBuffer(new Uint8Array([0xff, 0xd8, 0xff]).buffer, {
          headers: { "Content-Type": "image/jpeg" },
        }),
      ),
    )

    const response = await call(`anilist/${COVER}`)
    expect(response.status).toBe(200)
    expect(response.headers.get("Content-Type")).toBe("image/jpeg")
    expect(response.headers.get("Cache-Control")).toContain("immutable")
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(
      new Uint8Array([0xff, 0xd8, 0xff]),
    )
  })

  it.each([
    ["an unknown source", `elsewhere/${COVER}`],
    [
      "a path outside AniList's media folders",
      "anilist/api/v2/oauth/token.jpg",
    ],
    [
      "a file that isn't an image",
      "anilist/file/anilistcdn/media/anime/notes.txt",
    ],
    ["path traversal", "anilist/file/anilistcdn/../../secret.jpg"],
    ["a YouTube page instead of a thumbnail", "youtube/watch/LHtdKWJdif4.jpg"],
  ])("refuses %s without contacting upstream", async (_label, path) => {
    // No MSW handler: any upstream request would fail the test.
    expect((await call(path)).status).toBe(404)
  })

  it("proxies YouTube trailer thumbnails", async () => {
    server.use(
      http.get("https://i.ytimg.com/vi/LHtdKWJdif4/hqdefault.jpg", () =>
        HttpResponse.arrayBuffer(new Uint8Array([0xff, 0xd8]).buffer, {
          headers: { "Content-Type": "image/jpeg" },
        }),
      ),
    )
    const response = await call("youtube/vi/LHtdKWJdif4/hqdefault.jpg")
    expect(response.status).toBe(200)
  })

  it("passes through a missing image as 404", async () => {
    server.use(
      http.get(
        `https://s4.anilist.co/${COVER}`,
        () => new HttpResponse(null, { status: 404 }),
      ),
    )
    expect((await call(`anilist/${COVER}`)).status).toBe(404)
  })

  it("refuses to relay anything that isn't an image", async () => {
    server.use(
      http.get(`https://s4.anilist.co/${COVER}`, () =>
        HttpResponse.html("<h1>Login</h1>"),
      ),
    )
    expect((await call(`anilist/${COVER}`)).status).toBe(502)
  })
})
