import * as React from "react"
import { act, fireEvent, render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it, vi } from "vitest"

import {
  NotificationInbox,
  formatRelativeTime,
  type Notification,
} from "./notification-inbox"

const SECOND = 1000
const MINUTE = 60 * SECOND
const HOUR = 60 * MINUTE
const DAY = 24 * HOUR

const NOW = new Date("2026-07-28T12:00:00.000Z")
/** Fixture for the pure formatter, which is always handed an explicit `now`. */
const at = (ms: number) => new Date(NOW.getTime() - ms)
/** Fixture for rendered rows, which are measured against the machine's real clock. */
const ago = (ms: number) => new Date(Date.now() - ms)

// Wording is Intl's job, bucketing is ours. Asserting literal "5m ago" would be a
// bet on the machine's default locale (this repo's Node resolves to en-IN, where
// narrow style reads "5 min ago"), so the expectations state the unit and the
// magnitude and let Intl render them.
const relative = (value: number, unit: Intl.RelativeTimeFormatUnit) =>
  new Intl.RelativeTimeFormat(undefined, { numeric: "always", style: "narrow" }).format(
    value,
    unit
  )
const justNow = new Intl.RelativeTimeFormat(undefined, {
  numeric: "auto",
  style: "narrow",
}).format(0, "second")
const absolute = (date: Date, withYear = false) =>
  date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
  })

const NOTIFICATIONS: Notification[] = [
  {
    id: "a",
    title: "Build failed",
    description: "main @ 3f21ac could not be compiled.",
    timestamp: ago(5 * MINUTE),
    read: false,
  },
  { id: "b", title: "Deploy queued", timestamp: ago(2 * HOUR), read: true },
  {
    id: "c",
    title: "New comment",
    description: "Ada replied to your review.",
    timestamp: ago(3 * DAY),
    read: false,
  },
]

type InboxProps = React.ComponentProps<typeof NotificationInbox>

const trigger = () => screen.getByRole("button", { name: /^Notifications/ })
const badge = () => document.querySelector('[data-slot="notification-badge"]')
const panel = () => screen.getByRole("dialog")
const rows = () => within(panel()).getAllByRole("listitem")
const titles = () => rows().map((row) => row.textContent ?? "")
/** Rows announce their unread state first, dismiss buttons announce "Dismiss …". */
const rowButton = (title: string) =>
  within(panel()).getByRole("button", { name: new RegExp(`^(Unread )?${title}`) })

function renderInbox(props: Partial<InboxProps> = {}) {
  const user = userEvent.setup()
  render(<NotificationInbox notifications={NOTIFICATIONS} {...props} />)
  return user
}

async function openInbox(props: Partial<InboxProps> = {}) {
  const user = renderInbox(props)
  await user.click(trigger())
  return user
}

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe("formatRelativeTime", () => {
  it("reads anything under a minute as 'now'", () => {
    expect(formatRelativeTime(NOW, NOW)).toBe(justNow)
    expect(formatRelativeTime(at(59 * SECOND), NOW)).toBe(justNow)
  })

  it("counts whole minutes under an hour", () => {
    expect(formatRelativeTime(at(MINUTE), NOW)).toBe(relative(-1, "minute"))
    expect(formatRelativeTime(at(5 * MINUTE), NOW)).toBe(relative(-5, "minute"))
    expect(formatRelativeTime(at(59 * MINUTE + 59 * SECOND), NOW)).toBe(
      relative(-59, "minute")
    )
  })

  it("counts whole hours under a day", () => {
    expect(formatRelativeTime(at(HOUR), NOW)).toBe(relative(-1, "hour"))
    expect(formatRelativeTime(at(2 * HOUR), NOW)).toBe(relative(-2, "hour"))
    expect(formatRelativeTime(at(23 * HOUR + 59 * MINUTE), NOW)).toBe(relative(-23, "hour"))
  })

  it("counts whole days under a week", () => {
    expect(formatRelativeTime(at(DAY), NOW)).toBe(relative(-1, "day"))
    expect(formatRelativeTime(at(3 * DAY), NOW)).toBe(relative(-3, "day"))
    expect(formatRelativeTime(at(6 * DAY + 23 * HOUR), NOW)).toBe(relative(-6, "day"))
  })

  it("switches to a localized date from a week out", () => {
    const week = at(7 * DAY)
    expect(formatRelativeTime(week, NOW)).toBe(absolute(week))
    const older = at(30 * DAY)
    expect(formatRelativeTime(older, NOW)).toBe(absolute(older))
  })

  it("spells out the year only when it differs from now", () => {
    const lastYear = new Date("2025-11-02T09:30:00.000Z")
    expect(formatRelativeTime(lastYear, NOW)).toBe(absolute(lastYear, true))
    expect(formatRelativeTime(lastYear, NOW)).toContain("2025")
  })

  it("clamps a future timestamp to 'now' instead of counting forward", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 5 * MINUTE), NOW)).toBe(justNow)
    expect(formatRelativeTime(new Date(NOW.getTime() + 400 * DAY), NOW)).toBe(justNow)
  })

  it("measures against the current clock when `now` is omitted", () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    expect(formatRelativeTime(at(2 * HOUR))).toBe(relative(-2, "hour"))
  })

  it("returns an empty string for junk instead of throwing", () => {
    expect(formatRelativeTime(new Date("not a date"), NOW)).toBe("")
    expect(formatRelativeTime(undefined as unknown as Date, NOW)).toBe("")
    expect(formatRelativeTime("2026-07-28" as unknown as Date, NOW)).toBe("")
    expect(formatRelativeTime(NOW, new Date("not a date"))).not.toBe("")
  })
})

