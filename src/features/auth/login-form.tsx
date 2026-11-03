"use client"

import { LoaderCircleIcon, MailIcon } from "lucide-react"
import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  sendEmailCode,
  verifyEmailCode,
  type EmailStep,
} from "@/server/auth-actions"

/**
 * Email sign-in in two steps: send a code, then type it. The same email
 * also has a link, but on a phone the installed app doesn't share cookies
 * with the browser, so the code is the dependable way in.
 */
export function EmailSignIn() {
  const [sent, send, sending] = useActionState<EmailStep, FormData>(
    sendEmailCode,
    { step: "email" },
  )
  const [checked, verify, verifying] = useActionState<EmailStep, FormData>(
    verifyEmailCode,
    { step: "email" },
  )
  const state = checked.step === "code" ? checked : sent

  if (state.step === "email") {
    return (
      <form action={send} className="space-y-3">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          required
          placeholder="you@example.com"
          className="h-11"
          aria-describedby={state.error ? "email-error" : undefined}
        />
        {state.error ? (
          <p id="email-error" role="alert" className="text-sm text-destructive">
            {state.error}
          </p>
        ) : null}
        <Button type="submit" className="h-11 w-full" disabled={sending}>
          {sending ? (
            <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          ) : (
            <MailIcon aria-hidden="true" />
          )}
          Email me a sign-in code
        </Button>
      </form>
    )
  }

  return (
    <form action={verify} className="space-y-3">
      <input type="hidden" name="email" value={state.email} />
      <p className="text-sm">
        We sent a sign-in code to{" "}
        <span className="font-medium">{state.email}</span>.
      </p>
      <label htmlFor="code" className="text-sm font-medium">
        Code
      </label>
      <Input
        id="code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[\d\s]{6,14}"
        maxLength={14}
        required
        autoFocus
        placeholder="12345678"
        className="h-11 text-center text-lg tracking-[0.4em]"
        aria-describedby={state.error ? "code-error" : undefined}
      />
      {state.error ? (
        <p id="code-error" role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <Button type="submit" className="h-11 w-full" disabled={verifying}>
        {verifying ? (
          <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
        ) : null}
        Sign in
      </Button>
      <p className="text-xs text-muted-foreground">
        No email? Check spam, or reload this page to try another address.
      </p>
    </form>
  )
}
