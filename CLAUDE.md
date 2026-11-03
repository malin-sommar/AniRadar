@AGENTS.md

# AniRadar

A mobile-first PWA companion for AniList: find anime, track it in your AniList account, see what's airing, and get notified. **PLAN.md** holds the plan, every decision and the progress log. Read it before starting a phase and update its progress log when a phase ends.

## Stack

- **Next.js 16.4** (App Router, Turbopack, Cache Components + Partial Prefetching, React Compiler, typed routes) on **React 19.3**
- **TypeScript 6.0**, strict. Not 7: typescript-eslint doesn't support it yet.
- **Tailwind CSS 4.3** (through the `@tailwindcss/turbopack` loader, no PostCSS) + **shadcn/ui** (Radix base, "nova" preset; `cn` comes from the `cn` package) + lucide-react + sonner
- **TanStack Query 5**, persisted to IndexedDB (idb-keyval)
- **Zod 4**; **GraphQL Code Generator** (client preset, string documents)
- **Serwist** (`@serwist/turbopack`) for the service worker
- **Vitest 5** + Testing Library + **MSW 3**; **Playwright 1.64** + axe
- **ESLint 9** (flat config, `eslint-config-next`) + **Prettier 3**. Not ESLint 10: eslint-plugin-react, -import and -jsx-a11y don't support it yet.
- **pnpm 10.34** through corepack, Node ≥ 22. Not pnpm 12: corepack 0.34 can't run it.
- Coming later: Supabase (EU, Stockholm) for accounts, Vercel (`arn1`) for hosting.

## Commands

| Command                                           | What it does                                                                                                               |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `pnpm dev`                                        | Dev server at http://localhost:3000 (service worker off)                                                                   |
| `pnpm build && pnpm start`                        | Production build; test the service worker and offline page here                                                            |
| `pnpm lint` · `pnpm format` · `pnpm format:check` | ESLint · Prettier write · Prettier check                                                                                   |
| `pnpm typecheck`                                  | `next typegen` + `tsc --noEmit`                                                                                            |
| `pnpm test` · `pnpm test:watch`                   | Vitest unit and component tests                                                                                            |
| `pnpm test:e2e`                                   | Playwright on a phone and a desktop profile. Builds into `.next-e2e` against a mock AniList (`tests/e2e/mock-anilist.mjs`) |
| `pnpm test:live`                                  | One real AniList request to catch schema changes. Manual only, never in CI                                                 |
| `pnpm codegen`                                    | Regenerates `src/lib/anilist/gql/` from `operations/*.graphql`                                                             |
| `pnpm schema:fetch`                               | Re-downloads AniList's schema (1 request); run `pnpm codegen` after                                                        |
| `pnpm fixtures:record`                            | Re-records `tests/fixtures/anilist/` (1 request per operation)                                                             |
| `pnpm icons`                                      | Regenerates the app icons (`scripts/generate-icons.mjs`)                                                                   |
| `pnpm check:bundle`                               | Scans the client build for secrets (after `pnpm build`)                                                                    |

First-time setup: `corepack install --global pnpm@10.34.9`, `pnpm install`, `pnpm exec playwright install chromium`. Copy `.env.example` to `.env.local` only if you need to change a default.

## Layout

```text
src/
  app/          routes, layouts, route handlers, manifest.ts, sw.ts (service worker)
    api/anilist/[op]/   the browser's proxy to AniList (allowlisted, CDN-cached)
    img/[...path]/      same-origin image proxy for AniList's CDN
    serwist/[path]/     serves the bundled service worker
  components/   shared UI (ui/ = shadcn), app shell, theme
  features/     feature modules (home, later browse, detail, list, ...)
  domain/       pure logic with unit tests (titles, formats, countdowns, later smart status)
  hooks/        shared client hooks
  lib/
    anilist/    core/ (limiter, client, errors), registry, cache policy, server + browser entry points, gql/ (generated)
    env/        Zod-validated env (client, server)
    query/      TanStack Query client and IndexedDB persister
  server/       server-only code from Phase 3 on (secrets, tokens, jobs)
tests/          setup, msw/, e2e/, live/, fixtures/
scripts/        schema, fixtures, icons, bundle check
```

## Working with AniList

- **Adding an operation:**
  1. Write `src/lib/anilist/operations/<name>.graphql`, reusing fragments from `fragments.graphql`.
  2. Run `pnpm codegen`.
  3. Register it in `src/lib/anilist/registry.ts` with a strict Zod schema for its variables and a cache class.
  4. Run `pnpm fixtures:record` and commit the fixture.
- **Server components:** call `getAniList(name, variables)` from `@/lib/anilist/server`. It's cached with `'use cache'` for as long as the operation's cache policy says.
  - To prefetch for the client, use a `'use cache'` component that makes exactly one `cacheLife` call: `cacheLifeProfile(policy)` on success, `FAILURE_CACHE_LIFE` when AniList failed, so the section renders at request time instead. Then hand the data over with `aniListQueryKey` and `HydrationBoundary`.
  - `src/features/home/trending-section.tsx` is the reference.
- **Client components:** call `useAniListQuery(name, variables)` from `@/lib/anilist/hooks`. It goes through `/api/anilist/[op]`.
- **Freshness** for every layer (TanStack, CDN, Next cache) lives in one table: `src/lib/anilist/cache-policy.ts`.
- Nothing calls `graphql.anilist.co` outside `src/lib/anilist`. Images from new hosts need a proxy route, because CSP blocks other origins.
- AniList's terms (PLAN.md §1, §6): AniRadar is a complementary AniList client.
  - No crawling, bulk prefetching or hoarding.
  - Never store anime data in our database (AniList IDs only).
  - Never store AniRadar data inside AniList.

## Next.js 16 pitfalls

- The bundled docs in `node_modules/next/dist/docs/` are the reference. Training data is out of date for 16.x.
- With Cache Components, `usePathname()`, `useSearchParams()` and `params` on routes with unknown dynamic params must sit inside `<Suspense>`. See `components/app-shell/*-nav.tsx`.
- The route segment configs `dynamic` and `revalidate` aren't allowed. Use `'use cache'` + `cacheLife` instead (the Serwist route shows how).
- `'use cache'` defaults to an in-memory store per server instance, which isn't shared on serverless. Prerendered pages (ISR) and CDN-cached route responses are the durable cache layers.
- `middleware.ts` is called `proxy.ts` now. `next lint` is gone; run `pnpm lint`.

## Rules

1. Business rules go in pure, tested functions in `src/domain`, not in components.
2. Zod validates every external input: route params, REST/RSS responses, env vars.
3. Secrets live only in server code (`import "server-only"`), never in `NEXT_PUBLIC_*`.
4. Every new database table (Phase 3+) ships with RLS, policies and pgTAP tests in the same change.
5. Mobile first: check 375 px and 1280 px. Dark mode is the default. Colours come from tokens in `globals.css`. Each anime's `coverImage.color` drives its accent.
6. Accessibility is part of done: keyboard, labels, contrast; the axe test must pass.
7. Prettier style: no semicolons, double quotes. Run `pnpm format`.

## Workflow

- One branch and pull request per phase (`phase-N-name`). Ask before every commit and push.
- A phase is done when all of these hold (PLAN.md §14):
  - lint, typecheck, unit tests, build, bundle check and e2e all pass
  - the app has been clicked through at phone and desktop width, with no console or server errors
  - PLAN.md's progress log is updated
- Then stop for review.
