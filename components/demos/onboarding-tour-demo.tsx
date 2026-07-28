"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { TourProvider, useTour, type TourStep } from "@/registry/ui/onboarding-tour"

// Targets live inside this demo's own card and are prefixed, so the spotlight finds
// them on the landing page and the docs page alike without colliding with the rest
// of the page.
const STEPS: TourStep[] = [
  {
    id: "search",
    target: "#tour-demo-search",
    title: "Find anything",
    content: "Search across projects, issues and people. The spotlight is click-through — type in it.",
  },
  {
    id: "filters",
    target: "#tour-demo-filters",
    title: "Narrow it down",
    content: "Filters stack, and the set you land on is kept in the URL.",
    side: "bottom",
  },
  {
    id: "invite",
    target: "#tour-demo-invite",
    title: "Bring the team",
    content: "Invite teammates once the board looks the way you want it.",
    side: "top",
  },
]

function TourControls() {
  const { start } = useTour()
  // The overlay covers this button while a tour is running, by design — restart is
  // for after Done or Skip. No storageKey here so the demo always replays; a real
  // onboarding passes one and runs once per user.
  const [ran, setRan] = React.useState(false)
  return (
    <Button
      size="sm"
      onClick={() => {
        setRan(true)
        start()
      }}
    >
      {ran ? "Restart tour" : "Start tour"}
    </Button>
  )
}

export function OnboardingTourDemo() {
  return (
    <TourProvider steps={STEPS}>
      <div className="w-full max-w-sm space-y-3 rounded-lg border p-3">
        <Input id="tour-demo-search" placeholder="Search projects…" />
        <div className="flex items-center gap-2">
          <Button id="tour-demo-filters" variant="outline" size="sm">
            Filters
          </Button>
          <Button id="tour-demo-invite" variant="outline" size="sm">
            Invite
          </Button>
          <div className="ms-auto">
            <TourControls />
          </div>
        </div>
      </div>
    </TourProvider>
  )
}
