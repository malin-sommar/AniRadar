// Fails if anything secret-looking ended up in the browser bundle.
// Run after `pnpm build` (CI does this on every push).
import { readdir, readFile } from "node:fs/promises"
import { join } from "node:path"

const distDir = process.env.NEXT_DIST_DIR || ".next"
const staticDir = join(distDir, "static")

const PATTERNS = [
  { name: "Supabase secret key", regex: /sb_secret_[A-Za-z0-9_-]{10,}/ },
  { name: "private key", regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: "service_role JWT", regex: /"role"\s*:\s*"service_role"/ },
]

/** Variables from .env.local too, so a local build is checked against them. */
async function localEnv() {
  try {
    const text = await readFile(".env.local", "utf8")
    return Object.fromEntries(
      text
        .split(/\r?\n/)
        .map((line) => /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line))
        .filter(Boolean)
        .map(([, key, value]) => [key, value.replace(/^["']|["']$/g, "")]),
    )
  } catch {
    return {}
  }
}

// The values of server-only variables that look secret must never appear.
const secretValues = Object.entries({ ...(await localEnv()), ...process.env })
  .filter(
    ([key, value]) =>
      !key.startsWith("NEXT_PUBLIC_") &&
      /SECRET|PRIVATE|TOKEN|PASSWORD|_KEY$/.test(key) &&
      value &&
      value.length >= 12,
  )
  .map(([key, value]) => ({ name: `value of ${key}`, value }))

async function* files(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) yield* files(path)
    else if (/\.(js|css|html|json|map)$/.test(entry.name)) yield path
  }
}

let scanned = 0
const findings = []
try {
  for await (const file of files(staticDir)) {
    scanned++
    const content = await readFile(file, "utf8")
    for (const { name, regex } of PATTERNS) {
      if (regex.test(content)) findings.push(`${file}: ${name}`)
    }
    for (const { name, value } of secretValues) {
      if (content.includes(value)) findings.push(`${file}: ${name}`)
    }
  }
} catch (error) {
  console.error(
    `Couldn't read ${staticDir}. Run \`pnpm build\` first.`,
    error.message,
  )
  process.exit(1)
}

if (findings.length > 0) {
  console.error(
    "Secrets found in the client bundle:\n" +
      findings.map((line) => `  ${line}`).join("\n"),
  )
  process.exit(1)
}
console.log(`Client bundle clean (${scanned} files scanned).`)
