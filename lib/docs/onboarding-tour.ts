import type { ComponentDoc } from "./types"

export const onboardingTourDoc: ComponentDoc = {
  exports: [
    {
      name: "TourProvider",
      props: [
        {
          name: "steps",
          type: "TourStep[]",
          description: "The tour, in order. Required. A step needs a string `id` and a string `target`. The rest are dropped with a dev warning, and steps whose selector matches nothing are skipped at runtime.",
        },
        {
          name: "storageKey",
          type: "string",
          description: "localStorage key for \"this tour is done\". With it, a finished tour never auto-starts again. Without it, nothing is remembered and every `start()` runs the tour.",
        },
        {
          name: "children",
          type: "React.ReactNode",
          description: "Your app. It renders normally, and the overlay and step popover mount alongside it only while the tour is active.",
        },
      ],
    },
    {
      name: "TourStep",
      props: [
        {
          name: "id",
          type: "string",
          description: "React key and the name used in warnings. Required and unique.",
        },
        {
          name: "target",
          type: "string",
          description: "CSS selector, resolved with `document.querySelector` when the step is entered. A selector that matches nothing skips the step. A malformed one is treated as no match rather than a crash.",
        },
        {
          name: "title",
          type: "string",
          description: "Popover heading, and the step's accessible name.",
        },
        {
          name: "content",
          type: "React.ReactNode",
          description: "Popover body, either text or whatever else you want to render, and the step's accessible description.",
        },
        {
          name: "side",
          type: '"top" | "right" | "bottom" | "left"',
          default: '"bottom"',
          description: "Preferred side of the highlighted element for the popover. It still flips when there is no room.",
        },
      ],
    },
    {
      name: "useTour",
      props: [
        {
          name: "start",
          type: "(options?: { force?: boolean }) => void",
          description: "Starts at the first step with a live target. Does nothing when the tour is already recorded as completed unless `force` is set. Safe to pass straight to `onClick`, since a DOM event carries no `force`.",
        },
        {
          name: "stop",
          type: "() => void",
          description: "Ends the tour without recording completion, and returns focus to whatever was focused when it started.",
        },
        {
          name: "next",
          type: "() => void",
          description: "Moves to the next step with a live target. When there is none left it records completion under `storageKey` and ends the tour. No-op while the tour is not running.",
        },
        {
          name: "prev",
          type: "() => void",
          description: "Moves back to the previous step with a live target, and stays put when there is none. No-op while the tour is not running.",
        },
        {
          name: "isActive",
          type: "boolean",
          description: "Whether the tour is running. Useful for hiding your own \"Show me around\" affordance while it is.",
        },
        {
          name: "stepIndex",
          type: "number",
          description: "Index of the current step into the valid steps, which is what the popover's \"Step N of M\" counts.",
        },
        {
          name: "→ returns",
          type: "TourContextValue",
          description: "The controls above, from the nearest `<TourProvider>`. This is the one throw in the component. Called outside a provider it raises \"useTour must be used inside a <TourProvider>.\" rather than handing back a no-op tour.",
        },
      ],
    },
    {
      name: "getSpotlightRect",
      props: [
        {
          name: "targetRect",
          type: "{ top: number; left: number; width: number; height: number }",
          description: "Viewport-space rect of the element to highlight, either a `getBoundingClientRect()` result or anything with those four numbers. Non-finite values are read as zero rather than thrown on.",
        },
        {
          name: "padding",
          type: "number",
          default: "8",
          description: "Breathing room added on every side. A non-finite value falls back to the default.",
        },
        {
          name: "→ returns",
          type: "SpotlightRect",
          description: "`{ x, y, width, height }` rounded to whole pixels and clamped to the viewport origin, so a target hanging off the top or start edge keeps its far edges where they are instead of growing.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "A three-step tour",
      code: `"use client"

import { TourProvider, useTour, type TourStep } from "@/components/ui/onboarding-tour"
import { Button } from "@/components/ui/button"

const STEPS: TourStep[] = [
  {
    id: "search",
    target: "[data-tour='search']",
    title: "Find anything",
    content: "Search across every project from here.",
    side: "bottom",
  },
  {
    id: "new",
    target: "[data-tour='new']",
    title: "Start something",
    content: "New documents land in the current folder.",
  },
  {
    id: "account",
    target: "[data-tour='account']",
    title: "Your account",
    content: "Billing, members and preferences live here.",
    side: "left",
  },
]

function StartTourButton() {
  const { start, isActive } = useTour()
  return (
    <Button onClick={start} disabled={isActive}>
      Show me around
    </Button>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  // storageKey makes it one-and-done: once finished, start() is a no-op.
  return (
    <TourProvider steps={STEPS} storageKey="app-tour">
      {children}
      <StartTourButton />
    </TourProvider>
  )
}`,
    },
    {
      title: "Auto-start once, and a manual replay",
      code: `"use client"

import * as React from "react"
import { useTour } from "@/components/ui/onboarding-tour"
import { Button } from "@/components/ui/button"

export function TourLauncher() {
  const { start } = useTour()

  // Safe to fire on mount: with a storageKey, a completed tour won't run again.
  // Keep the provider's \`steps\` array stable (module-level or memoized). A fresh
  // array every render gives \`start\` a new identity and re-runs this effect.
  React.useEffect(() => {
    start()
  }, [start])

  // force ignores the completion record. It is the "replay the tour" affordance.
  return (
    <Button variant="ghost" onClick={() => start({ force: true })}>
      Replay tour
    </Button>
  )
}`,
    },
    {
      title: "The spotlight geometry alone",
      code: `import { getSpotlightRect } from "@/components/ui/onboarding-tour"

const target = document.querySelector("[data-tour='search']")!
const cutout = getSpotlightRect(target.getBoundingClientRect(), 12)
// → { x, y, width, height }, whole pixels, never negative`,
    },
  ],
  keyboard: [
    {
      keys: "Escape",
      action: "Ends the tour from anywhere on the page, without recording completion, and returns focus to whatever was focused when it started.",
    },
    {
      keys: "Tab / Shift + Tab",
      action: "Moves through the step's Skip, Back and Next buttons. Each step focuses its popover first, so tabbing always starts from the step you are on rather than where the last one left off.",
    },
    {
      keys: "Enter / Space",
      action: "Activates the focused button: Skip ends the tour like Escape, Back and Next move between steps, and Done on the last step records completion and ends it.",
    },
  ],
  errorState:
    "There is no `error` prop. The failure mode is a step that points at nothing, and the tour walks past it instead of breaking. Steps are filtered first. A step must be an object with a string `id` and a string `target`, and duplicates by id are dropped with a dev warning (\"ignoring N step(s) with a missing target or a missing/duplicate id\"). A `steps` prop that is not an array leaves nothing to run. At runtime each move resolves the selector with `document.querySelector`, wrapped so a malformed selector reads as no match rather than throwing: `start` seeks forward for the first step whose target is on the page, `next` and `prev` seek in their direction, and each skipped step warns by selector and id. When no step has a live target at all, `start` warns \"no step has a matching target — nothing to show\" and the tour simply does not open. That is worth knowing when targets render behind a route or a collapsed panel, since a tour that never appears looks like a broken button. Completion is best-effort. The write is wrapped in a `try`/`catch`, so with storage blocked the tour still finishes and just runs again next time, and the read is guarded the same way. `useTour` outside a `<TourProvider>` is the one deliberate throw, because every value it could return would be a lie. The cutout is geometry, not a mask, so the highlighted element really is clickable and everything under the dim area really is not. `getSpotlightRect` reads non-finite numbers as zero, which means a measurement taken before layout collapses the hole rather than producing a NaN path.",
}
