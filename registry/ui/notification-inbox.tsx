"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR
const WEEK = 7 * DAY
/** How often the open panel re-reads the clock so "5m ago" doesn't go stale. */
const TICK = MINUTE
const BADGE_CAP = 99

interface Notification {
  id: string
  title: string
  description?: string
  timestamp: Date
  read: boolean
  /** When set the row is a link, so middle-click and "open in new tab" work. */
  href?: string
}

// `numeric: "auto"` is what turns a zero delta into "now"; every other bucket wants
// "always", or a one-day delta comes back as "yesterday" instead of "1d ago".
const NOW_FORMAT = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "narrow",
})
const AGO_FORMAT = new Intl.RelativeTimeFormat(undefined, {
  numeric: "always",
  style: "narrow",
})

const warn = (message: string) => {
  if (process.env.NODE_ENV !== "production") console.warn(message)
}

const SAFE_SCHEME = /^(https?|mailto|tel):/i
/** A leading scheme, i.e. a colon before any path, query or fragment starts. */
const HAS_SCHEME = /^[^/?#]*:/

/**
 * `href` back when it is safe to put in an `<a>`, `undefined` when it isn't.
 *
 * Notifications are server- or user-authored data, so the scheme is a trust
 * boundary: `javascript:`, `data:` and `vbscript:` all execute on click. Only
 * relative URLs and the http/https/mailto/tel schemes get through; anything else
 * is dropped with a dev warning and the row degrades to a plain button.
 *
 * Control characters and whitespace are stripped before the check because
 * browsers ignore them when resolving a scheme — " JaVaScRiPt:" and
 * "java\tscript:" both navigate.
 */
function safeHref(href: unknown, id: string): string | undefined {
  if (typeof href !== "string" || href === "") return undefined
  const bare = href.replace(/[\x00-\x20]/g, "")
  if (!HAS_SCHEME.test(bare) || SAFE_SCHEME.test(bare)) return href
  warn(
    `NotificationInbox: dropped an unsafe href on notification "${id}" — only relative, http:, https:, mailto: and tel: links are allowed.`
  )
  return undefined
}

const msOf = (value: unknown) =>
  value instanceof Date && Number.isFinite(value.getTime()) ? value.getTime() : Number.NaN

/**
 * Age of `date` as of `now`, in the viewer's locale: "now" under a minute, then
 * whole minutes, hours and days, and a plain calendar date from a week out (with
 * the year only when it isn't the current one).
 *
 * Pure, so the bucket boundaries are testable without rendering anything. Junk in
 * gives "" out, never a throw and never "Invalid Date".
 */
function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const then = msOf(date)
  if (Number.isNaN(then)) return ""
  const base = Number.isNaN(msOf(now)) ? Date.now() : now.getTime()

  const elapsed = base - then
  // Clocks disagree: a server-stamped notification routinely lands a few seconds
  // in the "future". A negative age falls in here too, so it reads "now" instead
  // of counting forward — no separate clamp needed.
  if (elapsed < MINUTE) return NOW_FORMAT.format(0, "second")
  if (elapsed < HOUR) return AGO_FORMAT.format(-Math.floor(elapsed / MINUTE), "minute")
  if (elapsed < DAY) return AGO_FORMAT.format(-Math.floor(elapsed / HOUR), "hour")
  if (elapsed < WEEK) return AGO_FORMAT.format(-Math.floor(elapsed / DAY), "day")
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() === new Date(base).getFullYear() ? undefined : "numeric",
  })
}

function BellIcon() {
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-3.5"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  )
}

function NotificationRow({
  item,
  now,
  onActivate,
  onDismiss,
}: {
  item: Notification
  now: Date
  onActivate: (item: Notification) => void
  onDismiss?: (id: string) => void
}) {
  // A row with a safe href is a real link, so it keeps middle-click and "open in
  // new tab"; without one it is a button. Both are focusable and Enter-activated.
  const href = safeHref(item.href, item.id)
  const Row: React.ElementType = href ? "a" : "button"
  const stamp = formatRelativeTime(item.timestamp, now)

  return (
    <>
      <Row
        {...(href ? { href } : { type: "button" })}
        onClick={() => onActivate(item)}
        className={cn(
          "flex min-w-0 flex-1 items-start gap-2 rounded-md p-2 text-start transition-colors",
          "hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring"
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-1.5 size-2 shrink-0 rounded-full",
            item.read ? "bg-transparent" : "bg-primary"
          )}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          {!item.read && <span className="sr-only">Unread</span>}
          <span className="text-sm leading-snug font-medium">{item.title}</span>
          {item.description && (
            <span className="line-clamp-2 text-xs text-muted-foreground">
              {item.description}
            </span>
          )}
          {stamp && (
            <time dateTime={item.timestamp.toISOString()} className="text-xs text-muted-foreground">
              {stamp}
            </time>
          )}
        </span>
      </Row>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={`Dismiss ${item.title}`}
        onClick={() => onDismiss?.(item.id)}
        className="mt-1 size-6 shrink-0 opacity-0 transition-opacity group-focus-within/row:opacity-100 group-hover/row:opacity-100 focus-visible:opacity-100"
      >
        <XIcon />
      </Button>
    </>
  )
}

