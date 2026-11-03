# AniRadar

A mobile-first, installable companion app for [AniList](https://anilist.co): find anime, track what you watch in your AniList account, see what's airing, and never miss an episode.

> Personal project in active development. See [PLAN.md](PLAN.md) for the roadmap and progress, and [CLAUDE.md](CLAUDE.md) for the stack, commands and conventions.

## Quick start

Requires Node.js 22+ and pnpm (through corepack).

```bash
corepack install --global pnpm@10.34.9
pnpm install
pnpm dev
```

Open http://localhost:3000. To try the installable app and offline page, use a production build: `pnpm build && pnpm start`.

## Tests

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm exec playwright install chromium   # once
pnpm test:e2e
```

## Data

Anime data comes from the AniList API. AniRadar is not affiliated with AniList.
