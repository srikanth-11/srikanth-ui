"use client"
import * as React from "react"
import { NotificationInbox, type Notification } from "@/registry/ui/notification-inbox"

// Seeded once at module eval so the relative timestamps read sensibly whenever the
// page is opened. Only the popover shows them, so there is no hydration mismatch.
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000)

const INITIAL: Notification[] = [
  {
    id: "n1",
    title: "Deploy finished",
    description: "srikanth-ui shipped to production in 42s.",
    timestamp: ago(2),
    read: false,
  },
  {
    id: "n2",
    title: "Nina commented on your pull request",
    description:
      "The spotlight cutout looks right on Safari now, but the popover still jumps a pixel when the page scrolls. Worth a look before we merge this.",
    timestamp: ago(45),
    read: false,
    href: "#",
  },
  {
    id: "n3",
    title: "Weekly digest ready",
    description: "12 issues closed, 4 opened.",
    timestamp: ago(60 * 5),
    read: true,
  },
  {
    id: "n4",
    title: "Storage at 80%",
    timestamp: ago(60 * 26),
    read: true,
  },
]

export function NotificationInboxDemo() {
  // Data-in only: the inbox reports intent, the app owns read and dismissed state.
  const [items, setItems] = React.useState(INITIAL)
  return (
    <NotificationInbox
      notifications={items}
      onMarkRead={(id) =>
        setItems((current) =>
          current.map((item) => (item.id === id ? { ...item, read: true } : item))
        )
      }
      onMarkAllRead={() => setItems((current) => current.map((item) => ({ ...item, read: true })))}
      onDismiss={(id) => setItems((current) => current.filter((item) => item.id !== id))}
    />
  )
}
