import Link from "next/link"
import { KanbanDemo } from "@/components/demos/kanban-demo"
import { EventCalendarDemo } from "@/components/demos/event-calendar-demo"
import { ColorPickerDemo } from "@/components/demos/color-picker-demo"
import { Hero } from "@/components/landing/hero"
import { registryIndex, SITE_URL } from "@/lib/registry-index"

const INSTALL = `npx shadcn@latest add ${SITE_URL}/r/time-picker.json`

const STEPS = [
  {
    title: "Run the command",
    body: "The shadcn CLI reads the registry item and resolves its dependencies.",
  },
  {
    title: "The code lands in your repo",
    body: "A real file under components/ui — no package, no version to chase.",
  },
  {
    title: "Edit it like your own",
    body: "Rename it, strip the parts you don't need, restyle it. Nothing upstream breaks.",
  },
]

export default function Home() {
  return (
    <main className="flex flex-col">
      <Hero />

      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold tracking-tight">See them working</h2>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Three of them, live on this page. Drag a card, click a day, pick a colour.
        </p>
        {/* grid-cols-1 is not a no-op below `lg`: the implicit single track is
            `auto`, so the board (which means to scroll) would size the column and
            push the page past a 375px viewport. `minmax(0, 1fr)` hands the
            overflow back to the demo, where its own scroller catches it. */}
        {/* Two wide cards down the left, the calendar as a full-height rail on the
            right: the month grid is three times the board's height, so any layout
            that puts it beside a single card leaves half a column empty.
            items-start keeps each card at its content's height instead of
            stretching the short one to match. */}
        <div className="mt-10 grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
          <Showcase name="kanban" title="Kanban" className="lg:col-span-2">
            <KanbanDemo />
          </Showcase>
          <Showcase name="event-calendar" title="Event Calendar" className="lg:row-span-2">
            <EventCalendarDemo />
          </Showcase>
          <Showcase name="color-picker" title="Color Picker" className="lg:col-span-2">
            <ColorPickerDemo />
          </Showcase>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">Everything in the registry</h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            {registryIndex.length} components. Each tile opens it in the gallery.
          </p>
          <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {registryIndex.map(({ name, title, category }) => (
              <Link
                key={name}
                href={`/components#${name}`}
                className="bg-card hover:border-ring focus-visible:ring-ring/50 rounded-xl border p-4 transition-[color,border-color,transform] outline-none hover:-translate-y-0.5 focus-visible:ring-3 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
              >
                <span className="block text-sm font-medium">{title}</span>
                <span className="text-muted-foreground mt-1 block text-xs capitalize">
                  {category}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t">
        <div className="mx-auto w-full max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold tracking-tight">How it works</h2>
          <ol className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {STEPS.map(({ title, body }, index) => (
              <li key={title}>
                <span className="border-border text-muted-foreground flex size-8 items-center justify-center rounded-full border font-mono text-sm">
                  {index + 1}
                </span>
                <h3 className="mt-4 font-medium">{title}</h3>
                <p className="text-muted-foreground mt-1 text-sm">{body}</p>
              </li>
            ))}
          </ol>
          <pre className="bg-card mt-10 overflow-x-auto rounded-lg border p-4">
            <code className="font-mono text-xs">{INSTALL}</code>
          </pre>
        </div>
      </section>
    </main>
  )
}

function Showcase({
  name,
  title,
  className,
  children,
}: {
  name: string
  title: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <article
      data-testid="showcase-demo"
      className={`bg-card flex min-w-0 flex-col rounded-xl border ${className ?? ""}`}
    >
      <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
        <h3 className="text-sm font-medium">{title}</h3>
        <Link
          href={`/docs/${name}`}
          aria-label={`${title} docs`}
          className="text-muted-foreground hover:text-foreground text-xs transition-colors motion-reduce:transition-none"
        >
          → docs
        </Link>
      </div>
      <div className="flex min-w-0 flex-1 items-center justify-center p-4">{children}</div>
    </article>
  )
}
