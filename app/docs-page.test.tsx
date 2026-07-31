import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { componentDocs } from "@/lib/docs"
import { CATEGORY_LABELS } from "@/lib/registry-index"
import { registryMeta, SITE_URL } from "@/lib/registry-meta"

// The identity <pre> stands in for the shiki block: `CodeBlock` is async, and
// react-dom's client renderer refuses an async component outright ("Only Server
// Components can be async"), so the real one cannot render here at all. It keeps
// shiki out of this suite too, and it has its own tests (components/docs).
vi.mock("@/components/docs/code-block", () => ({
  CodeBlock: ({ code }: { code: string }) => <pre>{code}</pre>,
}))

const { default: ComponentPage } = await import("./docs/[component]/page")

const meta = (name: string) => registryMeta.find((entry) => entry.name === name)!

async function renderPage(component: string) {
  // A server component is just an async function: call it, render what it returns.
  render(await ComponentPage({ params: Promise.resolve({ component }) }))
}

describe("component docs page", () => {
  it("renders the header, tabs, how to use, install and usage sections", async () => {
    await renderPage("kanban")
    const kanban = meta("kanban")

    expect(screen.getByRole("heading", { level: 1, name: kanban.title })).toBeInTheDocument()
    expect(screen.getByText(CATEGORY_LABELS[kanban.category])).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /preview/i })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: /code/i })).toBeInTheDocument()

    for (const step of kanban.howToUse) {
      expect(screen.getByText(step), step).toBeInTheDocument()
    }

    expect(screen.getByRole("heading", { name: /installation/i })).toBeInTheDocument()
    expect(screen.getByText(`npx shadcn@latest add ${SITE_URL}/r/kanban.json`)).toBeInTheDocument()

    for (const example of componentDocs.kanban.examples) {
      expect(screen.getByRole("heading", { name: example.title }), example.title).toBeInTheDocument()
    }
  })

  it("renders both install forms and the one-time namespace setup", async () => {
    await renderPage("kanban")

    expect(screen.getByText(`npx shadcn@latest add ${SITE_URL}/r/kanban.json`)).toBeInTheDocument()
    expect(screen.getByText("npx shadcn@latest add @srikanth/kanban")).toBeInTheDocument()
    expect(screen.getByText(/one-time setup/i)).toBeInTheDocument()
    expect(
      screen.getByText(`{ "registries": { "@srikanth": { "url": "${SITE_URL}/r/{name}.json" } } }`)
    ).toBeInTheDocument()
  })

  it("renders a props table per documented export, and the keyboard rows", async () => {
    await renderPage("kanban")

    for (const docExport of componentDocs.kanban.exports) {
      expect(
        screen.getByRole("heading", { level: 3, name: docExport.name }),
        docExport.name
      ).toBeInTheDocument()
    }
    // A row from the main export's actual prop list, with its type cell. `columns`
    // is documented on `Kanban` and on `moveItem`, so both spellings repeat.
    const columns = componentDocs.kanban.exports[0].props.find((prop) => prop.name === "columns")!
    expect(screen.getAllByText("columns").length).toBeGreaterThan(0)
    expect(screen.getAllByText(columns.type).length).toBeGreaterThan(0)

    // Level 2: `kanbanKeyboardCoordinates` is an h3 in the props tables above.
    expect(screen.getByRole("heading", { level: 2, name: "Keyboard" })).toBeInTheDocument()
    for (const row of componentDocs.kanban.keyboard!) {
      expect(screen.getByText(row.keys), row.keys).toBeInTheDocument()
    }
  })

  it("omits the keyboard section for a component without keyboard rows", async () => {
    await renderPage("password-input")
    expect(componentDocs["password-input"].keyboard).toBeUndefined()
    expect(screen.queryByRole("heading", { level: 2, name: "Keyboard" })).toBeNull()
  })

  it("renders the error state prose with the invalid demo, and the steps exactly once", async () => {
    await renderPage("image-cropper")

    expect(screen.getByRole("heading", { name: /error state/i })).toBeInTheDocument()
    expect(screen.getByText(/Framing cannot go wrong/)).toBeInTheDocument()
    // The invalid demo's own message: proof the InvalidDemo actually mounted.
    expect(screen.getByText("Image must be at least 400×400")).toBeInTheDocument()

    // The demo used to print this list itself; now only "How to use" does.
    for (const step of meta("image-cropper").howToUse) {
      expect(screen.getAllByText(step), step).toHaveLength(1)
    }
  })
})
