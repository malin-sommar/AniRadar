"use client"

import { LoaderCircleIcon, TriangleAlertIcon } from "lucide-react"
import { useActionState, useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  applyProfilePreferences,
  setProfileSync,
} from "@/hooks/use-preferences"
import type { Preferences } from "@/lib/preferences"
import { KNOWN_SERVICES } from "@/domain/streaming"
import { cn } from "@/lib/utils"
import {
  deleteAccount,
  saveMyServices,
  savePreferences,
  type DeleteState,
} from "@/server/account-actions"

/**
 * While you're signed in, your profile's settings apply on this device,
 * and changes you make here are saved to the profile.
 */
export function ProfileSync({ profile }: { profile: Preferences }) {
  useEffect(() => {
    applyProfilePreferences(profile)
    setProfileSync((changes) => void savePreferences(changes))
    return () => setProfileSync(null)
  }, [profile])
  return null
}

/** Toggles for your streaming services; each change is saved right away. */
export function MyServicesPicker({ initial }: { initial: string[] }) {
  const [services, setServices] = useState(initial)
  const [failed, setFailed] = useState(false)
  // Services saved earlier that the list below doesn't know stay chosen.
  const options = [
    ...KNOWN_SERVICES,
    ...initial.filter(
      (s) => !(KNOWN_SERVICES as readonly string[]).includes(s),
    ),
  ]

  function toggle(service: string) {
    const next = services.includes(service)
      ? services.filter((s) => s !== service)
      : [...services, service]
    setServices(next)
    void saveMyServices(next).then((saved) => setFailed(!saved))
  }

  return (
    <div className="space-y-2">
      <div
        role="group"
        aria-label="My services"
        className="flex flex-wrap gap-2"
      >
        {options.map((service) => {
          const on = services.includes(service)
          return (
            <button
              key={service}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(service)}
              className={cn(
                "inline-flex h-8 items-center rounded-full border px-3 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
                on
                  ? "border-primary bg-primary/15 font-medium"
                  : "hover:bg-accent",
              )}
            >
              {service}
            </button>
          )
        })}
      </div>
      {failed ? (
        <p role="alert" className="text-sm text-destructive">
          Couldn&apos;t save that. Try again.
        </p>
      ) : null}
    </div>
  )
}

/** Wipes everything AniRadar keeps on this device. */
async function clearDevice() {
  try {
    localStorage.clear()
    sessionStorage.clear()
  } catch {
    // Storage may be blocked; nothing to clear then.
  }
  try {
    indexedDB.deleteDatabase("keyval-store")
  } catch {
    // Same.
  }
  try {
    const keys = await caches.keys()
    await Promise.all(keys.map((key) => caches.delete(key)))
  } catch {
    // No Cache Storage (or blocked).
  }
}

/** "Delete my account": type DELETE, then everything goes. */
export function DeleteAccount() {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState<DeleteState, FormData>(
    deleteAccount,
    { status: "idle" },
  )

  useEffect(() => {
    if (state.status !== "deleted") return
    // A full reload, so nothing from the deleted account stays in memory.
    void clearDevice().then(() =>
      window.location.assign(new URL("/?deleted=1", window.location.origin)),
    )
  }, [state.status])

  if (!open) {
    return (
      <Button variant="destructive" onClick={() => setOpen(true)}>
        Delete my account
      </Button>
    )
  }

  return (
    <form
      action={action}
      className="space-y-3 rounded-2xl border border-destructive/50 p-4"
    >
      <p className="flex gap-2 text-sm">
        <TriangleAlertIcon
          className="mt-0.5 size-4 shrink-0 text-destructive"
          aria-hidden="true"
        />
        This deletes your AniRadar account and everything stored with it, and
        clears AniRadar from this device. Your list on AniList stays as it is.
        It can&apos;t be undone.
      </p>
      <label htmlFor="confirm-delete" className="text-sm font-medium">
        Type DELETE to confirm
      </label>
      <Input
        id="confirm-delete"
        name="confirm"
        autoComplete="off"
        autoCapitalize="characters"
        required
        aria-describedby={state.status === "error" ? "delete-error" : undefined}
      />
      {state.status === "error" ? (
        <p id="delete-error" role="alert" className="text-sm text-destructive">
          {state.message}
        </p>
      ) : null}
      <div className="flex gap-2">
        <Button type="submit" variant="destructive" disabled={pending}>
          {pending ? (
            <LoaderCircleIcon className="animate-spin" aria-hidden="true" />
          ) : null}
          Delete everything
        </Button>
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
