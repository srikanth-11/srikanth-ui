import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { format } from "date-fns"
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import {
  EventCalendar,
  EventCalendarGrid,
  EventCalendarToolbar,
  getMonthGridDays,
  layoutWeekEvents,
  type CalendarEvent,
} from "./event-calendar"

const d = (y: number, m: number, day: number, h = 0, min = 0) => new Date(y, m, day, h, min, 0, 0)
const key = (dt: Date) =>
  `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`
const cellFor = (dt: Date | string) =>
  document.querySelector<HTMLElement>(`[data-date="${typeof dt === "string" ? dt : key(dt)}"]`)

const todayAt = (h: number) => {
  const x = new Date()
  x.setHours(h, 0, 0, 0)
  return x
}
// Five events on today so the "max 3 chips + +N more" rule kicks in.
const todayEvents: CalendarEvent[] = [8, 9, 10, 11, 12].map((h) => ({
  id: `e${h}`,
  title: h === 8 ? "Team standup" : `Event ${h}`,
  start: todayAt(h),
  end: todayAt(h + 1),
}))

describe("getMonthGridDays", () => {
  it("returns 42 cells starting on the week start and covering the whole month", () => {
    const days = getMonthGridDays(d(2026, 0, 15))
    expect(days).toHaveLength(42)
    expect(days[0].getDay()).toBe(0)
    expect(key(days[0])).toBe("2025-12-28")
    const january = days.filter((x) => x.getFullYear() === 2026 && x.getMonth() === 0)
    expect(january).toHaveLength(31)
    expect(january.map((x) => x.getDate())).toEqual(Array.from({ length: 31 }, (_, i) => i + 1))
  })

  it("honors weekStartsOn", () => {
    const days = getMonthGridDays(d(2026, 0, 15), 1)
    expect(days).toHaveLength(42)
    expect(days[0].getDay()).toBe(1)
    expect(key(days[0])).toBe("2025-12-29")
    expect(days.filter((x) => x.getFullYear() === 2026 && x.getMonth() === 0)).toHaveLength(31)
  })
})

describe("layoutWeekEvents", () => {
  const day = d(2026, 0, 15)

  it("puts overlapping events in side-by-side columns", () => {
    const events: CalendarEvent[] = [
      { id: "a", title: "A", start: d(2026, 0, 15, 9, 0), end: d(2026, 0, 15, 10, 0) },
      { id: "b", title: "B", start: d(2026, 0, 15, 9, 30), end: d(2026, 0, 15, 10, 30) },
    ]
    const laid = layoutWeekEvents(events, day)
    expect(laid.map((l) => l.event.id)).toEqual(["a", "b"])
    expect(laid.map((l) => l.col)).toEqual([0, 1])
    expect(laid.map((l) => l.cols)).toEqual([2, 2])
    expect(laid[0].top).toBe(9 * 48)
    expect(laid[0].height).toBe(48)
  })

  it("gives non-overlapping events the full width", () => {
    const events: CalendarEvent[] = [
      { id: "a", title: "A", start: d(2026, 0, 15, 9, 0), end: d(2026, 0, 15, 10, 0) },
      { id: "b", title: "B", start: d(2026, 0, 15, 11, 0), end: d(2026, 0, 15, 12, 0) },
    ]
    const laid = layoutWeekEvents(events, day)
    expect(laid.map((l) => [l.col, l.cols])).toEqual([
      [0, 1],
      [0, 1],
    ])
  })

  it("skips junk entries instead of throwing", () => {
    const valid: CalendarEvent = {
      id: "a",
      title: "A",
      start: d(2026, 0, 15, 9, 0),
      end: d(2026, 0, 15, 10, 0),
    }
    const junk = [null, undefined, {}, { id: "x", title: "X" }] as unknown as CalendarEvent[]
    const laid = layoutWeekEvents([...junk, valid], day)
    expect(laid.map((l) => l.event.id)).toEqual(["a"])
  })

  it("returns an empty layout when events is not an array", () => {
    for (const bad of [null, undefined, "nope", 42, { length: 2 }]) {
      expect(layoutWeekEvents(bad as unknown as CalendarEvent[], day)).toEqual([])
    }
  })

  it("clips an event that spans midnight to the requested day", () => {
    const events: CalendarEvent[] = [
      { id: "n", title: "Night shift", start: d(2026, 0, 14, 22, 0), end: d(2026, 0, 15, 1, 0) },
    ]
    const onDay = layoutWeekEvents(events, day)
    expect(onDay).toHaveLength(1)
    expect(onDay[0].top).toBe(0)
    expect(onDay[0].height).toBe(48)

    const onPrevDay = layoutWeekEvents(events, d(2026, 0, 14))
    expect(onPrevDay[0].top).toBe(22 * 48)
    expect(onPrevDay[0].height).toBe(2 * 48)

    expect(layoutWeekEvents(events, d(2026, 0, 16))).toHaveLength(0)
  })
})

