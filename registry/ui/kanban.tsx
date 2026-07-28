"use client"

import * as React from "react"
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type DragStartEvent,
  type ScreenReaderInstructions,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"

interface KanbanItem {
  id: string
  title: string
  [key: string]: unknown
}

interface KanbanColumn {
  id: string
  title: string
  items: KanbanItem[]
}

const clamp = (value: number, max: number) => Math.min(Math.max(value, 0), max)

/**
 * Returns a new board with `itemId` placed at `toIndex` of `toColumnId`.
 *
 * Pure: the input array, its columns and its items are never mutated — untouched
 * columns keep their identity so consumers can memo on them. Unknown ids, an index
 * that lands the item where it already is, or anything else that would be a no-op
 * return the input array itself (reference-equal), so callers can skip `onChange`.
 */
function moveItem(
  columns: KanbanColumn[],
  itemId: string,
  toColumnId: string,
  toIndex: number
): KanbanColumn[] {
  if (!Array.isArray(columns)) return columns
  const from = columns.findIndex((column) => column?.items?.some((item) => item?.id === itemId))
  const to = columns.findIndex((column) => column?.id === toColumnId)
  if (from === -1 || to === -1) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `Kanban: moveItem ignored — ${from === -1 ? `no item "${itemId}"` : `no column "${toColumnId}"`} on this board.`
      )
    }
    return columns
  }

  const fromIndex = columns[from].items.findIndex((item) => item.id === itemId)
  const item = columns[from].items[fromIndex]
  const source = columns[from].items.filter((candidate) => candidate.id !== itemId)
  const target = from === to ? source : columns[to].items
  const index = clamp(toIndex, target.length)
  if (from === to && index === fromIndex) return columns

  const nextTarget = [...target.slice(0, index), item, ...target.slice(index)]
  return columns.map((column, i) =>
    i === to
      ? { ...column, items: nextTarget }
      : i === from
        ? { ...column, items: source }
        : column
  )
}

const screenReaderInstructions: ScreenReaderInstructions = {
  draggable:
    "Press space or enter to pick up a card. While dragging, use the arrow keys to move the card within its column or to another column. Press space or enter again to drop the card, or press escape to cancel.",
}

interface KanbanContextValue {
  renderCard?: (item: KanbanItem, column: KanbanColumn) => React.ReactNode
  renderColumnHeader?: (column: KanbanColumn) => React.ReactNode
  disabled: boolean
}

const KanbanContext = React.createContext<KanbanContextValue>({ disabled: false })

function DefaultCard({ item }: { item: KanbanItem }) {
  return (
    <Card size="sm">
      <CardContent>{item.title}</CardContent>
    </Card>
  )
}

function KanbanCard({ item, column }: { item: KanbanItem; column: KanbanColumn }) {
  const { renderCard, disabled } = React.useContext(KanbanContext)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
    disabled,
    data: { type: "item", columnId: column.id },
  })

  return (
    <div
      ref={setNodeRef}
      data-item-id={item.id}
      data-dragging={isDragging || undefined}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn(
        "focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none",
        isDragging && "opacity-40",
        !disabled && "cursor-grab active:cursor-grabbing"
      )}
      {...attributes}
      {...listeners}
    >
      {renderCard ? renderCard(item, column) : <DefaultCard item={item} />}
    </div>
  )
}

