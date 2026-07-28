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

export function EventCalendarDemo() {
  return (
    <EventCalendar events={EVENTS} className="w-full">
      <EventCalendarToolbar />
      <EventCalendarGrid />
    </EventCalendar>
  )
}
