import { act, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { DragEndEvent, SensorContext } from "@dnd-kit/core"
import { Kanban, kanbanKeyboardCoordinates, moveItem, type KanbanColumn } from "./kanban"

// happy-dom has no layout engine: every rect is 0x0, so dnd-kit's keyboard sensor can
// never resolve a neighbouring droppable and a real keyboard drag is a no-op. We keep the
// real DndContext (sensors, live region, announcements all render) and capture its
// `onDragEnd` so the component's own drop handler can be driven with a synthetic event.
const dnd = vi.hoisted(() => ({
  onDragEnd: null as null | ((event: DragEndEvent) => void),
}))

vi.mock("@dnd-kit/core", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@dnd-kit/core")>()
  const react = await import("react")
  return {
    ...actual,
    DndContext: (props: Parameters<typeof actual.DndContext>[0]) => {
      dnd.onDragEnd = props.onDragEnd ?? null
      return react.createElement(actual.DndContext, props)
    },
  }
})

const board = (): KanbanColumn[] => [
  {
    id: "todo",
    title: "To do",
    items: [
      { id: "t1", title: "Write spec" },
      { id: "t2", title: "Review PR" },
    ],
  },
  { id: "doing", title: "In progress", items: [{ id: "d1", title: "Ship kanban" }] },
  { id: "done", title: "Done", items: [] },
]

const ids = (columns: KanbanColumn[]) =>
  columns.map((column) => [column.id, column.items.map((item) => item.id)])

function deepFreeze(columns: KanbanColumn[]) {
  for (const column of columns) {
    column.items.forEach(Object.freeze)
    Object.freeze(column.items)
    Object.freeze(column)
  }
  return Object.freeze(columns) as KanbanColumn[]
}

const drop = (activeId: string, overId: string) =>
  act(() => {
    dnd.onDragEnd?.({ active: { id: activeId }, over: { id: overId } } as DragEndEvent)
  })

// Synthetic geometry — happy-dom measures everything as 0x0, so the rects dnd-kit would
// hand the drop handler in a browser are supplied here instead.
const rect = (top: number, height = 40) => ({
  top,
  left: 0,
  width: 200,
  height,
  bottom: top + height,
  right: 200,
})

const dropAt = (activeId: string, overId: string, activeTop: number, overTop: number) =>
  act(() => {
    dnd.onDragEnd?.({
      active: { id: activeId, rect: { current: { translated: rect(activeTop) } } },
      over: { id: overId, rect: rect(overTop) },
    } as unknown as DragEndEvent)
  })

describe("moveItem", () => {
  it("reorders within a column", () => {
    expect(ids(moveItem(board(), "t1", "todo", 1))).toEqual([
      ["todo", ["t2", "t1"]],
      ["doing", ["d1"]],
      ["done", []],
    ])
  })

  it("moves an item across columns at the given index", () => {
    expect(ids(moveItem(board(), "t1", "doing", 1))).toEqual([
      ["todo", ["t2"]],
      ["doing", ["d1", "t1"]],
      ["done", []],
    ])
  })

  it("clamps an out-of-range index and fills an empty column", () => {
    expect(ids(moveItem(board(), "t1", "done", 99))).toEqual([
      ["todo", ["t2"]],
      ["doing", ["d1"]],
      ["done", ["t1"]],
    ])
    expect(ids(moveItem(board(), "t2", "todo", -5))).toEqual([
      ["todo", ["t2", "t1"]],
      ["doing", ["d1"]],
      ["done", []],
    ])
  })

  it("never mutates its input", () => {
    const input = deepFreeze(board())
    const next = moveItem(input, "t1", "doing", 0)
    expect(ids(input)).toEqual([
      ["todo", ["t1", "t2"]],
      ["doing", ["d1"]],
      ["done", []],
    ])
    expect(next).not.toBe(input)
    expect(next[2]).toBe(input[2]) // untouched columns keep their identity
  })

  it("returns the input unchanged for unknown ids", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const input = board()
    expect(moveItem(input, "nope", "todo", 0)).toBe(input)
    expect(moveItem(input, "t1", "nope", 0)).toBe(input)
    warn.mockRestore()
  })
})