describe("NotificationInbox trigger", () => {
  it("counts the unread notifications on the badge and in the label", () => {
    renderInbox()
    expect(badge()).toHaveTextContent("2")
    expect(trigger()).toHaveAccessibleName("Notifications, 2 unread")
  })

  it("caps the badge at 99+ but keeps the real count in the label", () => {
    const many = Array.from({ length: 150 }, (_, i) => ({
      id: `n${i}`,
      title: `Notification ${i}`,
      timestamp: ago(MINUTE),
      read: false,
    }))
    renderInbox({ notifications: many })

    expect(badge()).toHaveTextContent("99+")
    expect(trigger()).toHaveAccessibleName("Notifications, 150 unread")
  })

  it("hides the badge when nothing is unread", () => {
    renderInbox({ notifications: NOTIFICATIONS.map((item) => ({ ...item, read: true })) })

    expect(badge()).toBeNull()
    expect(trigger()).toHaveAccessibleName("Notifications, 0 unread")
  })

  it("forwards a ref and stays disableable", () => {
    const ref = React.createRef<HTMLButtonElement>()
    render(<NotificationInbox ref={ref} notifications={NOTIFICATIONS} disabled />)

    expect(ref.current).toBe(trigger())
    expect(trigger()).toBeDisabled()
  })
})

describe("NotificationInbox panel", () => {
  it("labels the panel and lists every notification on the All tab", async () => {
    await openInbox()

    expect(panel()).toHaveAccessibleName("Notifications")
    expect(within(panel()).getByRole("list")).toBeInTheDocument()
    expect(titles()).toHaveLength(3)
    expect(titles().join(" ")).toContain("Build failed")
    expect(titles().join(" ")).toContain("Deploy queued")
  })

  it("renders a relative timestamp per row", async () => {
    await openInbox()

    expect(rows()[0]).toHaveTextContent(relative(-5, "minute"))
    expect(rows()[2]).toHaveTextContent(relative(-3, "day"))
  })

  it("filters to the unread notifications on the Unread tab", async () => {
    const user = await openInbox()
    await user.click(within(panel()).getByRole("tab", { name: "Unread" }))

    expect(titles()).toHaveLength(2)
    expect(titles().join(" ")).not.toContain("Deploy queued")
  })

  it("shows 'No notifications yet' when there is nothing at all", async () => {
    await openInbox({ notifications: [] })

    expect(within(panel()).getByText("No notifications yet")).toBeInTheDocument()
    expect(within(panel()).queryAllByRole("listitem")).toHaveLength(0)
  })

  it("shows 'All caught up' when nothing is unread", async () => {
    const user = await openInbox({
      notifications: NOTIFICATIONS.map((item) => ({ ...item, read: true })),
    })
    await user.click(within(panel()).getByRole("tab", { name: "Unread" }))

    expect(within(panel()).getByText("All caught up")).toBeInTheDocument()
    expect(within(panel()).queryAllByRole("listitem")).toHaveLength(0)
  })

  it("shows 'All caught up' on the empty Unread tab even with no notifications", async () => {
    const user = await openInbox({ notifications: [] })
    await user.click(within(panel()).getByRole("tab", { name: "Unread" }))

    expect(within(panel()).getByText("All caught up")).toBeInTheDocument()
  })
})

