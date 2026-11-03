import { getCurrentUser } from "@/server/session"
import { createUserClient } from "@/server/supabase"

/**
 * "Download my data": everything AniRadar stores about you, as JSON. Read
 * with your own session, so row-level security guarantees it's only yours.
 * The AniList token is never included.
 */
export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json(
      { error: "Not signed in" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    )
  }
  const supabase = await createUserClient()
  const [profile, connection] = await Promise.all([
    supabase.from("profiles").select("*").maybeSingle(),
    supabase
      .from("anilist_connections")
      .select(
        "anilist_user_id, anilist_name, score_format, expires_at, connected_at",
      )
      .maybeSingle(),
  ])

  const data = {
    exportedAt: new Date().toISOString(),
    account: {
      id: user.id,
      email: user.email ?? null,
      createdAt: user.created_at,
      lastSignInAt: user.last_sign_in_at ?? null,
      signInMethods: (user.identities ?? []).map(
        (identity) => identity.provider,
      ),
    },
    settings: profile.data ?? null,
    anilistConnection: connection.data ?? null,
  }
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": 'attachment; filename="aniradar-data.json"',
      "Cache-Control": "no-store",
    },
  })
}
