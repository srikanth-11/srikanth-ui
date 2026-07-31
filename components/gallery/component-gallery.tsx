"use client"
import * as React from "react"
import Link from "next/link"
import { registryMeta, type ComponentCategory } from "@/lib/registry-meta"
import { CATEGORY_LABELS } from "@/lib/registry-index"
import { InstallCommand } from "@/components/install-command"
import { LazyPreview } from "@/components/gallery/lazy-preview"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

/** Pills and section headings both read from the shared labels — one spelling, one order. */
const CATEGORIES = (Object.entries(CATEGORY_LABELS) as [ComponentCategory, string][]).map(
  ([value, label]) => ({ value, label })
)

// A board and a month grid only read as a preview scaled down; the 133% width
// gives the scaled content the full card back. Everything else, including the
// third widget (a bell), sits at its own size in a shorter box.
const WIDE = new Set(["event-calendar", "kanban"])

// The image-cropper demo prints its own numbered steps directly above the
// cropper (they are the whole point of that demo), and they are the same three
// strings as its `howToUse`. Printing the modal's list too would show them
// twice, so the modal defers to the demo for this one component.
const DEMO_RENDERS_OWN_STEPS = new Set(["image-cropper"])

// The tour dims the page with a position:fixed overlay, and DialogContent is
// centred with a transform — which makes it the containing block for anything
// fixed inside it, so the spotlight lands in the modal's own coordinates rather
// than the viewport's. Verified in the browser; the design doc's sanctioned
// fallback is to send this one component to its docs page instead.
const NO_MODAL_DEMO = new Set(["onboarding-tour"])

type Filter = ComponentCategory | "all"

/**
 * The name in `location.hash`, for the card that should mark itself.
 *
 * `:target` would be free, but it is never set here: a wall tile on the landing
 * page is a soft navigation, and pushState does not update the document's target
 * element — only a real fragment navigation or a history traversal does. Reading
 * the hash on mount covers both entry paths (a soft nav mounts this component,
 * a direct load renders it), and `hashchange` covers back/forward between cards.
 */
function useHashHighlight() {
  const [name, setName] = React.useState("")
  React.useEffect(() => {
    const read = () => setName(window.location.hash.slice(1))
    read()
    window.addEventListener("hashchange", read)
    return () => window.removeEventListener("hashchange", read)
  }, [])
  return name
}

