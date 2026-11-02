// Renders the AniRadar radar mark into every icon the app needs.
// Run with `pnpm icons` after changing the design; the output is committed.
import { mkdir, writeFile } from "node:fs/promises"

import sharp from "sharp"

const VIOLET = "#9d8bff"
const CYAN = "#57d9e0"
const BACKGROUND_TOP = "#1d1747"
const BACKGROUND_BOTTOM = "#0c0d14"

/**
 * @param {object} options
 * @param {number} options.radius Corner radius of the background (0 = full bleed).
 * @param {number} options.scale Size of the mark; maskable icons need a smaller
 *   one so Android's mask never clips it (safe zone: 80% circle).
 */
function iconSvg({ radius, scale }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0" stop-color="${BACKGROUND_TOP}"/>
      <stop offset="1" stop-color="${BACKGROUND_BOTTOM}"/>
    </linearGradient>
    <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0.4">
      <stop offset="0" stop-color="${VIOLET}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${VIOLET}" stop-opacity="0.55"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="${radius}" fill="url(#bg)"/>
  <g transform="translate(256 256) scale(${scale})">
    <circle r="168" fill="none" stroke="${VIOLET}" stroke-opacity=".38" stroke-width="16"/>
    <circle r="92" fill="none" stroke="${VIOLET}" stroke-opacity=".38" stroke-width="16"/>
    <path d="M0 0 L0 -168 A168 168 0 0 1 159.78 -51.91 Z" fill="url(#sweep)"/>
    <circle cx="-76" cy="70" r="22" fill="${CYAN}"/>
    <circle r="20" fill="${VIOLET}"/>
  </g>
</svg>`
}

const rounded = iconSvg({ radius: 112, scale: 1 })
const fullBleed = iconSvg({ radius: 0, scale: 1 })
const maskable = iconSvg({ radius: 0, scale: 0.78 })

async function png(svg, size, file) {
  await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toFile(file)
  console.log(`wrote ${file}`)
}

await mkdir("public/icons", { recursive: true })
await png(rounded, 192, "public/icons/icon-192.png")
await png(rounded, 512, "public/icons/icon-512.png")
await png(maskable, 512, "public/icons/icon-maskable-512.png")
// iOS rounds the corners itself, so the Apple icon is full bleed.
await png(fullBleed, 180, "src/app/apple-icon.png")
await writeFile("src/app/icon.svg", rounded + "\n")
console.log("wrote src/app/icon.svg")
