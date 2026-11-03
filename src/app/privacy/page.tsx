import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Privacy",
  description: "What AniRadar stores about you, why, and how to remove it.",
}

const LAST_UPDATED = "3 November 2026"

/** A plain-language privacy policy (PLAN.md §13). */
export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-prose space-y-6 py-4 text-[15px] leading-relaxed [&_h2]:pt-2 [&_h2]:text-lg [&_h2]:font-semibold [&_li]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Privacy</h1>
        <p className="text-sm text-muted-foreground">
          Last updated {LAST_UPDATED}
        </p>
      </header>

      <p>
        AniRadar is a personal, non-commercial project for tracking anime with
        your AniList account. It stores as little as it can, has no ads, no
        analytics and no tracking.
      </p>

      <h2>Who is responsible</h2>
      <p>
        Malin Sommar is the data controller. Questions or requests:{" "}
        <a
          href="mailto:malinsommar1997@gmail.com"
          className="underline underline-offset-2"
        >
          malinsommar1997@gmail.com
        </a>
        .
      </p>

      <h2>What we store, and why</h2>
      <p>Only if you create an account:</p>
      <ul>
        <li>
          Your email address and how you sign in (email, Google or Discord), so
          you can sign in.
        </li>
        <li>
          Your settings (title language, adult content, time zone), so they
          follow you between devices.
        </li>
        <li>
          If you connect AniList: your AniList user ID and name, your score
          format, and the access AniList gives AniRadar (encrypted, server
          only), so AniRadar can show and update your list.
        </li>
        <li>
          Later features (series you follow, notifications, calendar) store
          AniList IDs and your choices for them, never copies of anime data.
        </li>
      </ul>
      <p>
        The legal basis is providing the service you asked for (GDPR article
        6(1)(b)). Without an account, AniRadar stores nothing about you on its
        servers; your theme and settings stay in your browser.
      </p>

      <h2>Cookies and storage on your device</h2>
      <ul>
        <li>A sign-in cookie, while you&apos;re signed in.</li>
        <li>
          A short-lived cookie (10 minutes) while you connect AniList, to make
          sure the answer comes back to you.
        </li>
        <li>
          Your theme, settings and a cache of anime data in your browser&apos;s
          own storage, for speed and offline use.
        </li>
      </ul>
      <p>These are all strictly necessary, so there&apos;s no cookie banner.</p>

      <h2>Who processes the data, and where</h2>
      <ul>
        <li>
          <strong>Supabase</strong> stores accounts and settings in the EU
          (Stockholm), under a data processing agreement.
        </li>
        <li>
          <strong>Vercel</strong> hosts the app, with servers in the EU
          (Stockholm); Vercel is a US company and covers transfers in its data
          processing agreement.
        </li>
        <li>
          <strong>Google</strong> or <strong>Discord</strong>, only if you sign
          in with them.
        </li>
        <li>
          <strong>Google (Gmail)</strong> sends the sign-in emails, so it
          handles your email address when you sign in by email.
        </li>
        <li>
          <strong>AniList</strong>, through your own account, once you connect
          it.
        </li>
      </ul>
      <p>
        Anime data and images from AniList, Kitsu and MyAnimeList (via Jikan)
        are fetched by AniRadar&apos;s server, so your browser only talks to
        AniRadar. Trailers load from YouTube only when you press play.
      </p>

      <h2>How long we keep it</h2>
      <p>
        Your account data stays until you delete your account. Supabase and
        Vercel keep logs and backups for the periods they document.
      </p>

      <h2>Your rights</h2>
      <ul>
        <li>
          <strong>See your data:</strong> &ldquo;Download my data&rdquo; on the{" "}
          <Link href="/me" className="underline underline-offset-2">
            Me
          </Link>{" "}
          page gives you everything we store, as a file.
        </li>
        <li>
          <strong>Delete it:</strong> &ldquo;Delete my account&rdquo; on the
          same page removes your account and everything stored with it, at once.
          You can also revoke AniRadar under Settings → Apps on AniList.
        </li>
        <li>
          You can ask for corrections, object, or ask any question by email. You
          can also complain to your data protection authority (in Sweden, IMY).
        </li>
      </ul>
    </article>
  )
}
