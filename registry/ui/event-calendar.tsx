"use client"

import * as React from "react"
import {
  addDays,
  addMinutes,
  addMonths,
  addWeeks,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type CalendarView = "month" | "week"
type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6
type CalendarEventColor = "default" | "blue" | "green" | "amber" | "red" | "purple"

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  allDay?: boolean
  color?: CalendarEventColor
}

/** Geometry for one week-view event: `top`/`height` in px, `col`/`cols` for side-by-side overlap. */
interface PositionedEvent {
  event: CalendarEvent
  col: number
  cols: number
  top: number
  height: number
}

const HOUR_HEIGHT = 48
const MIN_EVENT_HEIGHT = 16
const MAX_CHIPS_PER_DAY = 3
const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000
const HOURS = Array.from({ length: 24 }, (_, i) => i)
const NO_EVENTS: CalendarEvent[] = []

// Token-safe chip classes — never raw hex, so consumer themes keep control.
const EVENT_COLORS: Record<CalendarEventColor, string> = {
  default: "bg-primary/10 text-primary hover:bg-primary/20",
  blue: "bg-blue-500/15 text-blue-700 hover:bg-blue-500/25 dark:text-blue-300",
  green: "bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/25 dark:text-emerald-300",
  amber: "bg-amber-500/15 text-amber-700 hover:bg-amber-500/25 dark:text-amber-300",
  red: "bg-destructive/10 text-destructive hover:bg-destructive/20",
  purple: "bg-violet-500/15 text-violet-700 hover:bg-violet-500/25 dark:text-violet-300",
}

const isValidDate = (value: unknown): value is Date =>
  value instanceof Date && !Number.isNaN(value.getTime())

const isValidEvent = (event: CalendarEvent) =>
  isValidDate(event?.start) && isValidDate(event?.end) && event.end.getTime() >= event.start.getTime()

/** True when the event covers any part of the day starting at `dayStart` (ms). Zero-length events count on their own day. */
function overlapsDay(event: CalendarEvent, dayStart: number) {
  const s = event.start.getTime()
  const e = event.end.getTime()
  return s < dayStart + DAY_MS && (e > dayStart || (e === s && s >= dayStart))
}

const dateKey = (date: Date) => format(date, "yyyy-MM-dd")

/** The 6x7 day grid for `date`'s month, always 42 cells starting on the week start. */
function getMonthGridDays(date: Date, weekStartsOn: WeekStart = 0): Date[] {
  const first = startOfWeek(startOfMonth(date), { weekStartsOn })
  return Array.from({ length: 42 }, (_, i) => addDays(first, i))
}

/**
 * Positions the timed events of `day` for the week view: clipped to the day,
 * `top`/`height` in px (48px/hour), overlapping events split into columns by a
 * greedy first-fit pass per overlap cluster.
 * ponytail: greedy, not optimal packing — a long event can widen its whole cluster.
 */
function layoutWeekEvents(events: CalendarEvent[], day: Date): PositionedEvent[] {
  const dayStart = startOfDay(day).getTime()
  const dayEnd = dayStart + DAY_MS
  const clipped = events
    .filter((event) => !event.allDay && isValidEvent(event) && overlapsDay(event, dayStart))
    .map((event) => ({
      event,
      s: Math.max(event.start.getTime(), dayStart),
      t: Math.min(event.end.getTime(), dayEnd),
    }))
    .sort((a, b) => a.s - b.s || b.t - a.t)

  const out: PositionedEvent[] = []
  let cluster: typeof clipped = []
  let clusterEnd = -Infinity

  const flush = () => {
    if (cluster.length === 0) return
    const colEnds: number[] = []
    const assigned = cluster.map((item) => {
      let col = colEnds.findIndex((end) => end <= item.s)
      if (col === -1) {
        col = colEnds.length
        colEnds.push(item.t)
      } else {
        colEnds[col] = item.t
      }
      return { item, col }
    })
    for (const { item, col } of assigned) {
      out.push({
        event: item.event,
        col,
        cols: colEnds.length,
        top: ((item.s - dayStart) / HOUR_MS) * HOUR_HEIGHT,
        height: Math.max(((item.t - item.s) / HOUR_MS) * HOUR_HEIGHT, MIN_EVENT_HEIGHT),
      })
    }
    cluster = []
    clusterEnd = -Infinity
  }

  for (const item of clipped) {
    if (item.s >= clusterEnd) flush()
    cluster.push(item)
    clusterEnd = Math.max(clusterEnd, item.t)
  }
  flush()
  return out
}