describe("Kanban rendering", () => {
  it("renders every column with its title, count badge and cards", () => {
    render(<Kanban columns={board()} onChange={vi.fn()} />)
    for (const [title, count] of [
      ["To do", "2"],
      ["In progress", "1"],
      ["Done", "0"],
    ]) {
      const column = screen.getByRole("group", { name: title })
      expect(within(column).getByText(count)).toBeInTheDocument()
    }
    expect(screen.getByText("Write spec")).toBeInTheDocument()
    expect(screen.getByText("Ship kanban")).toBeInTheDocument()
  })

  it("shows a drop placeholder in an empty column", () => {
    render(<Kanban columns={board()} onChange={vi.fn()} />)
    const done = screen.getByRole("group", { name: "Done" })
    expect(within(done).getByText("Drop here")).toBeInTheDocument()
    const todo = screen.getByRole("group", { name: "To do" })
    expect(within(todo).queryByText("Drop here")).not.toBeInTheDocument()
  })

  it("uses the renderCard and renderColumnHeader slots when provided", () => {
    render(
      <Kanban
        columns={board()}
        onChange={vi.fn()}
        renderCard={(item, column) => <span>{`${column.id}:${item.title}`}</span>}
        renderColumnHeader={(column) => <h3>{`${column.title} (${column.items.length})`}</h3>}
      />
    )
    expect(screen.getByText("todo:Write spec")).toBeInTheDocument()
    expect(screen.getByText("To do (2)")).toBeInTheDocument()
    expect(screen.queryByText("Write spec")).not.toBeInTheDocument()
  })

  it("makes cards keyboard-reachable draggables", () => {
    render(<Kanban columns={board()} onChange={vi.fn()} />)
    const card = screen.getByRole("button", { name: /Write spec/ })
    expect(card).toHaveAttribute("tabindex", "0")
    expect(card).toHaveAttribute("aria-roledescription", "sortable")
    expect(card).toHaveAttribute("aria-disabled", "false")
  })

  it("disables dragging when disabled", () => {
    render(<Kanban columns={board()} onChange={vi.fn()} disabled />)
    expect(screen.getByRole("button", { name: /Write spec/ })).toHaveAttribute(
      "aria-disabled",
      "true"
    )
  })

  it("wires dnd-kit screen reader instructions and a live region", () => {
    render(<Kanban columns={board()} onChange={vi.fn()} />)
    expect(screen.getByRole("status")).toHaveAttribute("aria-live", "assertive")
    expect(screen.getByText(/press space or enter to pick up a card/i)).toBeInTheDocument()
  })

  it("drops invalid columns and items with a dev warning instead of throwing", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    const columns = [
      { id: "todo", title: "To do", items: [{ id: "t1", title: "Write spec" }, null] },
      { id: "todo", title: "Duplicate", items: [] },
      { title: "No id", items: [] },
      { id: "empty", title: "No items key" },
    ] as unknown as KanbanColumn[]
    render(<Kanban columns={columns} onChange={vi.fn()} />)
    expect(screen.getByText("Write spec")).toBeInTheDocument()
    expect(screen.getByRole("group", { name: "No items key" })).toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "Duplicate" })).not.toBeInTheDocument()
    expect(screen.queryByRole("group", { name: "No id" })).not.toBeInTheDocument()
    expect(warn.mock.calls.flat().join(" ")).toContain("Kanban")
    warn.mockRestore()
  })
})

