import * as React from "react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { PreviewTabs } from "./preview-tabs"

function Counter() {
  const [count, setCount] = React.useState(0)
  return <button onClick={() => setCount(count + 1)}>count {count}</button>
}

describe("preview tabs", () => {
  it("keeps the demo mounted, so reading the code does not undo the reader's work", async () => {
    const user = userEvent.setup()
    render(<PreviewTabs preview={<Counter />} code={<pre>source</pre>} />)

    // Standing in for a crop box dragged, a signature drawn, a board rearranged:
    // unmounting the preview between tabs throws all of it away.
    await user.click(screen.getByRole("button", { name: "count 0" }))
    await user.click(screen.getByRole("tab", { name: "Code" }))
    await user.click(screen.getByRole("tab", { name: "Preview" }))

    expect(screen.getByRole("button", { name: "count 1" })).toBeInTheDocument()
  })

  it("hides the mounted preview while the code tab is open", async () => {
    const user = userEvent.setup()
    render(<PreviewTabs preview={<Counter />} code={<pre>source</pre>} />)
    await user.click(screen.getByRole("tab", { name: "Code" }))

    // forceMount drops Radix's `hidden`, so the class is the only thing left
    // keeping both panes from stacking on top of each other.
    const preview = screen.getByRole("tabpanel", { hidden: true, name: "Preview" })
    expect(preview).toHaveAttribute("data-state", "inactive")
    expect(preview).toHaveClass("data-[state=inactive]:hidden")
  })
})
