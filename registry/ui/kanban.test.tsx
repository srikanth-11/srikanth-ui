import { act, render, screen, within } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import type { DragEndEvent } from "@dnd-kit/core"
import { Kanban, moveItem, type KanbanColumn } from "./kanban"

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
