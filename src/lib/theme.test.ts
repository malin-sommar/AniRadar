// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from "vitest"

import {
  THEME_COLORS,
  THEME_STORAGE_KEY,
  resolveTheme,
  themeInitScript,
} from "./theme"

function runInitScript() {
  // The script is a string so it can run in <head> before React loads.
  new Function(themeInitScript)()
}

afterEach(() => {
  localStorage.clear()
  document.documentElement.className = ""
  document.head.innerHTML = ""
})

describe("resolveTheme", () => {
  it("follows the system only when set to system", () => {
    expect(resolveTheme("system", true)).toBe("dark")
    expect(resolveTheme("system", false)).toBe("light")
    expect(resolveTheme("light", true)).toBe("light")
    expect(resolveTheme("dark", false)).toBe("dark")
  })
})

describe("themeInitScript", () => {
  it("defaults to dark when nothing is saved", () => {
    runInitScript()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
    expect(document.documentElement.style.colorScheme).toBe("dark")
  })

  it("applies a saved light theme and updates the browser colour", () => {
    document.head.innerHTML = `<meta name="theme-color" content="${THEME_COLORS.dark}">`
    document.documentElement.classList.add("dark")
    localStorage.setItem(THEME_STORAGE_KEY, "light")

    runInitScript()
    expect(document.documentElement.classList.contains("dark")).toBe(false)
    expect(
      document
        .querySelector('meta[name="theme-color"]')
        ?.getAttribute("content"),
    ).toBe(THEME_COLORS.light)
  })

  it("ignores garbage in storage", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "neon")
    runInitScript()
    expect(document.documentElement.classList.contains("dark")).toBe(true)
  })
})
