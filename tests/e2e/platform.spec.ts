import { expect, test } from "./fixtures"

test("the app is installable: manifest and icons resolve", async ({
  request,
}) => {
  const manifest = await (await request.get("/manifest.webmanifest")).json()
  expect(manifest).toMatchObject({
    name: "AniRadar",
    display: "standalone",
    start_url: "/?source=pwa",
  })
  expect(
    manifest.icons.some(
      (icon: { purpose?: string }) => icon.purpose === "maskable",
    ),
  ).toBe(true)
  for (const icon of manifest.icons as { src: string }[]) {
    expect((await request.get(icon.src)).ok()).toBe(true)
  }
})

test("shows the offline page when a page can't load", async ({
  page,
  context,
}) => {
  await page.goto("/")
  // The service worker takes control of the page right after it installs.
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller), {
      timeout: 15_000,
    })
    .toBe(true)

  await context.setOffline(true)
  await page.goto("/schedule").catch(() => {})
  await expect(
    page.getByRole("heading", { name: "You're offline" }),
  ).toBeVisible()
  await context.setOffline(false)
})

test("every response carries the security headers", async ({ request }) => {
  const headers = (await request.get("/")).headers()
  expect(headers["content-security-policy"]).toContain("default-src 'self'")
  expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'")
  expect(headers["x-frame-options"]).toBe("DENY")
  expect(headers["x-content-type-options"]).toBe("nosniff")
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin")
  expect(headers["x-powered-by"]).toBeUndefined()
})

test("the AniList proxy serves allowlisted operations only", async ({
  request,
}) => {
  const variables = encodeURIComponent(
    JSON.stringify({ isAdult: false, page: 1, perPage: 25 }),
  )
  const ok = await request.get(`/api/anilist/TrendingAnime?v=${variables}`)
  expect(ok.status()).toBe(200)
  expect(ok.headers()["cache-control"]).toContain("s-maxage=1800")

  expect((await request.get("/api/anilist/Viewer?v={}")).status()).toBe(404)
})
