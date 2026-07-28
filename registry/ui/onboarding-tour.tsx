"use client"

import * as React from "react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover"

const PADDING = 8

interface TourStep {
  id: string
  /** CSS selector, resolved with `document.querySelector` when the step is entered. */
  target: string
  title: string
  content: React.ReactNode
  /** Which side of the target the popover prefers. Default `"bottom"`. */
  side?: "top" | "right" | "bottom" | "left"
}

interface SpotlightRect {
  x: number
  y: number
  width: number
  height: number
}

const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) ? value : 0

/**
 * Viewport-space cutout for `targetRect`: padded on every side, rounded to whole
 * pixels, and clamped to the viewport origin — a target hanging off the top or
 * start edge keeps its far edges where they are instead of growing.
 *
 * Pure, and the only geometry in this file, so the maths is testable without a
 * layout engine. Non-finite input is read as zero rather than thrown on.
 */
function getSpotlightRect(
  targetRect: { top: number; left: number; width: number; height: number },
  padding: number = PADDING
): SpotlightRect {
  const pad = typeof padding === "number" && Number.isFinite(padding) ? padding : PADDING
  const left = finite(targetRect?.left)
  const top = finite(targetRect?.top)
  const x = Math.max(0, Math.round(left - pad))
  const y = Math.max(0, Math.round(top - pad))
  return {
    x,
    y,
    width: Math.max(0, Math.round(left + finite(targetRect?.width) + pad) - x),
    height: Math.max(0, Math.round(top + finite(targetRect?.height) + pad) - y),
  }
}

const ZERO: SpotlightRect = { x: 0, y: 0, width: 0, height: 0 }

/**
 * Path for the dim overlay: a box larger than any viewport, minus a rounded
 * cutout, as one `fill-rule="evenodd"` shape.
 *
 * The hole has to be part of the geometry, not a `<mask>`: a mask only hides
 * paint, and Chromium still hit-tests the masked-out area — the spotlighted
 * element would look exposed but swallow every click. An even-odd hole is a
 * real hole for painting and pointer events alike.
 */
function spotlightPath({ x, y, width, height }: SpotlightRect, radius = PADDING): string {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2))
  const arc = `a${r},${r} 0 0 1`
  return (
    `M0,0H99999V99999H0Z` +
    `M${x + r},${y}h${width - 2 * r}${arc} ${r},${r}v${height - 2 * r}${arc} ${-r},${r}` +
    `h${2 * r - width}${arc} ${-r},${-r}v${2 * r - height}${arc} ${r},${-r}Z`
  )
}

// Radix only calls `getBoundingClientRect()` on its anchor, so a plain object is
// enough — DOMRect's class identity is never used.
function toDomRect({ x, y, width, height }: SpotlightRect): DOMRect {
  const rect = {
    x,
    y,
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
  }
  return { ...rect, toJSON: () => rect } as DOMRect
}

function findTarget(selector: string): Element | null {
  try {
    // A malformed selector throws in querySelector — bad data, not a crash.
    return document.querySelector(selector)
  } catch {
    return null
  }
}

function isCompleted(storageKey?: string) {
  if (!storageKey) return false
  try {
    // Storage is absent on the server and the getter itself throws in browsers
    // with storage blocked — either way the tour simply runs.
    const raw = globalThis.localStorage?.getItem(storageKey)
    return !!raw && JSON.parse(raw)?.completed === true
  } catch {
    return false
  }
}

const prefersReducedMotion = () =>
  globalThis.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true

const warn = (message: string) => {
  if (process.env.NODE_ENV !== "production") console.warn(message)
}

interface TourContextValue {
  /** Starts at the first step with a live target. No-op once completed, unless forced. */
  start: (options?: { force?: boolean }) => void
  /** Ends the tour without recording completion, and restores focus. */
  stop: () => void
  /** Advances, or finishes the tour (recording completion) when there is nothing left. */
  next: () => void
  prev: () => void
  isActive: boolean
  stepIndex: number
}

