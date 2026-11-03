import type { MetadataRoute } from "next"

import { THEME_COLORS } from "@/lib/theme"

/** Web app manifest: makes AniRadar installable on phones and desktops. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "AniRadar",
    short_name: "AniRadar",
    description:
      "Find anime, track what you watch with AniList, and never miss an episode.",
    start_url: "/?source=pwa",
    scope: "/",
    display: "standalone",
    background_color: THEME_COLORS.dark,
    theme_color: THEME_COLORS.dark,
    categories: ["entertainment"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  }
}
