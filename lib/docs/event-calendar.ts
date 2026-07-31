import type { ComponentDoc } from "./types"

export const eventCalendarDoc: ComponentDoc = {
  exports: [
    {
      name: "EventCalendar",
      props: [
        {
          name: "events",
          type: "CalendarEvent[]",
          default: "[]",
          description: "The events to render. Filtered before anything is laid out — an entry without valid `start`/`end` dates, or with `end` before `start`, is dropped with a dev warning rather than thrown on.",
        },
        {
          name: "view",
          type: '"month" | "week"',
          description: "Controlled view. Pair it with `onViewChange` or the Month/Week buttons are read-only (dev-warned).",
        },
        {
          name: "defaultView",
          type: '"month" | "week"',
          default: '"month"',
          description: "Uncontrolled initial view. Ignored once `view` is provided.",
        },
        {
          name: "onViewChange",
          type: "(view: CalendarView) => void",
          description: "Fires on the toolbar's Month/Week buttons and when a day's \"+N more\" jumps to the week view.",
        },
        {
          name: "date",
          type: "Date",
          description: "Controlled anchor date — the month the grid draws, or the week it falls in. Pair it with `onDateChange` or paging is read-only (dev-warned).",
        },
        {
          name: "defaultDate",
          type: "Date",
          default: "new Date()",
          description: "Uncontrolled initial anchor date, read once on mount. Ignored once `date` is provided.",
        },
        {
          name: "onDateChange",
          type: "(date: Date) => void",
          description: "Fires on the toolbar's prev/Today/next, on \"+N more\", and when arrow keys step off the rendered grid and page the calendar.",
        },
        {
          name: "onEventClick",
          type: "(event: CalendarEvent) => void",
          description: "Fires with the clicked event. A chip click stops there — it is not also reported as a slot click.",
        },
        {
          name: "onSlotClick",
          type: "(date: Date) => void",
          description: "Fires with the empty space that was clicked: the start of the day in month view, the start of the half hour you clicked in — floored, not rounded — in week view.",
        },
        {
          name: "weekStartsOn",
          type: "0 | 1 | 2 | 3 | 4 | 5 | 6",
          default: "0",
          description: "First day of the week — 0 is Sunday, 1 Monday. Drives both the month grid's columns and the week the week view shows.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the column that stacks the parts.",
        },
        {
          name: "children",
          type: "React.ReactNode",
          description: "The parts to render — toolbar, grid, or your own chrome around them, in whatever order you want.",
        },
      ],
    },
    {
      name: "EventCalendarToolbar",
      props: [
        {
          name: "className",
          type: "string",
          description: "Extra classes for the toolbar row, which holds prev/Today/next, the `aria-live` period title, and the Month/Week toggle.",
        },
      ],
    },
    {
      name: "EventCalendarGrid",
      props: [
        {
          name: "className",
          type: "string",
          description: "Extra classes for the grid. Renders the month grid or the week grid from the current view; arrow-key roving moves between day cells and exists in month view only, so in week view the event chips are the only focus stops.",
        },
      ],
    },
    {
      name: "CalendarEvent",
      props: [
        {
          name: "id",
          type: "string",
          description: "React key and the identity `onEventClick` hands back. Unique per calendar.",
        },
        {
          name: "title",
          type: "string",
          description: "Chip label, also its `title` tooltip since chips truncate.",
        },
        {
          name: "start",
          type: "Date",
          description: "Required and must be a valid date, or the event is dropped.",
        },
        {
          name: "end",
          type: "Date",
          description: "Required, valid, and not before `start`. Zero-length events are kept and count on their own day.",
        },
        {
          name: "allDay",
          type: "boolean",
          description: "Pins the event to the week view's all-day row and sorts it above timed events in month cells. All-day events are excluded from the timed layout.",
        },
        {
          name: "color",
          type: '"default" | "blue" | "green" | "amber" | "red" | "purple"',
          default: '"default"',
          description: "Chip palette. Token-based classes, never raw hex, so a consumer theme stays in control.",
        },
      ],
    },
    {
      name: "getMonthGridDays",
      props: [
        {
          name: "date",
          type: "Date",
          description: "Any day in the month to draw.",
        },
        {
          name: "weekStartsOn",
          type: "0 | 1 | 2 | 3 | 4 | 5 | 6",
          default: "0",
          description: "First day of the week the grid starts on.",
        },
        {
          name: "→ returns",
          type: "Date[]",
          description: "Always 42 days — six rows of seven — beginning on the week start on or before the first of the month, so leading and trailing days belong to the neighbouring months.",
        },
      ],
    },
    {
      name: "layoutWeekEvents",
      props: [
        {
          name: "events",
          type: "CalendarEvent[]",
          description: "The events to place. Invalid entries, all-day events and events that miss the day are filtered out; a non-array lays out nothing.",
        },
        {
          name: "day",
          type: "Date",
          description: "The day to lay out. Events are clipped to its calendar bounds, which is 23 or 25 hours long on a DST day.",
        },
        {
          name: "→ returns",
          type: "PositionedEvent[]",
          description: "`{ event, top, height, col, cols }` per placed event: `top`/`height` in px at 48px per hour (16px floor), and `col`/`cols` splitting an overlapping cluster into side-by-side columns by a greedy first-fit pass.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Month and week views",
      code: `"use client"

import {
  EventCalendar,
  EventCalendarGrid,
  EventCalendarToolbar,
  type CalendarEvent,
} from "@/components/ui/event-calendar"

const EVENTS: CalendarEvent[] = [
  {
    id: "standup",
    title: "Team standup",
    start: new Date(2026, 6, 30, 9, 0),
    end: new Date(2026, 6, 30, 9, 30),
    color: "blue",
  },
  {
    id: "offsite",
    title: "Company offsite",
    start: new Date(2026, 6, 31),
    end: new Date(2026, 6, 31, 23, 59),
    allDay: true,
  },
]

export function Schedule() {
  return (
    <EventCalendar
      events={EVENTS}
      weekStartsOn={1}
      onEventClick={(event) => console.log(event.id)}
      className="w-full"
    >
      <EventCalendarToolbar />
      <EventCalendarGrid />
    </EventCalendar>
  )
}`,
    },
    {
      title: "Controlled view and date",
      code: `"use client"

import * as React from "react"
import {
  EventCalendar,
  EventCalendarGrid,
  EventCalendarToolbar,
  type CalendarEvent,
  type CalendarView,
} from "@/components/ui/event-calendar"

export function Planner({ events }: { events: CalendarEvent[] }) {
  const [view, setView] = React.useState<CalendarView>("week")
  const [date, setDate] = React.useState(() => new Date())

  return (
    <EventCalendar
      events={events}
      view={view}
      onViewChange={setView}
      date={date}
      onDateChange={setDate}
      // Month view hands back the start of the day, week view the start of the
      // half hour you clicked in (10:29 lands on 10:00).
      onSlotClick={(slot) => console.log("new event at", slot.toISOString())}
    >
      <EventCalendarToolbar />
      <EventCalendarGrid />
    </EventCalendar>
  )
}`,
    },
    {
      title: "Using the layout helpers directly",
      code: `import { getMonthGridDays, layoutWeekEvents } from "@/components/ui/event-calendar"

// 42 days, Monday-first, for the month containing the date.
const days = getMonthGridDays(new Date(2026, 6, 15), 1)

// Geometry for one day's timed events — px offsets at 48px/hour, plus the
// column split for anything that overlaps.
const placed = layoutWeekEvents(events, days[0])
const tallest = placed.reduce((max, p) => Math.max(max, p.height), 0)`,
    },
  ],
  keyboard: [
    {
      keys: "Tab",
      action: "Moves into the month grid, where the day cells share a single roving tab stop — event chips and \"+N more\" inside them are their own stops; focus lands on the day you last focused, or on the calendar's current date before any interaction.",
    },
    {
      keys: "Arrow Left / Arrow Right",
      action: "Moves one day back or forward. Stepping past the 42-cell grid pages the calendar to that day's month and keeps focus on it.",
    },
    {
      keys: "Arrow Up / Arrow Down",
      action: "Moves a week back or forward — same weekday, previous or next row — paging the calendar the same way at the edges.",
    },
    {
      keys: "Enter / Space",
      action: "On a day cell, calls `onSlotClick` with that day.",
    },
    {
      keys: "Enter / Space (on a chip)",
      action: "Activates the focused button instead: an event chip calls `onEventClick`, and \"+N more\" opens that day in the week view. The grid keys stand aside so the button's own activation still works.",
    },
  ],
  errorState:
    "There is no `error` prop and nothing here can be typed wrong — the only bad input is bad data, and it is dropped rather than thrown on. An event is kept when `start` and `end` are both real dates and `end` is not before `start`; anything else is filtered out and dev-warned by id (\"ignoring N invalid event(s) (missing dates or end before start)\"). An `events` prop that is not an array renders an empty calendar with its own warning. When nothing is dropped the original array is passed through untouched, so memoized consumers keep their identity. `layoutWeekEvents` applies the same filter and returns `[]` for a non-array, so calling it directly with unverified data is safe too. What survives the filter can still surprise you rather than error: an event whose `end` is far past its `start` shows up in every day it covers, and a chip that overlaps several others is narrowed by the greedy column split rather than hidden. Month cells show three chips and collapse the rest into \"+N more\", which pages to the week view — no event is silently lost.",
}
