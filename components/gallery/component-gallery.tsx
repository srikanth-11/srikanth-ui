"use client"
import * as React from "react"
import Link from "next/link"
import { registryMeta, type ComponentCategory } from "@/lib/registry-meta"
import { CATEGORY_LABELS } from "@/lib/registry-index"
import { LazyPreview } from "@/components/gallery/lazy-preview"

/** Pills and section headings both read from the shared labels — one spelling, one order. */
const CATEGORIES = (Object.entries(CATEGORY_LABELS) as [ComponentCategory, string][]).map(
  ([value, label]) => ({ value, label })
)

// A board and a month grid only read as a preview scaled down; the 133% width
// gives the scaled content the full card back. Everything else, including the
// third widget (a bell), sits at its own size in a shorter box.
const WIDE = new Set(["event-calendar", "kanban"])

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
  const highlight = useHashHighlight()

  const q = query.trim().toLowerCase()
  const matches = registryMeta.filter(
    (entry) =>
      (category === "all" || entry.category === category) &&
      (q === "" || `${entry.title} ${entry.description}`.toLowerCase().includes(q))
  )
  const grouped = category === "all" && q === ""

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
              highlight={highlight}
            />
          </section>
        ))
      ) : (
        <Grid entries={matches} highlight={highlight} />
      )}
    </>
  )
}

function Grid({
  entries,
  highlight,
}: {
  entries: typeof registryMeta
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
          // scroll-mt clears the sticky stack: header 56px + filter bar 108
          // (136 when the pill row wraps on a phone) bottoms out at 192px, and
          // scroll-mt-48 is exactly that — anything shorter parks the ring
          // under the bar.
          className="bg-card hover:border-ring relative flex scroll-mt-48 flex-col rounded-xl border p-4 transition-colors motion-reduce:transition-none"
        >
          <LazyPreview previewHeightClass={WIDE.has(name) ? "h-64" : "h-40"}>
            {WIDE.has(name) ? (
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
          {/* The card surface is the link, but as an overlay rather than a
              wrapper: the preview mounts real controls, and a button inside a
              link is not parseable HTML. */}
          <Link
            href={`/docs/${name}`}
            aria-label={`Open ${title} docs`}
            className="focus-visible:ring-ring/50 absolute inset-0 rounded-xl outline-none focus-visible:ring-3"
          />
        </article>
      ))}
    </div>
  )
}
