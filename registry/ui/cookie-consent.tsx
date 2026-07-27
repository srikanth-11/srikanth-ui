"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

const DEFAULT_STORAGE_KEY = "cookie-consent"
const DEFAULT_VERSION = 1

interface CookieCategory {
  id: string
  label: string
  description?: string
  /** Locked on: always emitted as `true` and not togglable. */
  required?: boolean
}

type Consent = Record<string, boolean>

/**
 * Reads the persisted consent, or null when there is none, when it was saved
 * under a different `version`, or when storage is unavailable/corrupt.
 * Safe to call on the server (returns null) and never throws.
 */
function getStoredConsent(
  storageKey: string = DEFAULT_STORAGE_KEY,
  version: number = DEFAULT_VERSION
): Consent | null {
  try {
    // `globalThis.localStorage` is undefined on the server, and the getter
    // itself throws in browsers with storage blocked — hence the try/catch.
    const raw = globalThis.localStorage?.getItem(storageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.version !== version) return null
    // Anything hand-edited or written by another library is untrusted:
    // require a plain object of booleans rather than trusting `typeof "object"`,
    // which also admits arrays and null.
    const consent = parsed.consent
    if (typeof consent !== "object" || consent === null || Array.isArray(consent)) return null
    if (!Object.values(consent).every((v) => typeof v === "boolean")) return null
    return consent as Consent
  } catch {
    return null
  }
}

// Consent is always reported per declared category: required ones forced on,
// anything missing (or left over from a stale payload) resolved to a boolean.
function normalize(categories: CookieCategory[], consent: Consent): Consent {
  return Object.fromEntries(
    categories.map((c) => [c.id, c.required ? true : consent[c.id] === true])
  )
}

interface CookieConsentProps extends React.ComponentProps<"div"> {
  categories: CookieCategory[]
  /** Fires on save and, when consent is already stored, once on mount. */
  onConsent?: (consent: Consent) => void
  storageKey?: string
  /** Bump to invalidate stored consent and re-prompt. */
  version?: number
  policyHref?: string
}

function CookieConsent({
  categories,
  onConsent,
  storageKey = DEFAULT_STORAGE_KEY,
  version = DEFAULT_VERSION,
  policyHref,
  className,
  ...props
}: CookieConsentProps) {
  const fieldId = React.useId()
  const [visible, setVisible] = React.useState(false)
  const [open, setOpen] = React.useState(false)
  const [draft, setDraft] = React.useState<Consent>({})

  // Props read from the mount effect below without re-triggering it: an inline
  // `categories` array or arrow `onConsent` would otherwise replay consent on
  // every render.
  const latest = React.useRef({ categories, onConsent })
  React.useEffect(() => {
    latest.current = { categories, onConsent }
  })

  // Which (storageKey, version) pair has already been replayed to `onConsent`.
  // StrictMode's dev double-mount re-runs the effect with the same pair, and
  // consumers wire this to one-shot side effects like initGA() — so replay is
  // keyed on the pair rather than a bare "did it once" flag, which would also
  // swallow the legitimate replay after a genuine storageKey/version change.
  const replayed = React.useRef<string | null>(null)

  // Storage is read here and never during render: the server has no storage, so
  // a render-time read would hydrate-mismatch. The banner starts hidden and
  // appears once the client confirms there is no valid consent — the one extra
  // render this costs is the point of the pattern, hence the rule exemption.
  React.useEffect(() => {
    const stored = getStoredConsent(storageKey, version)
    const stamp = JSON.stringify([storageKey, version])
    if (stored && replayed.current !== stamp) {
      replayed.current = stamp
      latest.current.onConsent?.(normalize(latest.current.categories, stored))
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage is a client-only external store; reading it during render breaks hydration
    setVisible(!stored)
  }, [storageKey, version])

  const commit = (consent: Consent) => {
    const next = normalize(categories, consent)
    try {
      globalThis.localStorage?.setItem(
        storageKey,
        JSON.stringify({ version, timestamp: Date.now(), consent: next })
      )
    } catch {
      // Storage blocked — the choice still applies for this session.
    }
    setOpen(false)
    setVisible(false)
    onConsent?.(next)
  }

  const policyLink = policyHref ? (
    <>
      {" "}
      <a href={policyHref} className="underline underline-offset-3">
        Cookie Policy
      </a>
      .
    </>
  ) : null

  return (
    <>
      {visible && (
        <div
          role="region"
          aria-label="Cookie consent"
          className={cn("fixed inset-x-0 bottom-0 z-50 p-4", className)}
          {...props}
        >
          <Card className="mx-auto max-w-3xl">
            <CardHeader>
              <CardTitle>Cookies</CardTitle>
              <CardDescription>
                We use cookies to run this site and, with your permission, to improve
                it.{policyLink}
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="ghost"
                className="sm:me-auto"
                onClick={() => {
                  // The banner only renders when there is no valid stored
                  // consent, so the draft always starts from the defaults:
                  // required on, everything else off.
                  setDraft(normalize(categories, {}))
                  setOpen(true)
                }}
              >
                Preferences
              </Button>
              <Button variant="outline" onClick={() => commit({})}>
                Reject non-required
              </Button>
              <Button onClick={() => commit(Object.fromEntries(categories.map((c) => [c.id, true])))}>
                Accept all
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cookie preferences</DialogTitle>
            <DialogDescription>
              Choose which cookies we may use.{policyLink}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {categories.map((c) => {
              const id = `${fieldId}-${c.id}`
              return (
                <div key={c.id} className="flex items-start justify-between gap-4">
                  <div className="grid gap-1 text-start">
                    <Label htmlFor={id}>{c.label}</Label>
                    {c.description && (
                      <p id={`${id}-description`} className="text-muted-foreground text-xs">
                        {c.description}
                      </p>
                    )}
                  </div>
                  <Switch
                    id={id}
                    checked={c.required ? true : draft[c.id] === true}
                    disabled={c.required}
                    aria-describedby={c.description ? `${id}-description` : undefined}
                    onCheckedChange={(checked) =>
                      setDraft((prev) => ({ ...prev, [c.id]: checked }))
                    }
                  />
                </div>
              )
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => commit(draft)}>Save preferences</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

export { CookieConsent, getStoredConsent, type CookieCategory }
