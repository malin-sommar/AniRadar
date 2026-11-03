import { CircleCheckIcon, LinkIcon, LogInIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import type { Preferences } from "@/lib/preferences"
import { disconnectAniListAction } from "@/server/account-actions"
import { anilistOAuthConfig } from "@/server/anilist-account"
import { signOut } from "@/server/auth-actions"
import { getCurrentUser } from "@/server/session"
import { accountsEnabled, createUserClient } from "@/server/supabase"

import { DeleteAccount, ProfileSync } from "./account-panels"

/** Remind you this long before the AniList connection expires. */
const EXPIRY_WARNING_DAYS = 14

const ANILIST_MESSAGES: Record<string, string> = {
  connected: "AniList is connected.",
  disconnected:
    "AniList is disconnected and its token deleted. You can also revoke AniRadar under Settings → Apps on AniList.",
  denied: "You didn't approve AniRadar on AniList, so nothing changed.",
  expired: "That took too long or came from another session. Try again.",
  exchange: "AniList didn't accept the sign-in. Try again in a minute.",
  viewer: "Couldn't read your AniList account. Try again in a minute.",
  taken:
    "That AniList account is already connected to another AniRadar account.",
  save: "Couldn't save the connection. Try again.",
  unavailable: "Connecting AniList isn't set up on this server yet.",
}

const SCORE_FORMATS: Record<string, string> = {
  POINT_100: "100-point",
  POINT_10_DECIMAL: "10-point decimal",
  POINT_10: "10-point",
  POINT_5: "5 stars",
  POINT_3: "3 smileys",
}

const dateFormat = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium" })

/** Whole days from now (this renders per request, so "now" is fine). */
function daysUntil(date: Date): number {
  return Math.floor((date.getTime() - Date.now()) / 86_400_000)
}

function Card({
  id,
  title,
  children,
}: {
  id: string
  title: string
  children: ReactNode
}) {
  return (
    <section
      aria-labelledby={id}
      className="space-y-4 rounded-3xl border bg-card p-5"
    >
      <h2 id={id} className="font-medium">
        {title}
      </h2>
      {children}
    </section>
  )
}

/**
 * Account, AniList connection and your data. Renders per request (it
 * reads your session), inside a Suspense boundary.
 */
export async function AccountSection({
  anilistStatus,
}: {
  anilistStatus?: string
}) {
  if (!accountsEnabled()) {
    return (
      <Card id="account-title" title="Account">
        <p className="text-sm text-muted-foreground">
          Sign-in isn&apos;t set up on this server yet.
        </p>
      </Card>
    )
  }

  const user = await getCurrentUser()
  if (!user) {
    return (
      <Card id="account-title" title="Account">
        <p className="text-sm text-muted-foreground">
          Sign in to keep your settings on every device and to connect your
          AniList account.
        </p>
        <Button asChild>
          <Link href="/login">
            <LogInIcon aria-hidden="true" />
            Sign in
          </Link>
        </Button>
      </Card>
    )
  }

  const supabase = await createUserClient()
  const [{ data: profile }, { data: connection }] = await Promise.all([
    supabase
      .from("profiles")
      .select("title_language, show_adult")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("anilist_connections")
      .select("anilist_name, score_format, expires_at")
      .eq("user_id", user.id)
      .maybeSingle(),
  ])
  const providers = [
    ...new Set((user.identities ?? []).map((identity) => identity.provider)),
  ]
  const expiresAt = connection ? new Date(connection.expires_at) : null
  const daysLeft = expiresAt ? daysUntil(expiresAt) : null
  const message = anilistStatus ? ANILIST_MESSAGES[anilistStatus] : undefined

  return (
    <>
      {profile ? (
        <ProfileSync
          profile={{
            titleLanguage:
              profile.title_language as Preferences["titleLanguage"],
            showAdult: profile.show_adult,
          }}
        />
      ) : null}

      <Card id="account-title" title="Account">
        <div className="text-sm">
          <p>
            Signed in as <span className="font-medium">{user.email}</span>
          </p>
          {providers.length > 0 ? (
            <p className="text-muted-foreground">
              Sign-in methods: {providers.join(", ")}
            </p>
          ) : null}
        </div>
        <form action={signOut} className="flex flex-wrap gap-2">
          <Button type="submit" variant="secondary" name="scope" value="local">
            Sign out
          </Button>
          <Button type="submit" variant="ghost" name="scope" value="global">
            Sign out on all devices
          </Button>
        </form>
      </Card>

      <Card id="anilist-title" title="AniList">
        {message ? (
          <p role="status" className="rounded-2xl bg-muted p-3 text-sm">
            {message}
          </p>
        ) : null}
        {connection ? (
          <>
            <div className="flex items-start gap-2 text-sm">
              <CircleCheckIcon
                className="mt-0.5 size-4 shrink-0 text-airing"
                aria-hidden="true"
              />
              <div>
                <p>
                  Connected as{" "}
                  <a
                    href={`https://anilist.co/user/${encodeURIComponent(connection.anilist_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {connection.anilist_name}
                  </a>
                </p>
                <p className="text-muted-foreground">
                  Score format:{" "}
                  {SCORE_FORMATS[connection.score_format] ??
                    connection.score_format}
                  {expiresAt
                    ? ` · Connection valid until ${dateFormat.format(expiresAt)}`
                    : null}
                </p>
              </div>
            </div>
            {daysLeft !== null && daysLeft <= EXPIRY_WARNING_DAYS ? (
              <p role="alert" className="rounded-2xl bg-muted p-3 text-sm">
                {daysLeft < 0
                  ? "Your AniList connection has expired. Reconnect to keep tracking."
                  : `Your AniList connection expires in ${daysLeft} days. Reconnect to keep tracking.`}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="secondary">
                <a href="/auth/anilist/start">Reconnect</a>
              </Button>
              <form action={disconnectAniListAction}>
                <Button type="submit" variant="ghost">
                  Disconnect
                </Button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Connect your AniList account to track shows, rate them and see
              your list here. AniRadar keeps the access AniList gives it
              encrypted on the server, and you can disconnect at any time.
            </p>
            {anilistOAuthConfig() ? (
              <Button asChild>
                {/* A full navigation: the route redirects to AniList. */}
                <a href="/auth/anilist/start">
                  <LinkIcon aria-hidden="true" />
                  Connect AniList
                </a>
              </Button>
            ) : (
              <p className="text-sm text-muted-foreground">
                Connecting AniList isn&apos;t set up on this server yet.
              </p>
            )}
          </>
        )}
      </Card>

      <Card id="data-title" title="Your data">
        <p className="text-sm text-muted-foreground">
          See exactly what AniRadar stores about you, or delete all of it. The{" "}
          <Link href="/privacy" className="underline underline-offset-2">
            privacy policy
          </Link>{" "}
          explains the details.
        </p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="secondary">
            <a href="/api/me/export" download>
              Download my data
            </a>
          </Button>
        </div>
        <DeleteAccount />
      </Card>
    </>
  )
}

export function AccountSkeleton() {
  return (
    <div className="space-y-8" aria-hidden="true">
      <Skeleton className="h-36 rounded-3xl" />
      <Skeleton className="h-40 rounded-3xl" />
    </div>
  )
}
