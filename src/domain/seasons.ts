import type {
  MediaFormat,
  MediaRelation,
  MediaType,
  SeasonNodeFragment,
} from "@/lib/anilist/gql/graphql"

/*
 * A franchise's seasons in order. AniList only links each entry to its
 * direct prequel and sequel, so the chain is walked in batches: every
 * request returns the entries asked for, their relations, and the IDs of
 * their relations' relations (two steps per request).
 */

export type SeasonNode = SeasonNodeFragment

interface Link {
  relationType: MediaRelation | null
  id: number
  type: MediaType | null
}

/** An entry with its relations, as the detail and chain queries return it. */
export interface SeasonItem extends SeasonNode {
  relations: {
    edges: Array<{
      relationType: MediaRelation | null
      node:
        | (SeasonNode & {
            relations: {
              edges: Array<{
                relationType: MediaRelation | null
                node: { id: number; type: MediaType | null } | null
              } | null> | null
            } | null
          })
        | null
    } | null> | null
  } | null
}

export interface SeasonGraph {
  nodes: Map<number, SeasonNode>
  /** Entries whose relations are known. */
  links: Map<number, Link[]>
}

const CHAIN_RELATIONS: ReadonlySet<MediaRelation | null> = new Set([
  "PREQUEL",
  "SEQUEL",
])

/** The fields of a SeasonNode, without nested relations. */
function seasonNode(item: SeasonNode): SeasonNode {
  return {
    id: item.id,
    type: item.type,
    format: item.format,
    status: item.status,
    averageScore: item.averageScore,
    title: item.title,
    coverImage: item.coverImage,
    startDate: item.startDate,
    seasonYear: item.seasonYear,
    episodes: item.episodes,
    isAdult: item.isAdult,
    siteUrl: item.siteUrl,
  }
}

function toLinks(
  edges: ReadonlyArray<{
    relationType: MediaRelation | null
    node: { id: number; type: MediaType | null } | null
  } | null> | null,
): Link[] {
  const links: Link[] = []
  for (const edge of edges ?? []) {
    if (edge?.node) {
      links.push({
        relationType: edge.relationType,
        id: edge.node.id,
        type: edge.node.type,
      })
    }
  }
  return links
}

export function emptyGraph(): SeasonGraph {
  return { nodes: new Map(), links: new Map() }
}

/** Adds an entry, its relations and its relations' relation IDs. */
export function addToGraph(graph: SeasonGraph, item: SeasonItem) {
  graph.nodes.set(item.id, seasonNode(item))
  graph.links.set(item.id, toLinks(item.relations?.edges ?? null))
  for (const edge of item.relations?.edges ?? []) {
    const node = edge?.node
    if (!node) continue
    if (!graph.nodes.has(node.id)) graph.nodes.set(node.id, seasonNode(node))
    if (!graph.links.has(node.id)) {
      graph.links.set(node.id, toLinks(node.relations?.edges ?? null))
    }
  }
}

/**
 * Walks prequel/sequel links between anime from `startId`. Returns the
 * entries reached and the ones whose relations still need fetching.
 */
export function exploreChain(graph: SeasonGraph, startId: number) {
  const members: number[] = []
  const frontier: number[] = []
  const seen = new Set([startId])
  const queue = [startId]
  while (queue.length > 0) {
    const id = queue.shift() as number
    const links = graph.links.get(id)
    if (!links) {
      frontier.push(id)
      continue
    }
    // Relations known but no details: AniList didn't return it.
    if (!graph.nodes.has(id)) continue
    members.push(id)
    for (const link of links) {
      if (!CHAIN_RELATIONS.has(link.relationType)) continue
      if (link.type !== "ANIME" || seen.has(link.id)) continue
      seen.add(link.id)
      queue.push(link.id)
    }
  }
  return { members, frontier }
}

export interface WalkResult {
  graph: SeasonGraph
  /** True when the request limit or a failed request stopped the walk. */
  truncated: boolean
  requests: number
}

/**
 * Collects a franchise's prequel/sequel chain, starting from the detail
 * page's entry. At most `maxRequests` batches (two steps each). If a batch
 * fails, the walk stops and keeps what it found.
 */
export async function walkSeasonChain(
  start: SeasonItem,
  fetchBatch: (ids: number[]) => Promise<SeasonItem[]>,
  { maxRequests = 4, batchSize = 50 } = {},
): Promise<WalkResult> {
  const graph = emptyGraph()
  addToGraph(graph, start)
  let requests = 0
  for (;;) {
    const { frontier } = exploreChain(graph, start.id)
    if (frontier.length === 0) return { graph, truncated: false, requests }
    if (requests >= maxRequests) return { graph, truncated: true, requests }
    const ids = frontier.slice(0, batchSize)
    let items: SeasonItem[]
    try {
      items = await fetchBatch(ids)
    } catch {
      return { graph, truncated: true, requests: requests + 1 }
    }
    requests++
    for (const item of items) addToGraph(graph, item)
    // Entries AniList didn't return (removed, or not anime) are dead ends.
    for (const id of ids) {
      if (!graph.links.has(id)) graph.links.set(id, [])
    }
  }
}

/** Formats that count as the main story: TV seasons, ONAs and movies. */
const MAIN_FORMATS: ReadonlySet<MediaFormat | null> = new Set([
  "TV",
  "TV_SHORT",
  "ONA",
  "MOVIE",
])

