import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

// The mock serves recorded details for Attack on Titan (16498, finished,
// long franchise) and ONE PIECE (21, airing; its schedule is moved to
// start 90 minutes from now). Other shows get a bare page built from the
// browse fixture: no banner, MAL entry or extras.

test("shows a show's main content with its MAL score", async ({ page }) => {
  await page.goto("/anime/16498")
  await expect(
    page.getByRole("heading", { level: 1, name: "Attack on Titan" }),
  ).toBeVisible()
  await expect(page.getByText("Shingeki no Kyojin · 進撃の巨人")).toBeVisible()
  await expect(
    page.getByRole("link", { name: /8\.55 MyAnimeList score/ }),
  ).toBeVisible()

  await expect(page.getByRole("heading", { name: "Synopsis" })).toBeVisible()
  await expect(page.getByRole("link", { name: /Crunchyroll/ })).toHaveAttribute(
    "href",
    /crunchyroll\.com/,
  )
  const details = page.getByRole("region", { name: "Details" })
  await expect(details.getByText("WIT STUDIO")).toBeVisible()
  await expect(
    details.getByRole("link", { name: "Spring 2013" }),
  ).toHaveAttribute("href", "/browse?season=spring&year=2013")
  await expect(
    page.getByRole("link", { name: /View on AniList/ }),
  ).toBeVisible()
  await expect(page).toHaveTitle("Attack on Titan · AniRadar")
})

test("lists the seasons in order and marks the current one", async ({
  page,
}) => {
  await page.goto("/anime/16498")
  const seasons = page
    .getByRole("region", { name: "Seasons & related" })
    .getByRole("list")
    .first()
    .getByRole("link")
  await expect(seasons).toHaveText([
    /^1You're hereAttack on TitanTV/,
    /Attack on Titan Season 2/,
    /Attack on Titan Season 3/,
    /Season 3 Part 2/,
    /Final Season/,
    /Final Season Part 2/,
  ])
  await expect(seasons.first()).toHaveAttribute("aria-current", "page")

  await seasons.nth(1).click()
  await expect(page).toHaveURL("/anime/20958")
  await expect(
    page.getByRole("heading", { level: 1, name: "Attack on Titan Season 2" }),
  ).toBeVisible()
})

test("shows voice actors and loads all characters on request", async ({
  page,
}) => {
  await page.goto("/anime/16498")
  const characters = page.getByRole("region", {
    name: "Characters & voice actors",
  })
  const eren = characters
    .getByRole("listitem")
    .filter({ hasText: "Eren Yeager" })
  await expect(eren).toContainText("Yuuki Kaji")
  await expect(eren).toContainText("Bryce Papenbrook")
  await characters.getByRole("button", { name: "Show all characters" }).click()
  await expect(characters.getByRole("button")).toHaveCount(0)
})

test("keeps spoiler tags hidden until asked for", async ({ page }) => {
  await page.goto("/anime/16498")
  const tags = page.getByRole("region", { name: "Tags" }).getByRole("listitem")
  await expect(tags).toHaveCount(20)
  await page.getByRole("button", { name: "9 spoiler tags" }).click()
  await expect(tags).toHaveCount(29)
})

test("loads the trailer from YouTube only when you press play", async ({
  page,
}) => {
  await page.route("https://www.youtube-nocookie.com/**", (route) =>
    route.abort(),
  )
  await page.goto("/anime/16498")
  const trailer = page.getByRole("region", { name: "Trailer" })
  await expect(trailer.locator("iframe")).toHaveCount(0)
  await trailer.getByRole("button", { name: /Play trailer/ }).click()
  await expect(trailer.locator("iframe")).toHaveAttribute(
    "src",
    /^https:\/\/www\.youtube-nocookie\.com\/embed\/LHtdKWJdif4\?/,
  )
})

test("counts down to the next episode of an airing show", async ({ page }) => {
  await page.goto("/anime/21")
  const airing = page.getByRole("region", { name: "Airing" })
  await expect(airing.getByText("Episode 1181")).toBeVisible()
  await expect(airing.getByText(/^in 1h (29|30)m$/)).toBeVisible()
  await expect(airing.getByRole("list").getByRole("listitem")).toHaveCount(5)
})

test("a show without banner, MAL entry or extras still works", async ({
  page,
}) => {
  await page.goto("/anime/1535")
  await expect(
    page.getByRole("heading", { level: 1, name: "Death Note" }),
  ).toBeVisible()
  await expect(page.getByRole("region", { name: "Details" })).toBeVisible()
  await expect(
    page.getByRole("link", { name: /MyAnimeList score/ }),
  ).toHaveCount(0)
  await expect(
    page.getByRole("region", { name: "Seasons & related" }),
  ).toHaveCount(0)
})

test("an unknown anime shows the not-found page", async ({ page }) => {
  await page.goto("/anime/9999999")
  await expect(
    page.getByRole("heading", { name: "Nothing on the radar" }),
  ).toBeVisible()
})

test("cards open the detail page", async ({ page }) => {
  await page.goto("/browse?q=death")
  await page
    .getByRole("link", { name: /Death Note/ })
    .first()
    .click()
  await expect(page).toHaveURL("/anime/1535")
  await expect(
    page.getByRole("heading", { level: 1, name: "Death Note" }),
  ).toBeVisible()
})

test("the detail page has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/anime/16498")
  await expect(
    page.getByRole("heading", { name: "Characters & voice actors" }),
  ).toBeVisible()
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(
    report.violations.map((violation) => `${violation.id}: ${violation.help}`),
  ).toEqual([])
})