/** Events touching `day`, all-day first then by start. Returns a new array — never mutates the prop. */
function eventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  const dayStart = startOfDay(day).getTime()
  return events
    .filter((event) => overlapsDay(event, dayStart))
    .sort(
      (a, b) => Number(!!b.allDay) - Number(!!a.allDay) || a.start.getTime() - b.start.getTime()
    )
}

interface EventCalendarContextValue {
  events: CalendarEvent[]
  view: CalendarView
  setView: (view: CalendarView) => void
  date: Date
  setDate: (date: Date) => void
  weekStartsOn: WeekStart
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
}

const EventCalendarContext = React.createContext<EventCalendarContextValue | null>(null)

function useEventCalendar() {
  const ctx = React.useContext(EventCalendarContext)
  if (!ctx) throw new Error("EventCalendar parts must be used within <EventCalendar>")
  return ctx
}

interface EventCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  events?: CalendarEvent[]
  view?: CalendarView
  defaultView?: CalendarView
  onViewChange?: (view: CalendarView) => void
  date?: Date
  defaultDate?: Date
  onDateChange?: (date: Date) => void
  onEventClick?: (event: CalendarEvent) => void
  onSlotClick?: (date: Date) => void
  weekStartsOn?: WeekStart
}

const EventCalendar = React.forwardRef<HTMLDivElement, EventCalendarProps>(
  (
    {
      events = NO_EVENTS,
      view,
      defaultView = "month",
      onViewChange,
      date,
      defaultDate,
      onDateChange,
      onEventClick,
      onSlotClick,
      weekStartsOn = 0,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const [internalView, setInternalView] = React.useState<CalendarView>(defaultView)
    const [internalDate, setInternalDate] = React.useState<Date>(() => defaultDate ?? new Date())
    const viewControlled = view !== undefined
    const dateControlled = date !== undefined
    const currentView = viewControlled ? view : internalView
    const currentDate = dateControlled ? date : internalDate

    if (process.env.NODE_ENV !== "production") {
      if (viewControlled && !onViewChange)
        console.warn("EventCalendar: `view` without `onViewChange` — the view is read-only.")
      if (dateControlled && !onDateChange)
        console.warn("EventCalendar: `date` without `onDateChange` — the date is read-only.")
    }

    const setView = React.useCallback(
      (next: CalendarView) => {
        if (!viewControlled) setInternalView(next)
        onViewChange?.(next)
      },
      [viewControlled, onViewChange]
    )
    const setDate = React.useCallback(
      (next: Date) => {
        if (!dateControlled) setInternalDate(next)
        onDateChange?.(next)
      },
      [dateControlled, onDateChange]
    )

    // Bad data is dropped, never thrown on — the calendar still renders.
    const validEvents = React.useMemo(() => {
      const invalid = events.filter((event) => !isValidEvent(event))
      if (process.env.NODE_ENV !== "production" && invalid.length > 0) {
        console.warn(
          `EventCalendar: ignoring ${invalid.length} invalid event(s) (missing dates or end before start): ${invalid
            .map((event) => event?.id ?? "<no id>")
            .join(", ")}`
        )
      }
      return invalid.length > 0 ? events.filter(isValidEvent) : events
    }, [events])

    const value = React.useMemo(
      () => ({
        events: validEvents,
        view: currentView,
        setView,
        date: currentDate,
        setDate,
        weekStartsOn,
        onEventClick,
        onSlotClick,
      }),
      [validEvents, currentView, setView, currentDate, setDate, weekStartsOn, onEventClick, onSlotClick]
    )

    return (
      <EventCalendarContext.Provider value={value}>
        <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
          {children}
        </div>
      </EventCalendarContext.Provider>
    )
  }
)
EventCalendar.displayName = "EventCalendar"

function ChevronIcon({ direction }: { direction: "prev" | "next" }) {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-4"
    >
      <path d={direction === "prev" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  )
}

function formatWeekRange(date: Date, weekStartsOn: WeekStart) {
  const start = startOfWeek(date, { weekStartsOn })
  const end = addDays(start, 6)
  return isSameMonth(start, end)
    ? `${format(start, "MMM d")} – ${format(end, "d, yyyy")}`
    : `${format(start, "MMM d")} – ${format(end, "MMM d, yyyy")}`
}

const EventCalendarToolbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { view, setView, date, setDate, weekStartsOn } = useEventCalendar()
    const unit = view === "month" ? "month" : "week"
    const step = (direction: 1 | -1) =>
      setDate(view === "month" ? addMonths(date, direction) : addWeeks(date, direction))

    return (
      <div ref={ref} className={cn("flex flex-wrap items-center gap-2", className)} {...props}>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Previous ${unit}`}
            onClick={() => step(-1)}
          >
            <ChevronIcon direction="prev" />
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => setDate(new Date())}>
            Today
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={`Next ${unit}`}
            onClick={() => step(1)}
          >
            <ChevronIcon direction="next" />
          </Button>
        </div>
        <h2 aria-live="polite" className="text-sm font-semibold">
          {view === "month" ? format(date, "MMMM yyyy") : formatWeekRange(date, weekStartsOn)}
        </h2>
        <div role="group" aria-label="Calendar view" className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant={view === "month" ? "default" : "outline"}
            aria-pressed={view === "month"}
            onClick={() => setView("month")}
          >
            Month
          </Button>
          <Button
            type="button"
            size="sm"
            variant={view === "week" ? "default" : "outline"}
            aria-pressed={view === "week"}
            onClick={() => setView("week")}
          >
            Week
          </Button>
        </div>
      </div>
    )
  }
)
EventCalendarToolbar.displayName = "EventCalendarToolbar"

interface EventChipProps {
  event: CalendarEvent
  onEventClick?: (event: CalendarEvent) => void
  className?: string
  style?: React.CSSProperties
}

function EventChip({ event, onEventClick, className, style }: EventChipProps) {
  return (
    <button
      type="button"
      title={event.title}
      style={style}
      onClick={(e) => {
        e.stopPropagation() // the day cell is clickable too; a chip click is not a slot click
        onEventClick?.(event)
      }}
      className={cn(
        "focus-visible:ring-ring block w-full truncate rounded-sm px-1 py-px text-start text-[11px] leading-4 focus-visible:ring-2 focus-visible:outline-none",
        EVENT_COLORS[event.color ?? "default"],
        className
      )}
    >
      {event.title}
    </button>
  )
}

const MonthGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { events, date, setDate, setView, weekStartsOn, onEventClick, onSlotClick } =
      useEventCalendar()
    const days = React.useMemo(() => getMonthGridDays(date, weekStartsOn), [date, weekStartsOn])
    const innerRef = React.useRef<HTMLDivElement | null>(null)
    React.useImperativeHandle(ref, () => innerRef.current as HTMLDivElement)

    // Roving tabIndex: one tab stop for the grid, arrows move the focused day.
    // `focusedKey` stays null until the user actually interacts, so nothing steals focus on mount.
    const [focusedKey, setFocusedKey] = React.useState<string | null>(null)
    React.useEffect(() => {
      if (!focusedKey) return
      innerRef.current?.querySelector<HTMLElement>(`[data-date="${focusedKey}"]`)?.focus()
    }, [focusedKey])

    const activeKey =
      focusedKey && days.some((day) => dateKey(day) === focusedKey) ? focusedKey : dateKey(date)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, day: Date) => {
      // Keys pressed on a chip or "+N more" belong to that button — preventDefault here
      // would cancel its Enter/Space activation.
      if (e.target !== e.currentTarget) return
      const delta =
        e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : e.key === "ArrowDown" ? 7 : e.key === "ArrowUp" ? -7 : 0
      if (delta !== 0) {
        e.preventDefault()
        const next = addDays(day, delta)
        setFocusedKey(dateKey(next))
        // Stepping off the rendered grid pages the calendar; both updates batch,
        // so the focus effect below runs once the new month is in the DOM.
        if (!days.some((d) => isSameDay(d, next))) setDate(next)
      } else if (e.key === "Enter" || e.key === " ") {
        e.preventDefault()
        onSlotClick?.(day)
      }
    }

    return (
      <div
        ref={innerRef}
        role="grid"
        data-view="month"
        aria-label={format(date, "MMMM yyyy")}
        className={cn("bg-border grid gap-px overflow-hidden rounded-md border", className)}
        {...props}
      >
        <div role="row" className="bg-background grid grid-cols-7">
          {days.slice(0, 7).map((day) => (
            <div
              key={dateKey(day)}
              role="columnheader"
              aria-label={format(day, "EEEE")}
              className="text-muted-foreground py-1.5 text-center text-xs font-medium"
            >
              {format(day, "EEEEEE")}
            </div>
          ))}
        </div>
        {[0, 1, 2, 3, 4, 5].map((row) => (
          <div key={row} role="row" className="grid grid-cols-7 gap-px">
            {days.slice(row * 7, row * 7 + 7).map((day) => {
              const dayEvents = eventsForDay(events, day)
              const shown = dayEvents.slice(0, MAX_CHIPS_PER_DAY)
              const hidden = dayEvents.length - shown.length
              const k = dateKey(day)
              const today = isToday(day)
              const outside = !isSameMonth(day, date)
              return (
                <div
                  key={k}
                  role="gridcell"
                  data-date={k}
                  data-today={today || undefined}
                  data-outside={outside || undefined}
                  aria-label={format(day, "EEEE, MMMM d, yyyy")}
                  aria-current={today ? "date" : undefined}
                  tabIndex={k === activeKey ? 0 : -1}
                  onKeyDown={(e) => handleKeyDown(e, day)}
                  // Focus bubbles: only the cell itself moves the roving stop, or focusing
                  // a chip inside it would bounce focus back out to the cell.
                  onFocus={(e) => {
                    if (e.target === e.currentTarget) setFocusedKey(k)
                  }}
                  onClick={() => onSlotClick?.(day)}
                  className={cn(
                    "bg-background focus-visible:ring-ring min-h-24 space-y-0.5 p-1 text-start focus-visible:ring-2 focus-visible:outline-none",
                    outside && "text-muted-foreground/60",
                    today && "ring-primary ring-1 ring-inset"
                  )}
                >
                  <span
                    className={cn(
                      "block text-xs font-medium tabular-nums",
                      today && "text-primary"
                    )}
                  >
                    {format(day, "d")}
                  </span>
                  {shown.map((event) => (
                    <EventChip key={event.id} event={event} onEventClick={onEventClick} />
                  ))}
                  {hidden > 0 && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setDate(day)
                        setView("week")
                      }}
                      className="text-muted-foreground hover:text-foreground focus-visible:ring-ring block w-full rounded-sm px-1 text-start text-[11px] leading-4 focus-visible:ring-2 focus-visible:outline-none"
                    >
                      {`+${hidden} more`}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }
)
MonthGrid.displayName = "MonthGrid"

const WeekGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const { events, date, weekStartsOn, onEventClick, onSlotClick } = useEventCalendar()
    const days = React.useMemo(() => {
      const first = startOfWeek(date, { weekStartsOn })
      return Array.from({ length: 7 }, (_, i) => addDays(first, i))
    }, [date, weekStartsOn])

    // Current-time line; ticks once a minute and is cleaned up on unmount.
    const [now, setNow] = React.useState(() => new Date())
    React.useEffect(() => {
      const id = setInterval(() => setNow(new Date()), 60_000)
      return () => clearInterval(id)
    }, [])
    const nowTop = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_HEIGHT

    return (
      <div
        ref={ref}
        role="grid"
        data-view="week"
        aria-label={formatWeekRange(date, weekStartsOn)}
        className={cn("flex flex-col overflow-hidden rounded-md border", className)}
        {...props}
      >
        <div role="row" className="flex border-b">
          <div role="presentation" className="w-14 shrink-0" />
          {days.map((day) => (
            <div
              key={dateKey(day)}
              role="columnheader"
              data-today={isToday(day) || undefined}
              className="flex-1 border-s py-1.5 text-center text-xs"
            >
              <span className="text-muted-foreground">{format(day, "EEE")} </span>
              <span className={cn("font-medium tabular-nums", isToday(day) && "text-primary")}>
                {format(day, "d")}
              </span>
            </div>
          ))}
        </div>

        <div role="row" className="flex border-b">
          <div
            role="rowheader"
            className="text-muted-foreground w-14 shrink-0 px-1 py-1 text-end text-[10px]"
          >
            all-day
          </div>
          {days.map((day) => {
            const dayStart = startOfDay(day).getTime()
            return (
              <div
                key={dateKey(day)}
                role="gridcell"
                data-date={dateKey(day)}
                className="min-h-7 flex-1 space-y-0.5 border-s p-0.5"
              >
                {events
                  .filter((event) => event.allDay && overlapsDay(event, dayStart))
                  .map((event) => (
                    <EventChip key={event.id} event={event} onEventClick={onEventClick} />
                  ))}
              </div>
            )
          })}
        </div>

        <div role="row" className="flex max-h-[480px] overflow-y-auto">
          <div role="rowheader" className="w-14 shrink-0">
            {HOURS.map((hour) => (
              <div
                key={hour}
                style={{ height: HOUR_HEIGHT }}
                className="text-muted-foreground relative -top-1.5 pe-1 text-end text-[10px] tabular-nums"
              >
                {hour === 0 ? "" : format(new Date(2024, 0, 1, hour), "ha")}
              </div>
            ))}
          </div>
          {days.map((day) => (
            <div
              key={dateKey(day)}
              role="gridcell"
              data-date={dateKey(day)}
              style={{ height: HOURS.length * HOUR_HEIGHT }}
              onClick={(e) => {
                // offsetY is relative to this column (the hour rules are pointer-events-none),
                // so a click resolves to the nearest half hour of that day.
                const y = (e.nativeEvent as MouseEvent).offsetY || 0
                const minutes = Math.floor((y / HOUR_HEIGHT) * 2) * 30
                onSlotClick?.(addMinutes(startOfDay(day), minutes))
              }}
              className="relative flex-1 border-s"
            >
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {HOURS.map((hour) => (
                  <div key={hour} style={{ height: HOUR_HEIGHT }} className="border-border/60 border-b" />
                ))}
              </div>
              {layoutWeekEvents(events, day).map((positioned) => (
                <EventChip
                  key={positioned.event.id}
                  event={positioned.event}
                  onEventClick={onEventClick}
                  className="absolute overflow-hidden"
                  style={{
                    insetBlockStart: positioned.top,
                    height: positioned.height,
                    insetInlineStart: `${(positioned.col / positioned.cols) * 100}%`,
                    inlineSize: `${100 / positioned.cols}%`,
                  }}
                />
              ))}
              {isSameDay(day, now) && (
                <div
                  aria-hidden
                  className="border-destructive pointer-events-none absolute inset-x-0 border-t-2"
                  style={{ insetBlockStart: nowTop }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    )
  }
)
WeekGrid.displayName = "WeekGrid"

const EventCalendarGrid = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  (props, ref) => {
    const { view } = useEventCalendar()
    return view === "month" ? <MonthGrid ref={ref} {...props} /> : <WeekGrid ref={ref} {...props} />
  }
)
EventCalendarGrid.displayName = "EventCalendarGrid"

export {
  EventCalendar,
  EventCalendarToolbar,
  EventCalendarGrid,
  getMonthGridDays,
  layoutWeekEvents,
  type CalendarEvent,
  type CalendarEventColor,
  type CalendarView,
  type PositionedEvent,
}
