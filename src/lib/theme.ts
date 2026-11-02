export type ThemePreference = "dark" | "light" | "system"
export type ResolvedTheme = "dark" | "light"

export const THEME_STORAGE_KEY = "aniradar-theme"
export const DEFAULT_THEME: ThemePreference = "dark"

/** Browser chrome colour per theme (matches --background). */
export const THEME_COLORS: Record<ResolvedTheme, string> = {
  dark: "#0c0d14",
  light: "#fafafd",
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === "dark" || value === "light" || value === "system"
}

export function resolveTheme(
  preference: ThemePreference,
  systemPrefersDark: boolean,
): ResolvedTheme {
  if (preference === "system") return systemPrefersDark ? "dark" : "light"
  return preference
}

/**
 * Runs in <head> before first paint, so a saved light theme never flashes
 * dark. The server always renders the default (dark).
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem(${JSON.stringify(
  THEME_STORAGE_KEY,
)});if(p!=="light"&&p!=="dark"&&p!=="system")p=${JSON.stringify(
  DEFAULT_THEME,
)};var d=p==="dark"||(p==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content",d?${JSON.stringify(
  THEME_COLORS.dark,
)}:${JSON.stringify(THEME_COLORS.light)})}catch(e){}})()`
