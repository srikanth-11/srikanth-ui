"use client"
import * as React from "react"
import { Kanban, type KanbanColumn } from "@/registry/ui/kanban"

const INITIAL: KanbanColumn[] = [
  {
    id: "todo",
    title: "Todo",
    items: [
      { id: "t1", title: "Audit empty states" },
      { id: "t2", title: "Write migration notes" },
    ],
  },
  {
    id: "doing",
    title: "In progress",
    items: [{ id: "t3", title: "Ship dark mode tokens" }],
  },
  {
    id: "done",
    title: "Done",
    items: [{ id: "t4", title: "Fix focus ring on Safari" }],
  },
]

export function KanbanDemo() {
  // Controlled only — the board renders what it is given, so the move has to be
  // written back or the card springs home.
  const [columns, setColumns] = React.useState(INITIAL)
  return (
    <Kanban
      columns={columns}
      onChange={setColumns}
      // Narrowed so all three columns read inside a docs card; the default w-64 is
      // the right width in a real app, where the board owns the page. Three columns
      // are wider than a phone either way, so on a narrow screen the board's own
      // `overflow-x-auto` takes over and it scrolls inside the card.
      className="w-full min-w-0 [&_[data-column-id]]:w-40"
    />
  )
}
