import AxeBuilder from "@axe-core/playwright"

import { expect, test } from "./fixtures"

// End-to-end tests run without Supabase (see playwright.config.ts), so these
// cover the signed-out pages. Sign-in itself is tested by hand against the
// dev project, and row-level security by the database tests.

test("Me says sign-in isn't available without accounts", async ({ page }) => {
  await page.goto("/me")
  await expect(page.getByRole("heading", { name: "Account" })).toBeVisible()
  await expect(
    page.getByText("Sign-in isn't set up on this server yet."),
  ).toBeVisible()
  // Settings still work without an account.
  await expect(
    page.getByRole("radiogroup", { name: "Title language" }),
  ).toBeVisible()
})

test("the privacy policy and about page are linked from every page", async ({
  page,
}) => {
  await page.goto("/")
  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "Privacy" })
    .click()
  await expect(
    page.getByRole("heading", { level: 1, name: "Privacy" }),
  ).toBeVisible()
  await expect(
    page.getByText("Malin Sommar is the data controller"),
  ).toBeVisible()

  await page
    .getByRole("contentinfo")
    .getByRole("link", { name: "About" })
    .click()
  await expect(
    page.getByRole("heading", { level: 1, name: "About" }),
  ).toBeVisible()
})

test("data export refuses visitors who aren't signed in", async ({
  request,
}) => {
  const response = await request.get("/api/me/export")
  expect(response.status()).toBe(401)
  expect(response.headers()["cache-control"]).toBe("no-store")
})

test("the privacy page has no detectable accessibility violations", async ({
  page,
}) => {
  await page.goto("/privacy")
  const report = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze()
  expect(
    report.violations.map((violation) => `${violation.id}: ${violation.help}`),
  ).toEqual([])
})