function KanbanColumnView({ column }: { column: KanbanColumn }) {
  const { renderColumnHeader } = React.useContext(KanbanContext)
  const { setNodeRef, isOver } = useDroppable({ id: column.id, data: { type: "column" } })
  const itemIds = React.useMemo(() => column.items.map((item) => item.id), [column.items])

  return (
    <div
      role="group"
      aria-label={column.title}
      data-column-id={column.id}
      className="bg-muted/40 flex w-64 shrink-0 flex-col gap-2 rounded-xl p-2"
    >
      {renderColumnHeader?.(column) ?? (
        <div className="flex items-center justify-between gap-2 px-1">
          <span className="text-sm font-medium">{column.title}</span>
          <Badge variant="secondary">{column.items.length}</Badge>
        </div>
      )}
      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          data-over={isOver || undefined}
          className={cn(
            "flex min-h-24 flex-1 flex-col gap-2 rounded-lg p-1 transition-colors",
            isOver && "bg-accent/60"
          )}
        >
          {column.items.map((item) => (
            <KanbanCard key={item.id} item={item} column={column} />
          ))}
          {column.items.length === 0 && (
            <p className="text-muted-foreground flex flex-1 items-center justify-center p-4 text-center text-xs">
              Drop here
            </p>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

interface KanbanProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Board data. Controlled only — the board never forks state, it renders what you pass. */
  columns: KanbanColumn[]
  onChange?: (columns: KanbanColumn[]) => void
  renderCard?: (item: KanbanItem, column: KanbanColumn) => React.ReactNode
  renderColumnHeader?: (column: KanbanColumn) => React.ReactNode
  /** Renders the board read-only: cards stay focusable but cannot be picked up. */
  disabled?: boolean
}

const Kanban = React.forwardRef<HTMLDivElement, KanbanProps>(
  (
    { columns, onChange, renderCard, renderColumnHeader, disabled = false, className, ...props },
    ref
  ) => {
    const [activeId, setActiveId] = React.useState<string | null>(null)

    if (process.env.NODE_ENV !== "production" && !onChange) {
      console.warn("Kanban: `columns` without `onChange` — the board is read-only.")
    }

    // Bad data is dropped, never thrown on. Column ids and item ids share one dnd-kit id
    // space, so duplicates across either kind would make drops ambiguous — one `seen` set
    // covers both. onChange payloads are built from this sanitized board.
    const board = React.useMemo(() => {
      const source = Array.isArray(columns) ? columns : []
      const seen = new Set<string>()
      const invalid: string[] = []
      const next: KanbanColumn[] = []
      let changed = false
      for (const column of source) {
        if (!column || typeof column.id !== "string" || seen.has(column.id)) {
          invalid.push(`column ${column?.id ?? "<no id>"}`)
          changed = true
          continue
        }
        seen.add(column.id)
        const items = (Array.isArray(column.items) ? column.items : []).filter((item) => {
          if (!item || typeof item.id !== "string" || seen.has(item.id)) {
            invalid.push(`item ${item?.id ?? "<no id>"}`)
            changed = true
            return false
          }
          seen.add(item.id)
          return true
        })
        const kept = Array.isArray(column.items) && items.length === column.items.length
        if (!kept) changed = true
        next.push(kept ? column : { ...column, items })
      }
      if (process.env.NODE_ENV !== "production" && invalid.length > 0) {
        console.warn(
          `Kanban: ignoring ${invalid.length} entr${invalid.length === 1 ? "y" : "ies"} with a missing or duplicate id: ${invalid.join(", ")}`
        )
      }
      return changed ? next : (source as KanbanColumn[])
    }, [columns])

    const sensors = useSensors(
      // A few pixels of slop so a click on a card is still a click, not a drag.
      useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
      useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    )

    const locate = React.useCallback(
      (id: UniqueIdentifier | undefined) => {
        if (id == null) return undefined
        const key = String(id)
        for (const column of board) {
          const item = column.items.find((candidate) => candidate.id === key)
          if (item) return { item, column }
        }
        const column = board.find((candidate) => candidate.id === key)
        return column ? { item: undefined, column } : undefined
      },
      [board]
    )

    const announcements = React.useMemo<Announcements>(() => {
      const cardName = (id: UniqueIdentifier | undefined) => locate(id)?.item?.title ?? "card"
      const dropName = (id: UniqueIdentifier | undefined) => {
        const found = locate(id)
        if (!found) return "an unknown position"
        return found.item ? `${found.item.title} in ${found.column.title}` : found.column.title
      }
      return {
        onDragStart: ({ active }) =>
          `Picked up ${cardName(active.id)} from ${locate(active.id)?.column.title ?? "the board"}.`,
        onDragOver: ({ active, over }) =>
          over
            ? `${cardName(active.id)} is over ${dropName(over.id)}.`
            : `${cardName(active.id)} is no longer over a column.`,
        onDragEnd: ({ active, over }) =>
          over
            ? `${cardName(active.id)} was dropped on ${dropName(over.id)}.`
            : `${cardName(active.id)} was dropped back where it started.`,
        onDragCancel: ({ active }) => `Dragging cancelled. ${cardName(active.id)} was not moved.`,
      }
    }, [locate])

    const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id))

    const handleDragEnd = (event: DragEndEvent) => {
      setActiveId(null)
      const { active, over } = event
      if (!over || disabled) return
      const target = locate(over.id)?.column
      if (!target) return
      // Dropped on a card → take its slot; dropped on the column itself → append.
      const overIndex = target.items.findIndex((item) => item.id === String(over.id))
      // Crossing columns, a card released past the hovered card's midpoint belongs after it —
      // otherwise the last slot of a non-empty column is unreachable, since collision detection
      // always picks the nearest card over the column itself. Within a column no bump: moveItem
      // removes the card first, which already shifts the tail up (arrayMove semantics).
      const dragged = active.rect?.current?.translated
      const past =
        locate(active.id)?.column !== target &&
        !!dragged &&
        !!over.rect &&
        dragged.top + dragged.height / 2 > over.rect.top + over.rect.height / 2
      const next = moveItem(
        board,
        String(active.id),
        target.id,
        overIndex === -1 ? target.items.length : overIndex + (past ? 1 : 0)
      )
      if (next !== board) onChange?.(next)
    }

    const active = activeId ? locate(activeId) : undefined
    const context = React.useMemo(
      () => ({ renderCard, renderColumnHeader, disabled }),
      [renderCard, renderColumnHeader, disabled]
    )

    return (
      <KanbanContext.Provider value={context}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          accessibility={{ announcements, screenReaderInstructions }}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div
            ref={ref}
            className={cn("flex items-start gap-3 overflow-x-auto pb-2", className)}
            {...props}
          >
            {board.map((column) => (
              <KanbanColumnView key={column.id} column={column} />
            ))}
          </div>
          <DragOverlay>
            {active?.item ? (
              <div className="w-64 rotate-2 cursor-grabbing">
                {renderCard ? (
                  renderCard(active.item, active.column)
                ) : (
                  <DefaultCard item={active.item} />
                )}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </KanbanContext.Provider>
    )
  }
)
Kanban.displayName = "Kanban"

export { Kanban, moveItem, type KanbanColumn, type KanbanItem, type KanbanProps }