export function ComponentGallery() {
  const [query, setQuery] = React.useState("")
  const [category, setCategory] = React.useState<Filter>("all")
  const [selected, setSelected] = React.useState<string | null>(null)
  const highlight = useHashHighlight()
  // Radix restores focus to a DialogTrigger, and these cards are not triggers
  // (one Dialog serves the whole grid), so the opening card is remembered here.
  const trigger = React.useRef<HTMLButtonElement | null>(null)

  const q = query.trim().toLowerCase()
  const matches = registryMeta.filter(
    (entry) =>
      (category === "all" || entry.category === category) &&
      (q === "" || `${entry.title} ${entry.description}`.toLowerCase().includes(q))
  )
  const grouped = category === "all" && q === ""
  const entry = selected ? registryMeta.find((item) => item.name === selected) : undefined
  const open = (name: string, card: HTMLButtonElement) => {
    trigger.current = card
    setSelected(name)
  }

  return (
    <>
      {/* top-14, not top-0: the site header is sticky too, and h-14 tall. */}
      <div className="bg-background/80 sticky top-14 z-10 -mx-6 mb-8 px-6 py-4 backdrop-blur">
        <label htmlFor="gallery-search" className="sr-only">
          Search components
        </label>
        <input
          id="gallery-search"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search components…"
          className="border-input bg-card focus-visible:border-ring focus-visible:ring-ring/50 h-9 w-full rounded-lg border px-3 text-sm outline-none focus-visible:ring-3"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {[{ value: "all" as const, label: "All" }, ...CATEGORIES].map((pill) => {
            const active = category === pill.value
            return (
              <button
                key={pill.value}
                type="button"
                aria-pressed={active}
                onClick={() => setCategory(pill.value)}
                className={`h-7 rounded-full border px-3 text-xs font-medium transition-colors motion-reduce:transition-none ${
                  active
                    ? "bg-primary text-primary-foreground border-transparent"
                    : "border-border hover:bg-muted"
                }`}
              >
                {pill.label}
              </button>
            )
          })}
        </div>
      </div>

      {matches.length === 0 && (
        <p className="text-muted-foreground py-16 text-center text-sm">No components match</p>
      )}

      {grouped ? (
        CATEGORIES.map(({ value, label }) => (
          <section key={value} className="mb-12">
            <h2 className="mb-4 text-sm font-medium tracking-wide uppercase">{label}</h2>
            <Grid
              entries={matches.filter((item) => item.category === value)}
              onOpen={open}
              openName={selected}
              highlight={highlight}
            />
          </section>
        ))
      ) : (
        <Grid entries={matches} onOpen={open} openName={selected} highlight={highlight} />
      )}

      <Dialog open={entry !== undefined} onOpenChange={(isOpen) => !isOpen && setSelected(null)}>
        {entry && (
          <DialogContent
            className="max-h-[85vh] overflow-y-auto sm:max-w-2xl"
            onCloseAutoFocus={(event) => {
              event.preventDefault()
              trigger.current?.focus()
            }}
          >
            <DialogHeader>
              <DialogTitle>{entry.title}</DialogTitle>
              <DialogDescription>{entry.description}</DialogDescription>
            </DialogHeader>
            <div className="bg-card flex min-h-40 items-center justify-center rounded-lg border p-4">
              {NO_MODAL_DEMO.has(entry.name) ? (
                <p className="text-muted-foreground text-sm">
                  This one takes over the whole page, so it runs on its docs page rather than in
                  this dialog.
                </p>
              ) : (
                /* Keyed by name: every open gets a demo that starts from scratch. */
                <entry.Demo key={entry.name} />
              )}
            </div>
            {!DEMO_RENDERS_OWN_STEPS.has(entry.name) && (
              <div>
                <h3 className="mb-2 font-medium">How to use</h3>
                <ol className="text-muted-foreground list-decimal space-y-1 ps-5 text-sm">
                  {entry.howToUse.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            <InstallCommand name={entry.name} />
            <Link
              href={`/docs/${entry.name}`}
              className="text-sm underline underline-offset-4"
            >
              Full docs →
            </Link>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}

function Grid({
  entries,
  onOpen,
  openName,
  highlight,
}: {
  entries: typeof registryMeta
  onOpen: (name: string, card: HTMLButtonElement) => void
  /** The entry showing in the modal — its card preview stands down while it is. */
  openName: string | null
  /** The entry named by the URL hash, if any — it rings itself so the scroll lands somewhere. */
  highlight: string
}) {
  return (
    <div className="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entries.map(({ name, title, description, Demo }) => (
        <article
          key={name}
          id={name}
          data-highlight={highlight === name ? "" : undefined}
          className="bg-card hover:border-ring relative flex scroll-mt-32 flex-col rounded-xl border p-4 transition-colors motion-reduce:transition-none"
        >
          <LazyPreview previewHeightClass={WIDE.has(name) ? "h-64" : "h-40"}>
            {/* Two live copies of one demo on a page collide: the tour resolves
                its spotlight targets with document.querySelector, and would
                light up this preview instead of the modal's instance. */}
            {openName === name ? null : WIDE.has(name) ? (
              // The scaled child still *lays out* at 133%, so it needs a
              // full-width block of its own or the centring shoves it off-card.
              <div className="w-full">
                <div className="w-[133%] origin-top-left scale-75">
                  <Demo />
                </div>
              </div>
            ) : (
              <Demo />
            )}
          </LazyPreview>
          <h3 className="mt-4 font-medium">{title}</h3>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
          {/* The card surface is the button, but as an overlay rather than a
              wrapper: the preview mounts real controls, and a button inside a
              button is not parseable HTML. */}
          <button
            type="button"
            aria-label={`Open ${title} preview`}
            onClick={(event) => onOpen(name, event.currentTarget)}
            className="focus-visible:ring-ring/50 absolute inset-0 rounded-xl outline-none focus-visible:ring-3"
          />
        </article>
      ))}
    </div>
  )
}
