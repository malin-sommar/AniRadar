import { getMalScore } from "@/lib/jikan/server"

import { getAnimeDetail } from "./load"
import { ScoreChip } from "./score-chip"

const ratings = new Intl.NumberFormat("en", { notation: "compact" })

/**
 * MyAnimeList's score, via Jikan. Streams in after the page; left out when
 * the show has no MAL entry, MAL hasn't scored it, or Jikan is down.
 */
export async function MalScoreChip({ id }: { id: number }) {
  const media = await getAnimeDetail(id).catch(() => null)
  if (!media?.idMal) return null
  const mal = await getMalScore(media.idMal)
  if (mal?.score == null) return null

  const details = [
    mal.rank ? `rank #${mal.rank}` : undefined,
    mal.scoredBy ? `${ratings.format(mal.scoredBy)} ratings` : undefined,
  ].filter(Boolean)
  return (
    <ScoreChip
      label="MAL"
      value={mal.score.toFixed(2)}
      description={`MyAnimeList score${details.length ? `, ${details.join(", ")}` : ""}`}
      href={mal.url}
    />
  )
}
