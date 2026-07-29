"use client"
import * as React from "react"
import {
  EventCalendar,
  EventCalendarGrid,
  EventCalendarToolbar,
  type CalendarEvent,
} from "@/registry/ui/event-calendar"

// Seeded once at module eval, relative to "today", so the demo always lands on the
// current month with a today marker. A real app gets these from its own data.
const at = (dayOffset: number, hour: number, minute = 0) => {
  const date = new Date()
  date.setDate(date.getDate() + dayOffset)
  date.setHours(hour, minute, 0, 0)
  return date
}

// Four events today so the month view has to collapse the last one into "+1 more".
const EVENTS: CalendarEvent[] = [
  { id: "standup", title: "Team standup", start: at(0, 9), end: at(0, 9, 30), color: "blue" },
  { id: "review", title: "Design review", start: at(0, 11), end: at(0, 12), color: "purple" },
  { id: "one-on-one", title: "1:1 with Sam", start: at(0, 14), end: at(0, 15), color: "green" },
  { id: "retro", title: "Sprint retro", start: at(0, 16), end: at(0, 16, 30), color: "amber" },
  { id: "call", title: "Client call", start: at(-1, 13), end: at(-1, 14), color: "red" },
  { id: "planning", title: "Sprint planning", start: at(1, 10), end: at(1, 11, 30) },
  { id: "offsite", title: "Company offsite", start: at(2, 0), end: at(2, 23, 59), allDay: true },
]

// Hoisted so the store identity is stable across renders — it never emits, the two
// snapshots below are the whole point.
const neverChanges = () => () => {}

export function EventCalendarDemo() {
  // Both the seeds above and the calendar's own default date come off `new Date()`, so the
  // prerendered HTML carries the build day's month label and today marker. Every page view
  // on a later day would hydration-mismatch (recoverable, but a console error a day). The
  // server snapshot is false and the client one is true, so the server HTML and the
  // hydrating render are the same empty box and the calendar arrives right after.
  const mounted = React.useSyncExternalStore(
    neverChanges,
    () => true,
    () => false
  )

  // Toolbar + a six-row month grid, so swapping the calendar in doesn't shift the page.
  if (!mounted) return <div aria-hidden className="h-[41rem] w-full" />

  return (
    <EventCalendar events={EVENTS} className="w-full">
      <EventCalendarToolbar />
      <EventCalendarGrid />
    </EventCalendar>
  )
}