// Day boundaries must be calendar days, not `+24h`: America/New_York has a 25-hour day on
// 2026-11-01 (DST ends) and a 23-hour day on 2027-03-14 (DST starts). The TZ is pinned for this
// block only — the rest of the file builds "today" dates in the machine's real zone.
describe("DST day boundaries", () => {
  // Node only re-reads the zone on assignment: `delete process.env.TZ` is a no-op and assigning
  // `undefined` stringifies to "undefined" (→ GMT). Capture the resolved zone and assign it back,
  // or the pinned zone leaks into every later test file sharing this worker.
  const realTz = process.env.TZ ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  beforeAll(() => {
    process.env.TZ = "America/New_York"
  })
  afterAll(() => {
    process.env.TZ = realTz
  })

  it("keeps a late event on the 25-hour fall-back day instead of dropping it", () => {
    // Sanity: the pinned zone really does make 2026-11-01 a 25-hour day.
    expect((d(2026, 10, 2).getTime() - d(2026, 10, 1).getTime()) / 3_600_000).toBe(25)

    const events: CalendarEvent[] = [
      { id: "late", title: "Late shift", start: d(2026, 10, 1, 23, 30), end: d(2026, 10, 2, 0, 0) },
    ]
    expect(layoutWeekEvents(events, d(2026, 10, 1)).map((l) => l.event.id)).toEqual(["late"])
    expect(layoutWeekEvents(events, d(2026, 10, 2))).toHaveLength(0)

    render(
      <EventCalendar defaultDate={d(2026, 10, 1)} events={events}>
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(within(cellFor("2026-11-01")!).getByRole("button", { name: /Late shift/ })).toBeInTheDocument()
  })

  it("does not pull a next-day event onto the 23-hour spring-forward day", () => {
    expect((d(2027, 2, 15).getTime() - d(2027, 2, 14).getTime()) / 3_600_000).toBe(23)

    const events: CalendarEvent[] = [
      { id: "early", title: "Early flight", start: d(2027, 2, 15, 0, 30), end: d(2027, 2, 15, 1, 0) },
    ]
    expect(layoutWeekEvents(events, d(2027, 2, 14))).toHaveLength(0)
    expect(layoutWeekEvents(events, d(2027, 2, 15)).map((l) => l.event.id)).toEqual(["early"])

    render(
      <EventCalendar defaultDate={d(2027, 2, 14)} events={events}>
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(within(cellFor("2027-03-14")!).queryByRole("button", { name: /Early flight/ })).toBeNull()
    expect(within(cellFor("2027-03-15")!).getByRole("button", { name: /Early flight/ })).toBeInTheDocument()
  })
})

describe("EventCalendar month view", () => {
  it("renders the month label, a today marker, event chips and a +N more indicator", () => {
    render(
      <EventCalendar events={todayEvents}>
        <EventCalendarToolbar />
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(screen.getByText(format(new Date(), "MMMM yyyy"))).toBeInTheDocument()
    expect(document.querySelector('[data-today="true"]')).toBeTruthy()
    expect(screen.getByRole("button", { name: /Team standup/ })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+2 more" })).toBeInTheDocument()
  })

  it("+N more switches to the week view for that day", async () => {
    const onViewChange = vi.fn()
    render(
      <EventCalendar events={todayEvents} onViewChange={onViewChange}>
        <EventCalendarToolbar />
        <EventCalendarGrid />
      </EventCalendar>
    )
    await userEvent.click(screen.getByRole("button", { name: "+2 more" }))
    expect(onViewChange).toHaveBeenCalledWith("week")
    expect(document.querySelector('[data-view="week"]')).toBeTruthy()
  })

  it("renders an empty month with a dev warning when events is not an array", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <EventCalendar defaultDate={d(2026, 0, 15)} events={null as unknown as CalendarEvent[]}>
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(document.querySelectorAll('[role="gridcell"]')).toHaveLength(42)
    expect(cellFor(d(2026, 0, 15))).toBeInTheDocument()
    expect(warn.mock.calls.flat().join(" ")).toContain("not an array")
    warn.mockRestore()
  })

  it("fires onEventClick and filters invalid events with a dev warning", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const onEventClick = vi.fn()
    const events: CalendarEvent[] = [
      { id: "ok", title: "Design review", start: d(2026, 0, 15, 9), end: d(2026, 0, 15, 10) },
      { id: "bad-1", title: "Backwards", start: d(2026, 0, 15, 11), end: d(2026, 0, 15, 10) },
    ]
    render(
      <EventCalendar defaultDate={d(2026, 0, 15)} events={events} onEventClick={onEventClick}>
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(screen.queryByText("Backwards")).not.toBeInTheDocument()
    expect(warn.mock.calls.flat().join(" ")).toContain("bad-1")

    await userEvent.click(screen.getByRole("button", { name: /Design review/ }))
    expect(onEventClick).toHaveBeenCalledTimes(1)
    expect(onEventClick.mock.calls[0][0]).toMatchObject({ id: "ok" })
    warn.mockRestore()
  })

  it("Enter on an event chip fires onEventClick only, not the day cell's onSlotClick", async () => {
    const onEventClick = vi.fn()
    const onSlotClick = vi.fn()
    render(
      <EventCalendar
        defaultDate={d(2026, 0, 15)}
        events={[{ id: "ok", title: "Design review", start: d(2026, 0, 15, 9), end: d(2026, 0, 15, 10) }]}
        onEventClick={onEventClick}
        onSlotClick={onSlotClick}
      >
        <EventCalendarGrid />
      </EventCalendar>
    )
    screen.getByRole("button", { name: /Design review/ }).focus()
    await userEvent.keyboard("{Enter}")
    expect(onEventClick).toHaveBeenCalledTimes(1)
    expect(onSlotClick).not.toHaveBeenCalled()
  })

  it("Enter on a focused day cell fires onSlotClick and arrow keys move the roving focus", async () => {
    const onSlotClick = vi.fn()
    render(
      <EventCalendar defaultDate={d(2026, 0, 15)} onSlotClick={onSlotClick}>
        <EventCalendarGrid />
      </EventCalendar>
    )
    const cell = cellFor(d(2026, 0, 15))!
    expect(cell).toHaveAttribute("tabindex", "0")
    expect(cellFor(d(2026, 0, 16))).toHaveAttribute("tabindex", "-1")

    cell.focus()
    await userEvent.keyboard("{Enter}")
    expect(onSlotClick).toHaveBeenCalledTimes(1)
    expect((onSlotClick.mock.calls[0][0] as Date).toDateString()).toBe(d(2026, 0, 15).toDateString())

    await userEvent.keyboard("{ArrowRight}")
    expect(cellFor(d(2026, 0, 16))).toHaveFocus()
    expect(cellFor(d(2026, 0, 16))).toHaveAttribute("tabindex", "0")
    expect(cellFor(d(2026, 0, 15))).toHaveAttribute("tabindex", "-1")

    await userEvent.keyboard("{ArrowDown}")
    expect(cellFor(d(2026, 0, 23))).toHaveFocus()
  })
})

describe("EventCalendar week view", () => {
  it("owns its rows, renders a cell per day and positions a timed event by start/end", () => {
    render(
      <EventCalendar
        defaultView="week"
        defaultDate={d(2026, 0, 15)}
        events={[
          { id: "a", title: "Design review", start: d(2026, 0, 15, 9), end: d(2026, 0, 15, 10) },
          { id: "b", title: "Company offsite", start: d(2026, 0, 15), end: d(2026, 0, 15), allDay: true },
        ]}
      >
        <EventCalendarGrid />
      </EventCalendar>
    )
    const grid = screen.getByRole("grid")
    const rows = within(grid).getAllByRole("row")
    expect(rows).toHaveLength(3)
    for (const row of rows) expect(row.parentElement).toBe(grid)
    expect(within(rows[0]).getAllByRole("columnheader")).toHaveLength(7)
    expect(within(rows[1]).getByRole("button", { name: /Company offsite/ })).toBeInTheDocument()
    expect(within(rows[2]).getAllByRole("gridcell")).toHaveLength(7)

    const chip = within(rows[2]).getByRole("button", { name: /Design review/ })
    expect(chip.style.insetBlockStart).toBe("432px") // 9am × 48px
    expect(chip.style.height).toBe("48px")
  })
})

describe("EventCalendarToolbar", () => {
  it("prev/next/today move the uncontrolled date and fire onDateChange", async () => {
    const onDateChange = vi.fn()
    render(
      <EventCalendar defaultDate={d(2026, 0, 15)} onDateChange={onDateChange}>
        <EventCalendarToolbar />
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(screen.getByText("January 2026")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Next month" }))
    expect(screen.getByText("February 2026")).toBeInTheDocument()
    expect(onDateChange).toHaveBeenCalledTimes(1)
    expect((onDateChange.mock.calls[0][0] as Date).getMonth()).toBe(1)

    await userEvent.click(screen.getByRole("button", { name: "Previous month" }))
    expect(screen.getByText("January 2026")).toBeInTheDocument()

    await userEvent.click(screen.getByRole("button", { name: "Today" }))
    expect(screen.getByText(format(new Date(), "MMMM yyyy"))).toBeInTheDocument()
  })

  it("view toggle fires onViewChange and a controlled view only changes with the prop", async () => {
    const onViewChange = vi.fn()
    const props = { date: d(2026, 0, 15), onDateChange: () => {}, onViewChange }
    const { rerender } = render(
      <EventCalendar view="month" {...props}>
        <EventCalendarToolbar />
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(document.querySelector('[data-view="month"]')).toBeTruthy()

    await userEvent.click(screen.getByRole("button", { name: "Week" }))
    expect(onViewChange).toHaveBeenCalledWith("week")
    expect(document.querySelector('[data-view="month"]')).toBeTruthy()
    expect(document.querySelector('[data-view="week"]')).toBeFalsy()

    rerender(
      <EventCalendar view="week" {...props}>
        <EventCalendarToolbar />
        <EventCalendarGrid />
      </EventCalendar>
    )
    expect(document.querySelector('[data-view="week"]')).toBeTruthy()
    expect(screen.getByRole("button", { name: "Next week" })).toBeInTheDocument()
  })
})

describe("EventCalendar controlled-prop warnings", () => {
  it("warns when view or date are controlled without a change handler", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(
      <EventCalendar view="month" date={d(2026, 0, 15)}>
        <EventCalendarGrid />
      </EventCalendar>
    )
    const messages = warn.mock.calls.flat().join(" ")
    expect(messages).toContain("`view` without `onViewChange`")
    expect(messages).toContain("`date` without `onDateChange`")
    warn.mockRestore()
  })
})
