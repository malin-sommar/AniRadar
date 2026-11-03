import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

// The mock AniList filters a fixture of 50 popular shows: 3 of them are
// movies, 47 are TV, and 5 have "Titan" in the title. Seasons of one series
// share a card (PLAN.md §10.0): the first 30 results make 23 cards, all 50
// make 41, and the 47 TV shows make 23 (first page) and 39 cards.

function results(page: import("@playwright/test").Page) {
  return page.getByRole("region", { name: "Results" }).getByRole("listitem")
}

test("filters combine, live in the URL and survive a reload", async ({
  page,
}) => {
  await page.goto("/browse")
  await expect(results(page)).toHaveCount(23)

  await page.getByRole("button", { name: "Format" }).click()
  await page.getByRole("option", { name: "Movie" }).click()
  await page.keyboard.press("Escape")

  await expect(page).toHaveURL(/format=movie/)
  await expect(results(page)).toHaveCount(3)
  await expect(
    page.getByRole("heading", { name: "A Silent Voice" }),
  ).toBeVisible()

  await page.getByRole("button", { name: "Sort: Popularity" }).click()
  await page.getByRole("option", { name: "Score" }).click()
  await expect(page).toHaveURL(/sort=score/)

  // A shared link opens the same view.
  await page.reload()
  await expect(results(page)).toHaveCount(3)
  await expect(page.getByRole("button", { name: "Sort: Score" })).toBeVisible()

  // Removing the chip brings everything back.
  await page
    .getByRole("list", { name: "Active filters" })
    .getByRole("button", { name: /Movie/ })
    .click()
  await expect(page).not.toHaveURL(/format=/)
  await expect(results(page)).toHaveCount(23)
})

test("search text filters the results", async ({ page }) => {
  await page.goto("/browse")
  await page.getByRole("searchbox", { name: "Search anime" }).fill("titan")
  await expect(page).toHaveURL(/q=titan/)
  // Five seasons, one series.
  await expect(results(page)).toHaveCount(1)
  await expect(results(page).first()).toContainText("5 seasons")
  await expect(
    page.getByRole("button", { name: "Sort: Best match" }),
  ).toBeVisible()
})

test("search finds titles from part of a word", async ({ page }) => {
  // The mock AniList, like the real one, only matches whole words; the
  // partial match comes from the Kitsu title lookup.
  await page.goto("/browse")
  await page.getByRole("searchbox", { name: "Search anime" }).fill("juju")
  await expect(page).toHaveURL(/q=juju/)
  await expect(
    page.getByRole("heading", { name: "JUJUTSU KAISEN" }),
  ).toBeVisible()

  await page.goto("/schedule")
  await page.keyboard.press("/")
  await page.getByRole("dialog").getByRole("combobox").fill("kaise")
  await expect(
    page.getByRole("dialog").getByRole("option", { name: /JUJUTSU KAISEN/ }),
  ).toBeVisible()
})

test("a season without its earlier seasons says what it continues", async ({
  page,
}) => {
  // Of the three films, only Mugen Train belongs to a series; its earlier
  // seasons aren't films, so they aren't among these results.
  await page.goto("/browse?format=movie")
  await expect(results(page)).toHaveCount(3)
  await expect(results(page).filter({ hasText: "Mugen Train" })).toContainText(
    "Continues Demon Slayer: Kimetsu no Yaiba",
  )
})

test("an empty result offers to clear the filters", async ({ page }) => {
  await page.goto("/browse?q=titan&format=movie")
  await expect(
    page.getByRole("heading", { name: "No anime found" }),
  ).toBeVisible()
  await page.getByRole("button", { name: "Clear search and filters" }).click()
  await expect(results(page)).toHaveCount(23)
})

test("infinite scroll loads the next page", async ({ page }) => {
  await page.goto("/browse")
  await expect(results(page)).toHaveCount(23)
  await page.getByRole("button", { name: "Load more" }).scrollIntoViewIfNeeded()
  // Seasons on page 2 join their series' cards from page 1.
  await expect(results(page)).toHaveCount(41)
  await expect(page.getByText("That's everything.")).toBeVisible()
})

test("Back restores the filters and the scroll position", async ({ page }) => {
  await page.goto("/browse?format=tv")
  await expect(results(page)).toHaveCount(23)
  await page.getByRole("button", { name: "Load more" }).scrollIntoViewIfNeeded()
  await expect(results(page)).toHaveCount(39)

  const card = results(page).nth(35).getByRole("link")
  await card.scrollIntoViewIfNeeded()
  const scrollBefore = await page.evaluate(() => window.scrollY)
  const href = await card.getAttribute("href")
  await card.click()
  await expect(page).toHaveURL(href ?? /\/anime\//)

  await page.goBack()
  await expect(page).toHaveURL(/format=tv/)
  await expect(results(page)).toHaveCount(39)
  await expect(results(page).nth(35)).toBeInViewport()
  const scrollAfter = await page.evaluate(() => window.scrollY)
  expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(200)
})

test("the search overlay finds anime from any page", async ({ page }) => {
  await page.goto("/schedule")
  await page
    .getByRole("button", { name: /Search anime/ })
    .filter({ visible: true })
    .click()

  const dialog = page.getByRole("dialog", { name: "Search anime" })
  await dialog.getByRole("combobox").fill("titan")
  await expect(
    dialog.getByRole("option", { name: /Attack on Titan.*5 seasons/ }),
  ).toHaveCount(1)

  await dialog.getByRole("option", { name: /See all results/ }).click()
  await expect(page).toHaveURL(/\/browse\?q=titan/)
  await expect(results(page)).toHaveCount(1)

  // Enter opens the top match.
  await page.keyboard.press("/")
  await page.getByRole("dialog").getByRole("combobox").fill("titan")
  await expect(
    page.getByRole("dialog").getByRole("option", { name: /Attack on Titan/ }),
  ).toHaveCount(1)
  await page.keyboard.press("Enter")
  await expect(page).toHaveURL(/\/anime\/\d+$/)
})

test("adult content needs an 18+ confirmation and is remembered", async ({
  page,
}) => {
  await page.goto("/me")
  const toggle = page.getByRole("switch", { name: "Show adult content" })
  await expect(toggle).not.toBeChecked()

  await toggle.click()
  await page.getByRole("button", { name: "Cancel" }).click()
  await expect(toggle).not.toBeChecked()

  await toggle.click()
  await page.getByRole("button", { name: "I'm 18 or older" }).click()
  await expect(toggle).toBeChecked()

  await page.reload()
  await expect(toggle).toBeChecked()

  // The adult genre is only offered once the setting is on.
  await page.goto("/browse")
  await page.getByRole("button", { name: "Genres" }).click()
  await expect(page.getByRole("option", { name: "Hentai" })).toBeVisible()
})

test("adult genres are hidden by default", async ({ page }) => {
  await page.goto("/browse")
  await page.getByRole("button", { name: "Genres" }).click()
  await expect(page.getByRole("option", { name: "Action" })).toBeVisible()
  await expect(page.getByRole("option", { name: "Hentai" })).toHaveCount(0)
})

test("the page never scrolls sideways, even with many filters", async ({
  page,
}) => {
  await page.goto("/browse?genres=Action,Drama&format=tv,movie&status=finished")
  await expect(results(page).first()).toBeVisible()
  const overflow = await page.evaluate(
    () =>
      document.documentElement.scrollWidth -
      document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test("Browse has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/browse?genres=Action")
  await expect(results(page).first()).toBeVisible()
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(
    report.violations.map((violation) => `${violation.id}: ${violation.help}`),
  ).toEqual([])
})