const SIDE_RELATIONS: ReadonlySet<MediaRelation | null> = new Set([
  "SIDE_STORY",
  "SPIN_OFF",
  "ALTERNATIVE",
  "SUMMARY",
  "PARENT",
  "CHARACTER",
  "COMPILATION",
  "CONTAINS",
  "SAME_UNIVERSE",
  "OTHER",
])

const SOURCE_RELATIONS: ReadonlySet<MediaRelation | null> = new Set([
  "SOURCE",
  "ADAPTATION",
])

export const RELATION_LABELS: Record<MediaRelation, string> = {
  ADAPTATION: "Adaptation",
  ALTERNATIVE: "Alternative",
  CHARACTER: "Shared characters",
  COMPILATION: "Compilation",
  CONTAINS: "Contains",
  OTHER: "Other",
  PARENT: "Parent story",
  PREQUEL: "Prequel",
  SEQUEL: "Sequel",
  SIDE_STORY: "Side story",
  SOURCE: "Source",
  SPIN_OFF: "Spin-off",
  SUMMARY: "Summary",
  SAME_UNIVERSE: "Same universe",
}

/** Earliest first; unknown dates last. */
export function compareStartDates(a: SeasonNode, b: SeasonNode): number {
  const key = (node: SeasonNode) => [
    node.startDate?.year ?? node.seasonYear ?? Number.POSITIVE_INFINITY,
    node.startDate?.month ?? 13,
    node.startDate?.day ?? 32,
  ]
  const [ka, kb] = [key(a), key(b)]
  for (let index = 0; index < ka.length; index++) {
    const diff = (ka[index] as number) - (kb[index] as number)
    if (diff !== 0 && !Number.isNaN(diff)) return diff
  }
  return a.id - b.id
}

export interface RelatedEntry {
  node: SeasonNode
  relation: MediaRelation | null
}

export interface SeasonGroups {
  /** TV seasons, ONAs and movies in the prequel/sequel chain, in order. */
  main: SeasonNode[]
  /** OVAs and specials in the chain, plus side stories, spin-offs and more. */
  side: RelatedEntry[]
  /** Manga, novels and other source material (linked on AniList). */
  source: RelatedEntry[]
}

/** Splits the walked chain and the entry's own relations into groups. */
export function groupSeasons(graph: SeasonGraph, currentId: number) {
  const { members } = exploreChain(graph, currentId)
  const chain = members
    .map((id) => graph.nodes.get(id))
    .filter((node): node is SeasonNode => node !== undefined)
  const inChain = new Set(chain.map((node) => node.id))

  const main = chain
    .filter((node) => MAIN_FORMATS.has(node.format))
    .sort(compareStartDates)

  const own = graph.links.get(currentId) ?? []
  const related = (relations: ReadonlySet<MediaRelation | null>) =>
    own
      .filter((link) => relations.has(link.relationType))
      .map((link) => ({
        node: graph.nodes.get(link.id),
        relation: link.relationType,
      }))
      .filter((entry): entry is RelatedEntry => entry.node !== undefined)

  const sideById = new Map<number, RelatedEntry>()
  for (const node of chain) {
    if (!MAIN_FORMATS.has(node.format)) {
      sideById.set(node.id, { node, relation: null })
    }
  }
  for (const entry of related(SIDE_RELATIONS)) {
    if (entry.node.type === "ANIME" && !inChain.has(entry.node.id)) {
      sideById.set(entry.node.id, entry)
    }
  }
  const side = [...sideById.values()].sort((a, b) =>
    compareStartDates(a.node, b.node),
  )

  const source = related(SOURCE_RELATIONS)
    .filter((entry) => entry.node.type !== "ANIME")
    .sort((a, b) => compareStartDates(a.node, b.node))

  return { main, side, source } satisfies SeasonGroups
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

/** "Jan 2027", "2027" or "TBA". */
export function formatStartDate(
  node: Pick<SeasonNode, "startDate" | "seasonYear">,
) {
  const year = node.startDate?.year ?? node.seasonYear
  if (!year) return "TBA"
  const month = node.startDate?.month
  return month ? `${MONTHS[month - 1]} ${year}` : String(year)
}

export interface SeriesSummary {
  seasons: number
  years: [number, number] | null
  /** Known episodes across the main story (undefined if any is unknown). */
  episodes: number | undefined
  /** Average of the seasons' AniList scores that are known. */
  averageScore: number | undefined
}

/** "6 seasons · 2013–2023 · 94 episodes · 85% average", as numbers. */
export function seriesSummary(main: readonly SeasonNode[]): SeriesSummary {
  const years = main
    .map((node) => node.startDate?.year ?? node.seasonYear)
    .filter((year): year is number => typeof year === "number")
  const released = main.filter((node) => node.status !== "NOT_YET_RELEASED")
  const episodes = released.every((node) => node.episodes)
    ? released.reduce((sum, node) => sum + (node.episodes ?? 0), 0)
    : undefined
  const scores = main
    .map((node) => node.averageScore)
    .filter((score): score is number => typeof score === "number")
  return {
    seasons: main.length,
    years: years.length > 0 ? [Math.min(...years), Math.max(...years)] : null,
    episodes: episodes || undefined,
    averageScore:
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : undefined,
  }
}

/** Whether an entry has a prequel or sequel, i.e. belongs to a series. */
export function hasSeasonChain(item: Pick<SeasonItem, "relations">): boolean {
  return (item.relations?.edges ?? []).some(
    (edge) =>
      CHAIN_RELATIONS.has(edge?.relationType ?? null) &&
      edge?.node?.type === "ANIME",
  )
}
