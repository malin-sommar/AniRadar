import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

test("Home shows trending anime with a hero", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Trending now" }),
  ).toBeVisible()
  await expect(page.getByRole("link", { name: /View details/ })).toBeVisible()
  // The fixture has 25 shows: one hero plus a 24-card grid.
  await expect(
    page.getByRole("main").getByRole("list").first().getByRole("listitem"),
  ).toHaveCount(24)
})

test("the main navigation reaches every section", async ({ page }) => {
  await page.goto("/")
  const nav = page
    .getByRole("navigation", { name: "Main" })
    .filter({ visible: true })

  const sections = [
    ["Browse", "Browse"],
    ["Schedule", "Your airing schedule"],
    ["My List", "Your list"],
    ["Home", "Trending now"],
  ] as const
  for (const [label, heading] of sections) {
    await nav.getByRole("link", { name: label }).click()
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible()
    await expect(nav.getByRole("link", { name: label })).toHaveAttribute(
      "aria-current",
      "page",
    )
  }
})

test("the theme can be switched and is remembered", async ({ page }) => {
  const html = page.locator("html")
  await page.goto("/me")
  await expect(html).toHaveClass(/dark/)

  await page.getByRole("radio", { name: "Light" }).click()
  await expect(html).not.toHaveClass(/dark/)
  await page.reload()
  await expect(html).not.toHaveClass(/dark/)

  await page.getByRole("radio", { name: "Dark" }).click()
  await expect(html).toHaveClass(/dark/)
})

test("Home has no detectable accessibility violations", async ({ page }) => {
  await page.goto("/")
  await expect(
    page.getByRole("heading", { name: "Trending now" }),
  ).toBeVisible()
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(
    results.violations.map((violation) => `${violation.id}: ${violation.help}`),
  ).toEqual([])
})
