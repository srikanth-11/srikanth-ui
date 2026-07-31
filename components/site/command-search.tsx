"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { registryMeta, type ComponentCategory } from "@/lib/registry-meta"

// TODO(Task 3): consume CATEGORY_LABELS from lib/registry-meta.ts
const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  form: "Form inputs",
  picker: "Pickers & canvas",
  widget: "Widgets",
  overlay: "Overlays",
}

const LABEL = "Search components"

/** Registry order within a category is the curated one; only the categories are sorted. */
const GROUPS = (Object.keys(CATEGORY_LABELS) as ComponentCategory[]).map((category) => ({
  category,
  items: registryMeta.filter((entry) => entry.category === category),
}))

export function CommandSearch() {
  const [open, setOpen] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key?.toLowerCase() !== "k" || !(event.metaKey || event.ctrlKey)) return
      // Firefox/Safari put ⌘K on the address bar; the palette wins on our pages.
      event.preventDefault()
      setOpen((wasOpen) => !wasOpen)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  const go = (name: string) => {
    setOpen(false)
    router.push(`/docs/${name}`)
  }

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-muted-foreground justify-start gap-2 font-normal sm:w-56"
      >
        <Search />
        {/* Never dropped, only unread: an icon-only button still needs a name, and
            the visible label has to lead the accessible one (WCAG 2.5.3). */}
        <span className="sr-only sm:not-sr-only">Search components…</span>
        <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
      </Button>

      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title={LABEL}
        description="Jump to a component's documentation."
      >
        <Command label={LABEL}>
          <CommandInput placeholder="Search components…" />
          <CommandList>
            <CommandEmpty>No components found.</CommandEmpty>
            {GROUPS.map(({ category, items }) => (
              <CommandGroup key={category} heading={CATEGORY_LABELS[category]}>
                {items.map(({ name, title }) => (
                  // Name in the value so "kanban" and "Kanban" both hit.
                  <CommandItem key={name} value={`${title} ${name}`} onSelect={() => go(name)}>
                    {title}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