describe("NotificationInbox interactions", () => {
  it("marks an unread row read before reporting the click", async () => {
    const onMarkRead = vi.fn()
    const onItemClick = vi.fn()
    const user = await openInbox({ onMarkRead, onItemClick })

    await user.click(rowButton("Build failed"))

    expect(onMarkRead).toHaveBeenCalledExactlyOnceWith("a")
    expect(onItemClick).toHaveBeenCalledExactlyOnceWith(NOTIFICATIONS[0])
    expect(onMarkRead.mock.invocationCallOrder[0]).toBeLessThan(
      onItemClick.mock.invocationCallOrder[0]
    )
  })

  it("does not re-mark an already read row", async () => {
    const onMarkRead = vi.fn()
    const onItemClick = vi.fn()
    const user = await openInbox({ onMarkRead, onItemClick })

    await user.click(rowButton("Deploy queued"))

    expect(onMarkRead).not.toHaveBeenCalled()
    expect(onItemClick).toHaveBeenCalledExactlyOnceWith(NOTIFICATIONS[1])
  })

  it("survives a row click with no callbacks wired up", async () => {
    const user = await openInbox()
    await user.click(rowButton("Build failed"))

    expect(panel()).toBeInTheDocument()
  })

  it("dismisses a row without reporting it as a click", async () => {
    const onDismiss = vi.fn()
    const onItemClick = vi.fn()
    const onMarkRead = vi.fn()
    const user = await openInbox({ onDismiss, onItemClick, onMarkRead })

    await user.click(within(panel()).getByRole("button", { name: "Dismiss Build failed" }))

    expect(onDismiss).toHaveBeenCalledExactlyOnceWith("a")
    expect(onItemClick).not.toHaveBeenCalled()
    expect(onMarkRead).not.toHaveBeenCalled()
  })

  it("offers 'Mark all as read' only while something is unread", async () => {
    const onMarkAllRead = vi.fn()
    const user = await openInbox({ onMarkAllRead })

    await user.click(within(panel()).getByRole("button", { name: "Mark all as read" }))
    expect(onMarkAllRead).toHaveBeenCalledTimes(1)
  })

  it("hides 'Mark all as read' when everything is read", async () => {
    await openInbox({ notifications: NOTIFICATIONS.map((item) => ({ ...item, read: true })) })

    expect(
      within(panel()).queryByRole("button", { name: "Mark all as read" })
    ).not.toBeInTheDocument()
  })

  // fireEvent, not userEvent: userEvent's own timer plumbing deadlocks against
  // vitest's fake clock here, and opening the popover only needs a click.
  it("re-reads the clock every minute while the panel is open", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    render(
      <NotificationInbox
        notifications={[
          { id: "a", title: "Build failed", timestamp: at(30 * SECOND), read: false },
        ]}
      />
    )

    fireEvent.click(trigger())
    expect(rows()[0]).toHaveTextContent(justNow)

    await act(async () => {
      await vi.advanceTimersByTimeAsync(60 * SECOND)
    })
    expect(rows()[0]).toHaveTextContent(relative(-1, "minute"))
  })

  it("stops the clock when the panel closes", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(NOW)
    const clearInterval = vi.spyOn(globalThis, "clearInterval")
    render(<NotificationInbox notifications={NOTIFICATIONS} />)

    fireEvent.click(trigger())
    fireEvent.click(trigger())

    await act(async () => {})
    expect(clearInterval).toHaveBeenCalled()
  })
})

describe("NotificationInbox href", () => {
  const linked = (href: string): Notification[] => [
    { id: "a", title: "Build failed", timestamp: ago(MINUTE), read: false, href },
  ]

  it.each(["/inbox/1", "https://example.com/x", "mailto:ada@example.com", "tel:+15550123", "#latest"])(
    "renders %s as a real link",
    async (href) => {
      await openInbox({ notifications: linked(href) })

      expect(within(panel()).getByRole("link", { name: /^Unread Build failed/ })).toHaveAttribute(
        "href",
        href
      )
    }
  )

  it.each([
    " JaVaScRiPt:alert(document.cookie)",
    "java\tscript:alert(1)",
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "vbscript:msgbox(1)",
  ])("refuses %s and falls back to a plain button", async (href) => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const onItemClick = vi.fn()
    const user = await openInbox({ notifications: linked(href), onItemClick })

    expect(within(panel()).queryByRole("link")).not.toBeInTheDocument()
    expect(panel().querySelector("[href]")).toBeNull()
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('"a"'))

    // The row is still a working notification, just not a navigable one.
    await user.click(rowButton("Build failed"))
    expect(onItemClick).toHaveBeenCalledTimes(1)
  })
})

describe("NotificationInbox renderItem", () => {
  it("replaces the default row entirely", async () => {
    await openInbox({
      renderItem: (item) => <span>custom {item.title}</span>,
    })

    expect(within(panel()).getByText("custom Build failed")).toBeInTheDocument()
    expect(rows()).toHaveLength(3)
    expect(
      within(panel()).queryByRole("button", { name: "Dismiss Build failed" })
    ).not.toBeInTheDocument()
  })
})

describe("NotificationInbox bad input", () => {
  it("drops malformed notifications and warns instead of throwing", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const notifications = [
      null,
      NOTIFICATIONS[0],
      { id: "a", title: "Duplicate", timestamp: ago(MINUTE), read: false },
      { title: "No id", timestamp: ago(MINUTE), read: false },
      { id: "d", timestamp: ago(MINUTE), read: false },
    ] as unknown as Notification[]

    await openInbox({ notifications })

    expect(titles()).toHaveLength(1)
    expect(titles()[0]).toContain("Build failed")
    expect(warn).toHaveBeenCalled()
  })

  it("treats a non-array as empty", async () => {
    await openInbox({ notifications: undefined as unknown as Notification[] })

    expect(within(panel()).getByText("No notifications yet")).toBeInTheDocument()
    expect(trigger()).toHaveAccessibleName("Notifications, 0 unread")
  })

  it("renders a row whose timestamp is junk without a time element", async () => {
    await openInbox({
      notifications: [
        { id: "a", title: "Build failed", timestamp: new Date("not a date"), read: false },
      ],
    })

    expect(rows()[0]).toHaveTextContent("Build failed")
    expect(panel().querySelector("time")).toBeNull()
  })
})
