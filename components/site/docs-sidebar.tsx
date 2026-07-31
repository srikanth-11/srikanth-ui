"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { CATEGORY_LABELS, registryIndex, type ComponentCategory } from "@/lib/registry-index"

// registryIndex, not registryMeta: this is a client component, and registry-meta
// would hand every demo — dnd-kit, react-easy-crop, libphonenumber — to the browser
// on every docs route.
const GROUPS = (Object.keys(CATEGORY_LABELS) as ComponentCategory[]).map((category) => ({
  category,
  label: CATEGORY_LABELS[category],
  entries: registryIndex.filter((entry) => entry.category === category),
}))

export function DocsSidebar() {
  const pathname = usePathname()

  return (
    // One element in two shapes rather than a `hidden lg:block` column beside a
    // `lg:hidden` row: the same twelve links twice would be two nav landmarks over
    // the same targets, and screen-reader users would walk the list twice. Below
    // `lg` it is a horizontal scroll row (bleeding into the grid's px-6 so the row
    // scrolls edge to edge); at `lg` it is the sticky column under the h-14 navbar.
    <nav
      aria-label="Components"
      className="-mx-6 overflow-x-auto px-6 lg:sticky lg:top-20 lg:mx-0 lg:self-start lg:overflow-visible lg:px-0"
    >
      <ul className="flex gap-6 lg:block lg:space-y-6">
        {GROUPS.map(({ category, label, entries }) => (
          <li key={category} className="shrink-0">
            <h2 className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
              {label}
            </h2>
            <ul className="flex gap-4 text-sm lg:block lg:space-y-1">
              {entries.map(({ name, title }) => {
                const href = `/docs/${name}`
                const active = pathname === href
                return (
                  <li key={name}>
                    <Link
                      href={href}
                      aria-current={active ? "page" : undefined}
                      className={`block whitespace-nowrap transition-colors motion-reduce:transition-none ${
                        active
                          ? "text-foreground font-medium"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {title}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
        ))}
      </ul>
    </nav>
  )
}
