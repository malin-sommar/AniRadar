import { connection } from "next/server"

import { getServerAniListSnapshot } from "@/lib/anilist/server"
import { clientEnv } from "@/lib/env/client"

/** Server-side numbers for the debug panel. Off in production unless enabled. */
export async function GET() {
  await connection()
  if (
    process.env.NODE_ENV !== "development" &&
    !clientEnv.NEXT_PUBLIC_DEBUG_PANEL
  ) {
    return new Response("Not found", { status: 404 })
  }
  return Response.json(getServerAniListSnapshot(), {
    headers: { "Cache-Control": "no-store" },
  })
}