interface NotificationInboxProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  notifications: Notification[]
  /** Called before `onItemClick` when an unread row is activated. */
  onMarkRead?: (id: string) => void
  onMarkAllRead?: () => void
  onDismiss?: (id: string) => void
  onItemClick?: (item: Notification) => void
  /** Replaces the row body; the list wrapper and its semantics stay. */
  renderItem?: (item: Notification) => React.ReactNode
}

/**
 * Bell trigger with an unread badge, opening a tabbed popover of notifications.
 *
 * Data-in only: read and dismissed state lives in the app, this component just
 * reports intent through its callbacks.
 */
const NotificationInbox = React.forwardRef<HTMLButtonElement, NotificationInboxProps>(
  (
    {
      notifications,
      onMarkRead,
      onMarkAllRead,
      onDismiss,
      onItemClick,
      renderItem,
      className,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false)
    const [now, setNow] = React.useState(() => new Date())
    const titleId = React.useId()

    // Bad rows are dropped, never thrown on: a row needs an id and a title, and
    // ids must be unique so React keys and dismiss callbacks stay meaningful.
    const items = React.useMemo(() => {
      const source = Array.isArray(notifications) ? notifications : []
      const seen = new Set<string>()
      const dropped: string[] = []
      const kept = source.filter((item) => {
        const ok =
          !!item &&
          typeof item.id === "string" &&
          typeof item.title === "string" &&
          !seen.has(item.id)
        if (ok) seen.add(item.id)
        else dropped.push(item?.id ?? "<no id>")
        return ok
      })
      if (dropped.length > 0) {
        warn(
          `NotificationInbox: ignoring ${dropped.length} notification(s) with a missing title or a missing/duplicate id: ${dropped.join(", ")}`
        )
      }
      return kept.length === source.length ? source : kept
    }, [notifications])

    const unread = React.useMemo(() => items.filter((item) => !item.read), [items])

    // Only ticks while the panel is open — a closed inbox has nothing to restamp.
    React.useEffect(() => {
      if (!open) return
      const id = setInterval(() => setNow(new Date()), TICK)
      return () => clearInterval(id)
    }, [open])

    const handleOpenChange = (next: boolean) => {
      // The mount-time clock is stale by the time anyone opens the panel; the
      // interval only takes over from here.
      if (next) setNow(new Date())
      setOpen(next)
    }

    const activate = (item: Notification) => {
      if (!item.read) onMarkRead?.(item.id)
      onItemClick?.(item)
    }

    const list = (rows: Notification[], empty: string) =>
      rows.length === 0 ? (
        <p className="px-2 py-10 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div role="list" className="max-h-96 overflow-y-auto">
          {rows.map((item) => (
            <div
              key={item.id}
              role="listitem"
              data-slot="notification-item"
              className="group/row flex items-start gap-1"
            >
              {renderItem ? (
                renderItem(item)
              ) : (
                <NotificationRow
                  item={item}
                  now={now}
                  onActivate={activate}
                  onDismiss={onDismiss}
                />
              )}
            </div>
          ))}
        </div>
      )

    return (
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Notifications, ${unread.length} unread`}
            className={cn("relative", className)}
            {...props}
          >
            <BellIcon />
            {unread.length > 0 && (
              <Badge
                // The trigger's own label carries the count, so the badge is
                // decoration as far as assistive tech is concerned.
                aria-hidden
                data-slot="notification-badge"
                className="pointer-events-none absolute -top-1 -end-1 h-4 min-w-4 justify-center px-1 text-[10px] tabular-nums"
              >
                {unread.length > BADGE_CAP ? `${BADGE_CAP}+` : unread.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" aria-labelledby={titleId} className="w-80 gap-2 p-2">
          <div className="flex items-center justify-between gap-2 ps-1">
            <span id={titleId} className="text-sm font-medium">
              Notifications
            </span>
            {unread.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onMarkAllRead?.()}
                className="h-7 px-2 text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
          <Tabs defaultValue="all">
            <TabsList className="w-full">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
            <TabsContent value="all">{list(items, "No notifications yet")}</TabsContent>
            <TabsContent value="unread">{list(unread, "All caught up")}</TabsContent>
          </Tabs>
        </PopoverContent>
      </Popover>
    )
  }
)
NotificationInbox.displayName = "NotificationInbox"

export {
  NotificationInbox,
  formatRelativeTime,
  type Notification,
  type NotificationInboxProps,
}