describe("Kanban onChange", () => {
  it("is not called during render or mount", () => {
    const onChange = vi.fn()
    const { rerender } = render(<Kanban columns={board()} onChange={onChange} />)
    rerender(<Kanban columns={board()} onChange={onChange} />)
    expect(onChange).not.toHaveBeenCalled()
  })

  it("warns when columns are passed without onChange", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {})
    render(<Kanban columns={board()} />)
    expect(warn.mock.calls.flat().join(" ")).toContain("`columns` without `onChange`")
    warn.mockRestore()
  })

  it("fires once with the reordered board when a card is dropped on another card", () => {
    const onChange = vi.fn()
    const columns = board()
    render(<Kanban columns={columns} onChange={onChange} />)
    drop("t1", "t2")
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(ids(onChange.mock.calls[0][0])).toEqual([
      ["todo", ["t2", "t1"]],
      ["doing", ["d1"]],
      ["done", []],
    ])
    expect(ids(columns)).toEqual([
      ["todo", ["t1", "t2"]],
      ["doing", ["d1"]],
      ["done", []],
    ]) // the prop is data-in only
  })

  it("moves a card onto the card it was dropped over in another column", () => {
    const onChange = vi.fn()
    render(<Kanban columns={board()} onChange={onChange} />)
    drop("t1", "d1")
    expect(ids(onChange.mock.calls[0][0])).toEqual([
      ["todo", ["t2"]],
      ["doing", ["t1", "d1"]],
      ["done", []],
    ])
  })

  it("drops after the hovered card when the dragged card's center is past its midpoint", () => {
    const onChange = vi.fn()
    render(<Kanban columns={board()} onChange={onChange} />)
    dropAt("t1", "d1", 120, 100) // dragged center 140 > d1 center 120
    expect(ids(onChange.mock.calls[0][0])).toEqual([
      ["todo", ["t2"]],
      ["doing", ["d1", "t1"]],
      ["done", []],
    ])
  })

  it("drops before the hovered card when the center is above its midpoint", () => {
    const onChange = vi.fn()
    render(<Kanban columns={board()} onChange={onChange} />)
    dropAt("t1", "d1", 80, 100) // dragged center 100 < d1 center 120
    expect(ids(onChange.mock.calls[0][0])).toEqual([
      ["todo", ["t2"]],
      ["doing", ["t1", "d1"]],
      ["done", []],
    ])
  })

  it("keeps arrayMove semantics for a within-column drop past a midpoint", () => {
    const onChange = vi.fn()
    const columns: KanbanColumn[] = [
      {
        id: "todo",
        title: "To do",
        items: [
          { id: "t1", title: "One" },
          { id: "t2", title: "Two" },
          { id: "t3", title: "Three" },
        ],
      },
    ]
    render(<Kanban columns={columns} onChange={onChange} />)
    // Removing the card first already shifts the tail up, so no midpoint bump here.
    dropAt("t1", "t2", 120, 100)
    expect(ids(onChange.mock.calls[0][0])).toEqual([["todo", ["t2", "t1", "t3"]]])
  })

  it("appends to the end when dropped on a column container", () => {
    const onChange = vi.fn()
    render(<Kanban columns={board()} onChange={onChange} />)
    drop("t1", "done")
    expect(ids(onChange.mock.calls[0][0])).toEqual([
      ["todo", ["t2"]],
      ["doing", ["d1"]],
      ["done", ["t1"]],
    ])
  })

  it("stays quiet for a cancelled drop, a self drop, and while disabled", () => {
    const onChange = vi.fn()
    const { rerender } = render(<Kanban columns={board()} onChange={onChange} />)
    act(() => {
      dnd.onDragEnd?.({ active: { id: "t1" }, over: null } as DragEndEvent)
    })
    drop("t1", "t1")
    rerender(<Kanban columns={board()} onChange={onChange} disabled />)
    drop("t1", "done")
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe("kanbanKeyboardCoordinates", () => {
  // Synthetic board geometry — three columns side by side, cards stacked in each.
  // happy-dom measures nothing, so the rects dnd-kit would hand the getter are supplied here.
  const box = (left: number, top: number, width: number, height: number) => ({
    left,
    top,
    width,
    height,
    right: left + width,
    bottom: top + height,
  })

  const RECTS: Record<string, ReturnType<typeof box>> = {
    todo: box(0, 0, 240, 300),
    t1: box(8, 40, 224, 60),
    t2: box(8, 110, 224, 60),
    doing: box(260, 0, 240, 300),
    d1: box(268, 40, 224, 60),
    done: box(520, 0, 240, 300),
  }

  const OWNER: Record<string, string> = { t1: "todo", t2: "todo", d1: "doing" }

  const context = (overId: string | null) => {
    const entries = Object.keys(RECTS).map((id) => ({
      id,
      data: {
        current: OWNER[id]
          ? { type: "item", columnId: OWNER[id] }
          : { type: "column" },
      },
    }))
    const containers = Object.assign(new Map(entries.map((entry) => [entry.id, entry])), {
      getEnabled: () => entries,
    })
    return {
      droppableContainers: containers,
      droppableRects: new Map(Object.entries(RECTS)),
      over: overId ? { id: overId } : null,
    } as unknown as SensorContext
  }

  const press = (code: string, overId: string | null, activeId = "t1") => {
    const event = new KeyboardEvent("keydown", { code, cancelable: true })
    const coordinates = kanbanKeyboardCoordinates(event, {
      active: activeId,
      currentCoordinates: { x: 0, y: 0 },
      context: context(overId),
    })
    return { coordinates, event }
  }

  const origin = (id: string) => ({ x: RECTS[id].left, y: RECTS[id].top })

  it("moves to the previous and next card in the column", () => {
    expect(press("ArrowDown", "t1").coordinates).toEqual(origin("t2"))
    expect(press("ArrowUp", "t2").coordinates).toEqual(origin("t1"))
  })

  it("targets the card below the last one so the end of a column is reachable", () => {
    expect(press("ArrowDown", "t2").coordinates).toEqual({
      x: RECTS.t2.left,
      y: RECTS.t2.top + RECTS.t2.height,
    })
  })

  it("moves left into the previous column at the same slot", () => {
    expect(press("ArrowLeft", "d1").coordinates).toEqual(origin("t1"))
  })

  it("moves right into the next column at the same slot", () => {
    expect(press("ArrowRight", "t1").coordinates).toEqual(origin("d1"))
  })

  it("targets an empty column's own droppable", () => {
    expect(press("ArrowRight", "d1").coordinates).toEqual(origin("done"))
  })

  it("falls back to the dragged card's own slot when nothing is hovered yet", () => {
    expect(press("ArrowDown", null, "t1").coordinates).toEqual(origin("t2"))
  })

  it("stays put at the edges of the board", () => {
    expect(press("ArrowUp", "t1").coordinates).toBeUndefined()
    expect(press("ArrowLeft", "t1").coordinates).toBeUndefined()
    expect(press("ArrowRight", "done", "d1").coordinates).toBeUndefined()
  })

  it("keeps hold of arrow keys but ignores everything else", () => {
    expect(press("ArrowDown", "t1").event.defaultPrevented).toBe(true)
    const space = press("Space", "t1")
    expect(space.coordinates).toBeUndefined()
    expect(space.event.defaultPrevented).toBe(false)
  })
})
