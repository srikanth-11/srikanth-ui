import type { ComponentDoc } from "./types"

export const kanbanDoc: ComponentDoc = {
  exports: [
    {
      name: "Kanban",
      props: [
        {
          name: "columns",
          type: "KanbanColumn[]",
          description: "The board. Required and controlled only, so the board never forks state. It renders what you pass and reports the next board through `onChange`.",
        },
        {
          name: "onChange",
          type: "(columns: KanbanColumn[]) => void",
          description: "Fires with the next board after a drop that actually moves a card. A drop that changes nothing is skipped. Without it the board is read-only (dev-warned).",
        },
        {
          name: "renderCard",
          type: "(item: KanbanItem, column: KanbanColumn) => React.ReactNode",
          description: "Replaces the default card body. Used for the drag overlay too, so the card in flight matches the one in the column.",
        },
        {
          name: "renderColumnHeader",
          type: "(column: KanbanColumn) => React.ReactNode",
          description: "Replaces the default header, which is the column title with a count badge.",
        },
        {
          name: "disabled",
          type: "boolean",
          default: "false",
          description: "Renders the board read-only: cards keep their tab stop and `aria-disabled=\"true\"`, but cannot be picked up and no drop reaches `onChange`.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the horizontally scrolling row of columns.",
        },
      ],
    },
    {
      name: "KanbanColumn",
      props: [
        {
          name: "id",
          type: "string",
          description: "Drop target id, and the `toColumnId` `moveItem` takes. Must be a non-duplicate string, since column and card ids share one id space.",
        },
        {
          name: "title",
          type: "string",
          description: "Header label, and the column's `aria-label` for the group wrapper and the drag announcements.",
        },
        {
          name: "items",
          type: "KanbanItem[]",
          description: "Cards in order. A missing or non-array value is read as an empty column, which still renders its \"Drop here\" placeholder.",
        },
      ],
    },
    {
      name: "KanbanItem",
      props: [
        {
          name: "id",
          type: "string",
          description: "Draggable id and React key. Must be a non-duplicate string across every card and column on the board.",
        },
        {
          name: "title",
          type: "string",
          description: "Default card body, and the name used in the drag announcements even when `renderCard` draws something else.",
        },
        {
          name: "[key: string]",
          type: "unknown",
          description: "Anything else you attach rides along untouched. `renderCard` gets the whole item back.",
        },
      ],
    },
    {
      name: "moveItem",
      props: [
        {
          name: "columns",
          type: "KanbanColumn[]",
          description: "The board to move within. Never mutated, and neither are its columns or its items.",
        },
        {
          name: "itemId",
          type: "string",
          description: "The card to move. An id no column holds is a no-op with a dev warning.",
        },
        {
          name: "toColumnId",
          type: "string",
          description: "The destination column. An unknown id is a no-op with a dev warning.",
        },
        {
          name: "toIndex",
          type: "number",
          description: "Slot in the destination, clamped into range. Within one column the card is removed before it is reinserted, so the index refers to the list without it.",
        },
        {
          name: "→ returns",
          type: "KanbanColumn[]",
          description: "A new board with untouched columns kept by identity, so consumers can memo on them. When the move would change nothing it hands back the input array itself (reference-equal), which is how the board decides to skip `onChange`.",
        },
      ],
    },
    {
      name: "kanbanKeyboardCoordinates",
      props: [
        {
          name: "event",
          type: "KeyboardEvent",
          description: "The key the drag sensor caught. Anything that is not an `Arrow*` code is left alone. Arrows are `preventDefault()`ed so the page does not scroll under the drag.",
        },
        {
          name: "args",
          type: "{ active: UniqueIdentifier; currentCoordinates: Coordinates; context: SensorContext }",
          description: "dnd-kit's sensor state. The board is walked structurally through `context`, using the `type`/`columnId` data every droppable here carries, instead of by rect geometry. That is what makes left/right and within-column up/down work across several `SortableContext`s.",
        },
        {
          name: "→ returns",
          type: "Coordinates | void",
          description: "The viewport point to align the dragged card with, so collision detection resolves to that slot. Nothing when the move would leave the board. Pass it to dnd-kit as `useSensor(KeyboardSensor, { coordinateGetter: kanbanKeyboardCoordinates })`. `Kanban` already does.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Controlled board",
      code: `"use client"

import * as React from "react"
import { Kanban, type KanbanColumn } from "@/components/ui/kanban"

const INITIAL: KanbanColumn[] = [
  {
    id: "todo",
    title: "To do",
    items: [
      { id: "spec", title: "Write the spec" },
      { id: "audit", title: "Audit the icons" },
    ],
  },
  { id: "doing", title: "In progress", items: [{ id: "api", title: "Draft the API" }] },
  { id: "done", title: "Done", items: [] },
]

export function Board() {
  const [columns, setColumns] = React.useState(INITIAL)

  // Only fires when a drop actually moves something, so this is safe to persist from.
  return <Kanban columns={columns} onChange={setColumns} />
}`,
    },
    {
      title: "Custom cards and headers",
      code: `"use client"

import * as React from "react"
import { Kanban, type KanbanColumn } from "@/components/ui/kanban"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

type Ticket = { id: string; title: string; assignee: string }

export function TicketBoard({ initial }: { initial: KanbanColumn[] }) {
  const [columns, setColumns] = React.useState(initial)

  return (
    <Kanban
      columns={columns}
      onChange={setColumns}
      renderCard={(item) => (
        <Card size="sm">
          <CardContent className="flex items-center justify-between gap-2">
            <span>{item.title}</span>
            <Badge variant="outline">{(item as Ticket).assignee}</Badge>
          </CardContent>
        </Card>
      )}
      renderColumnHeader={(column) => (
        <h3 className="px-1 text-sm font-medium">
          {column.title} · {column.items.length}
        </h3>
      )}
    />
  )
}`,
    },
    {
      title: "Moving a card from code",
      code: `import { moveItem, type KanbanColumn } from "@/components/ui/kanban"

// Send a card to the top of another column, with the same helper the board uses on drop.
export function promote(columns: KanbanColumn[], itemId: string) {
  const next = moveItem(columns, itemId, "doing", 0)
  // Reference-equal means nothing moved: unknown id, or it was already there.
  return next === columns ? null : next
}`,
    },
  ],
  keyboard: [
    {
      keys: "Tab",
      action: "Moves between cards. Every card is a focusable draggable carrying dnd-kit's instructions, announced as \"sortable\".",
    },
    {
      keys: "Space / Enter",
      action: "Picks up the focused card, and presses again to drop it. Ignored while `disabled`.",
    },
    {
      keys: "Arrow Up / Arrow Down",
      action: "While dragging, moves one slot within the column, including the empty slot after the last card, so the end of a column is reachable.",
    },
    {
      keys: "Arrow Left / Arrow Right",
      action: "While dragging, moves to the neighbouring column, keeping the same slot where it exists and taking the end where it doesn't. Columns are ordered visually, so this stays correct under RTL.",
    },
    {
      keys: "Escape",
      action: "Cancels the drag. The card returns to where it started and `onChange` never fires.",
    },
    {
      keys: "Tab (while dragging)",
      action: "Also ends the drag at the current slot. dnd-kit's keyboard sensor treats Tab as a drop, so focus can never escape mid-drag.",
    },
  ],
  errorState:
    "There is no `error` prop. The failure mode is a malformed board, and it is sanitized rather than thrown on. A column needs a string `id`, a card needs a string `id`, and both are checked against one shared set. dnd-kit gives columns and cards the same id space, so a card that reuses a column's id would make drops ambiguous. Entries that fail either test are dropped and dev-warned together (\"ignoring N entries with a missing or duplicate id\"), a column whose `items` is missing or not an array renders empty, and a `columns` prop that is not an array renders an empty board. Nothing is repaired in place. When everything checks out the array you passed is used as-is, so memoized columns keep their identity. Every `onChange` payload is built from the sanitized board, which means a dropped entry never comes back out of the component and round-tripping the payload into state quietly prunes the bad data. `moveItem` is the same story standalone. An unknown item or column id returns the input array with a dev warning, a non-array is handed straight back, and `toIndex` is clamped instead of rejected. Passing `columns` without `onChange` is the one mistake that looks like nothing: cards drag, snap back and dev-warn that the board is read-only.",
}
