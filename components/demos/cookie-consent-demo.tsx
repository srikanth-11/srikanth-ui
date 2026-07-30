"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { CookieConsent } from "@/registry/ui/cookie-consent"

const STORAGE_KEY = "srikanth-ui-demo-consent"

const CATEGORIES = [
  { id: "necessary", label: "Necessary", description: "Required for the site to work.", required: true },
  { id: "analytics", label: "Analytics", description: "Anonymous usage stats." },
  { id: "marketing", label: "Marketing", description: "Personalised ads." },
]

export function CookieConsentDemo() {
  // A consent banner that remembers is right in an app and wrong in a demo: once a
  // visitor has answered, every later mount renders nothing at all. The gallery
  // card mounts this preview inert, so the "Reset stored consent" button below
  // can't be clicked from there — the card would just be an empty box. Forget the
  // answer per mount, not per page load: the gallery unmounts and remounts these
  // cards as the filters change, with no reload in between. A lazy initialiser is
  // where that belongs — this render runs before the CookieConsent below mounts
  // and reads storage, which a parent effect would not. Within one mount the
  // choice still sticks, which is the part worth showing.
  React.useState(() => {
    if (typeof window !== "undefined") localStorage.removeItem(STORAGE_KEY)
  })

  // Bumped by Reset: the banner reads storage once on mount, so a remount is
  // what brings it back after a choice has been stored.
  const [round, setRound] = React.useState(0)
  const [consent, setConsent] = React.useState<Record<string, boolean> | null>(null)

  return (
    <div className="w-full space-y-2">
      <div className="bg-muted/40 relative h-56 overflow-hidden rounded-lg border">
        <CookieConsent
          key={round}
          categories={CATEGORIES}
          storageKey={STORAGE_KEY}
          onConsent={setConsent}
          // Real apps keep the default `fixed`; `absolute` pins it inside this
          // card instead. The footer's `sm:flex-row` keys off the viewport, which
          // is the wrong signal for a fixed-height box — forced back to a wrapping
          // row so three stacked buttons can't push the title out of the frame.
          className="absolute [&_[data-slot=card-footer]]:flex-row [&_[data-slot=card-footer]]:flex-wrap"
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            setConsent(null)
            setRound((r) => r + 1)
          }}
        >
          Reset stored consent
        </Button>
        <p className="text-muted-foreground font-mono text-xs">
          {consent
            ? Object.keys(consent)
                .filter((id) => consent[id])
                .join(", ")
            : "no choice yet"}
        </p>
      </div>
    </div>
  )
}
