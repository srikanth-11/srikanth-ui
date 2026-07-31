import type { ComponentDoc } from "./types"

export const notificationInboxDoc: ComponentDoc = {
  exports: [
    {
      name: "NotificationInbox",
      props: [
        {
          name: "notifications",
          type: "Notification[]",
          description: "The rows to show, newest first — the inbox renders the order you give it. Required, and data-in only: read and dismissed state lives in your app, the inbox just reports intent.",
        },
        {
          name: "onMarkRead",
          type: "(id: string) => void",
          description: "Fires when an unread row is activated, before `onItemClick`. Already-read rows do not call it again.",
        },
        {
          name: "onMarkAllRead",
          type: "() => void",
          description: "Fires from the \"Mark all as read\" button, which only renders while something is unread.",
        },
        {
          name: "onDismiss",
          type: "(id: string) => void",
          description: "Fires from a row's X button, which is always rendered — without this handler it is a no-op.",
        },
        {
          name: "onItemClick",
          type: "(item: Notification) => void",
          description: "Fires on row activation with the whole notification. A row with an `href` still navigates; this runs alongside it.",
        },
        {
          name: "renderItem",
          type: "(item: Notification) => React.ReactNode",
          description: "Replaces the whole row — body and dismiss button both — inside the list item that keeps `role=\"listitem\"`. The read dot, relative stamp, `href` handling and dismiss control become yours to render and wire.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the bell trigger button. Remaining props are forwarded to it too, and its ref is the button.",
        },
      ],
    },
    {
      name: "Notification",
      props: [
        {
          name: "id",
          type: "string",
          description: "React key, and what `onMarkRead`/`onDismiss` hand back. Required and unique — a row without one, or with a duplicate, is dropped.",
        },
        {
          name: "title",
          type: "string",
          description: "Row headline. Required — a row without a string title is dropped — and it names the row's dismiss button (\"Dismiss {title}\").",
        },
        {
          name: "description",
          type: "string",
          description: "Optional second line, clamped to two lines.",
        },
        {
          name: "timestamp",
          type: "Date",
          description: "Stamped through `formatRelativeTime` and re-rendered once a minute while the panel is open. Anything that is not a valid date renders no stamp at all rather than \"Invalid Date\".",
        },
        {
          name: "read",
          type: "boolean",
          description: "Drives the unread dot, its \"Unread\" screen-reader text, the trigger's badge count and the Unread tab.",
        },
        {
          name: "href",
          type: "string",
          description: "Makes the row a real link, so middle-click and \"open in new tab\" work. Only relative URLs and the `http:`, `https:`, `mailto:` and `tel:` schemes survive; anything else is dropped and the row degrades to a button.",
        },
      ],
    },
    {
      name: "formatRelativeTime",
      props: [
        {
          name: "date",
          type: "Date",
          description: "The moment to describe. Junk gives `\"\"` back, never a throw.",
        },
        {
          name: "now",
          type: "Date",
          default: "new Date()",
          description: "The clock to measure against — pass one to keep a list of stamps consistent, or to test the bucket boundaries.",
        },
        {
          name: "→ returns",
          type: "string",
          description: "Localized age: \"now\" under a minute (future stamps included, so a clock a few seconds ahead does not count forward), then whole minutes, hours and days, and a plain calendar date from a week out — with the year only when it is not the current one.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Wiring read and dismiss state",
      code: `"use client"

import * as React from "react"
import { NotificationInbox, type Notification } from "@/components/ui/notification-inbox"

const INITIAL: Notification[] = [
  {
    id: "mention",
    title: "Sam mentioned you",
    description: "in Design review",
    timestamp: new Date(Date.now() - 4 * 60 * 1000),
    read: false,
    href: "/threads/design-review",
  },
  {
    id: "deploy",
    title: "Deploy finished",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    read: true,
  },
]

export function Inbox() {
  const [items, setItems] = React.useState(INITIAL)

  return (
    <NotificationInbox
      notifications={items}
      onMarkRead={(id) =>
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, read: true } : item)))
      }
      onMarkAllRead={() => setItems((prev) => prev.map((item) => ({ ...item, read: true })))}
      onDismiss={(id) => setItems((prev) => prev.filter((item) => item.id !== id))}
    />
  )
}`,
    },
    {
      title: "Custom rows",
      code: `"use client"

import { NotificationInbox, formatRelativeTime, type Notification } from "@/components/ui/notification-inbox"

export function CompactInbox({ notifications }: { notifications: Notification[] }) {
  // renderItem replaces the row and its dismiss button, so anything you still
  // want — the stamp, a dismiss control — you render yourself.
  return (
    <NotificationInbox
      notifications={notifications}
      renderItem={(item) => (
        <div className="flex w-full items-baseline justify-between gap-2 p-2 text-sm">
          <span className={item.read ? "text-muted-foreground" : "font-medium"}>{item.title}</span>
          <time className="text-muted-foreground text-xs">
            {formatRelativeTime(item.timestamp)}
          </time>
        </div>
      )}
    />
  )
}`,
    },
    {
      title: "Stamping times elsewhere",
      code: `import { formatRelativeTime } from "@/components/ui/notification-inbox"

const now = new Date("2026-07-30T12:00:00Z")

// Stamps follow the viewer's locale; these are the en-US strings.
formatRelativeTime(new Date("2026-07-30T11:59:40Z"), now) // "now"
formatRelativeTime(new Date("2026-07-30T09:00:00Z"), now) // "3 hr. ago"
formatRelativeTime(new Date("2026-07-10T09:00:00Z"), now) // "Jul 10"
formatRelativeTime(undefined as unknown as Date, now) // ""`,
    },
  ],
  errorState:
    "There is no `error` prop and nothing in the panel can be typed wrong — the risks here are bad rows and hostile links, and both are handled before render. A row is kept only when it is an object with a string `id`, a string `title` and an id nothing else on the list used; the rest are dropped together with a dev warning (\"ignoring N notification(s) with a missing title or a missing/duplicate id\"), a `notifications` prop that is not an array renders an empty inbox, and when nothing is dropped the array you passed is used as-is. `href` is the real trust boundary, because notifications are server- or user-authored: control characters and whitespace are stripped first — browsers ignore them when resolving a scheme, so \" JaVaScRiPt:\" and \"java\\tscript:\" both navigate — and only relative URLs plus `http:`, `https:`, `mailto:` and `tel:` get through. Anything else is dropped with a dev warning naming the notification, and the row falls back to a button that still fires `onItemClick`, so the notification stays usable without the link. A `timestamp` that is not a valid date yields an empty stamp and the `<time>` element is skipped entirely, so no row can render \"Invalid Date\" or throw. The badge caps its label at \"99+\" while the trigger's own label keeps the exact count, and the empty states read \"No notifications yet\" and \"All caught up\" rather than showing an empty box.",
}