const TourContext = React.createContext<TourContextValue | null>(null)

function useTour(): TourContextValue {
  const context = React.useContext(TourContext)
  if (!context) {
    // The one throw in this file: without a provider there is no tour to drive,
    // and every value this hook could return would be a lie.
    throw new Error("useTour must be used inside a <TourProvider>.")
  }
  return context
}

interface TourProviderProps {
  steps: TourStep[]
  /** When set, a finished tour is remembered in localStorage and won't run again. */
  storageKey?: string
  children?: React.ReactNode
}

function TourProvider({ steps, storageKey, children }: TourProviderProps) {
  const [isActive, setIsActive] = React.useState(false)
  const [stepIndex, setStepIndex] = React.useState(0)
  const [rect, setRect] = React.useState<SpotlightRect | null>(null)
  // State, not a ref: the popover is portalled and mounts a commit after the tour
  // starts, so focusing it has to wait for the node to actually arrive.
  const [content, setContent] = React.useState<HTMLElement | null>(null)
  const returnFocusRef = React.useRef<HTMLElement | null>(null)
  const titleId = React.useId()
  const descriptionId = React.useId()

  // Bad steps are dropped, never thrown on: a step needs an id and a selector,
  // and ids must be unique so React keys and warnings stay meaningful.
  const validSteps = React.useMemo(() => {
    const source = Array.isArray(steps) ? steps : []
    const seen = new Set<string>()
    const dropped: string[] = []
    const kept = source.filter((step) => {
      const ok =
        !!step &&
        typeof step.id === "string" &&
        typeof step.target === "string" &&
        !seen.has(step.id)
      if (ok) seen.add(step.id)
      else dropped.push(step?.id ?? "<no id>")
      return ok
    })
    if (dropped.length > 0) {
      warn(
        `Tour: ignoring ${dropped.length} step(s) with a missing target or a missing/duplicate id: ${dropped.join(", ")}`
      )
    }
    return kept.length === source.length ? (source as TourStep[]) : kept
  }, [steps])

  const step = validSteps[stepIndex]
  const target = step?.target
  const isLast = stepIndex === validSteps.length - 1

  /** First index from `from` (inclusive) whose target is on the page, or -1. */
  const seek = React.useCallback(
    (from: number, direction: 1 | -1) => {
      for (let i = from; i >= 0 && i < validSteps.length; i += direction) {
        if (findTarget(validSteps[i].target)) return i
        warn(
          `Tour: no element matches "${validSteps[i].target}" — skipping step "${validSteps[i].id}".`
        )
      }
      return -1
    },
    [validSteps]
  )

  const stop = React.useCallback(() => {
    setIsActive(false)
    setRect(null)
    const returnTo = returnFocusRef.current
    returnFocusRef.current = null
    if (returnTo?.isConnected) returnTo.focus()
  }, [])

  const start = React.useCallback(
    // Tolerates being passed straight to onClick: a DOM event has no `force`.
    (options?: { force?: boolean }) => {
      if (!options?.force && isCompleted(storageKey)) return
      const index = seek(0, 1)
      if (index === -1) {
        warn("Tour: no step has a matching target — nothing to show.")
        return
      }
      const active = document.activeElement
      returnFocusRef.current = active instanceof HTMLElement ? active : null
      setStepIndex(index)
      setIsActive(true)
    },
    [seek, storageKey]
  )

  const next = React.useCallback(() => {
    if (!isActive) return
    const index = seek(stepIndex + 1, 1)
    if (index !== -1) {
      setStepIndex(index)
      return
    }
    if (storageKey) {
      try {
        globalThis.localStorage?.setItem(storageKey, JSON.stringify({ completed: true }))
      } catch {
        // Storage blocked — the tour still ends, it just runs again next time.
      }
    }
    stop()
  }, [isActive, seek, stepIndex, stop, storageKey])

  const prev = React.useCallback(() => {
    if (!isActive) return
    const index = seek(stepIndex - 1, -1)
    if (index !== -1) setStepIndex(index)
  }, [isActive, seek, stepIndex])

  React.useEffect(() => {
    if (!isActive) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") stop()
    }
    document.addEventListener("keydown", onKeyDown)
    return () => document.removeEventListener("keydown", onKeyDown)
  }, [isActive, stop])

  // Measure the target and keep the cutout on it. Layout is a browser-only fact,
  // so it is read here rather than during render.
  React.useEffect(() => {
    if (!isActive || !target) return
    const element = findTarget(target)
    if (!element) return

    element.scrollIntoView({
      block: "nearest",
      inline: "nearest",
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    })

    let frame = 0
    const measure = () => {
      frame = 0
      setRect(getSpotlightRect(element.getBoundingClientRect()))
    }
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure)
    }
    measure()
    // Capture phase: any scrollable ancestor moves the target, not just the window.
    window.addEventListener("scroll", schedule, true)
    window.addEventListener("resize", schedule)
    return () => {
      window.removeEventListener("scroll", schedule, true)
      window.removeEventListener("resize", schedule)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [isActive, stepIndex, target])

  // The popover stays mounted across steps, so its own mount autofocus would only
  // ever fire once — moving focus per step is this effect's job.
  React.useEffect(() => {
    content?.focus()
  }, [content, stepIndex])

  // A virtual anchor keeps the popover on the cutout without rendering a proxy
  // element. Radix re-reads it whenever the object's identity changes — a fresh
  // one per measurement is what repositions the popover, since there is no real
  // node for its auto-update to observe.
  const anchorRef = React.useMemo(
    () => ({ current: { getBoundingClientRect: () => toDomRect(rect ?? ZERO) } }),
    [rect]
  )

  const context = React.useMemo(
    () => ({ start, stop, next, prev, isActive, stepIndex }),
    [start, stop, next, prev, isActive, stepIndex]
  )

  return (
    <TourContext.Provider value={context}>
      {children}
      {isActive && step && (
        <>
          {rect && (
            <svg
              data-slot="tour-overlay"
              aria-hidden="true"
              className="pointer-events-none fixed inset-0 z-50 h-full w-full"
            >
              {/* Only the painted dim area takes pointer events, so clicks land on
                  the highlighted target and nowhere else. */}
              <path
                d={spotlightPath(rect)}
                fillRule="evenodd"
                className="pointer-events-auto fill-black/50"
              />
            </svg>
          )}
          <Popover open>
            <PopoverAnchor virtualRef={anchorRef} />
            <PopoverContent
              ref={setContent}
              side={step.side ?? "bottom"}
              sideOffset={12}
              tabIndex={-1}
              aria-labelledby={titleId}
              aria-describedby={descriptionId}
              className="w-80"
              // Focus is driven per step by the effect above, not by mount.
              onOpenAutoFocus={(event) => event.preventDefault()}
            >
              <PopoverHeader>
                <PopoverTitle id={titleId}>{step.title}</PopoverTitle>
                <PopoverDescription id={descriptionId}>{step.content}</PopoverDescription>
              </PopoverHeader>
              <div className="flex items-center justify-between gap-3">
                <span className="text-muted-foreground text-xs tabular-nums">
                  Step {stepIndex + 1} of {validSteps.length}
                </span>
                <div className="flex items-center gap-1.5">
                  <Button variant="ghost" size="sm" onClick={stop}>
                    Skip
                  </Button>
                  {stepIndex > 0 && (
                    <Button variant="outline" size="sm" onClick={prev}>
                      Back
                    </Button>
                  )}
                  <Button size="sm" onClick={next}>
                    {isLast ? "Done" : "Next"}
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </>
      )}
    </TourContext.Provider>
  )
}

export {
  TourProvider,
  getSpotlightRect,
  useTour,
  type SpotlightRect,
  type TourProviderProps,
  type TourStep,
}
