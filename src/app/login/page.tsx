import type { Metadata } from "next"
import Link from "next/link"
import { redirect } from "next/navigation"
import { Suspense } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { EmailSignIn } from "@/features/auth/login-form"
import { getCurrentUser } from "@/server/session"
import { accountsEnabled } from "@/server/supabase"

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false },
}

const ERRORS: Record<string, string> = {
  link: "That sign-in link has expired or was already used. Ask for a new email, or type the code from it.",
  callback: "Sign-in didn't finish. Try again.",
  provider: "Couldn't start that sign-in. Try again, or use email.",
}

async function LoginContent({ searchParams }: PageProps<"/login">) {
  if (!accountsEnabled()) {
    return (
      <p className="text-sm text-muted-foreground">
        Sign-in isn&apos;t set up on this server yet.
      </p>
    )
  }
  if (await getCurrentUser()) redirect("/me")
  const { error } = await searchParams
  const message = typeof error === "string" ? ERRORS[error] : undefined

  return (
    <div className="space-y-6">
      {message ? (
        <p
          role="alert"
          className="rounded-2xl border border-destructive/40 bg-destructive/10 p-3 text-sm"
        >
          {message}
        </p>
      ) : null}
      <div className="grid gap-2">
        <ProviderLink provider="google" label="Continue with Google" />
        <ProviderLink provider="discord" label="Continue with Discord" />
      </div>
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <EmailSignIn />
    </div>
  )
}

function ProviderLink({
  provider,
  label,
}: {
  provider: "google" | "discord"
  label: string
}) {
  return (
    // A real navigation (not client routing): the route redirects onward.
    <a
      href={`/auth/signin/${provider}`}
      className="flex h-11 items-center justify-center rounded-lg border bg-card text-sm font-medium transition-colors hover:bg-accent focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
    >
      {label}
    </a>
  )
}

export default function LoginPage(props: PageProps<"/login">) {
  return (
    <div className="mx-auto max-w-sm space-y-6 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted-foreground">
          Your settings follow you, and you can connect your AniList account. No
          password needed.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="space-y-2" aria-hidden="true">
            <Skeleton className="h-11" />
            <Skeleton className="h-11" />
            <Skeleton className="mt-6 h-11" />
          </div>
        }
      >
        <LoginContent {...props} />
      </Suspense>
      <p className="text-xs text-muted-foreground">
        By signing in you agree to how we handle your data, described in the{" "}
        <Link href="/privacy" className="underline underline-offset-2">
          privacy policy
        </Link>
        .
      </p>
    </div>
  )
}
