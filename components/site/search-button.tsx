import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Kbd } from "@/components/ui/kbd"

/** Placeholder — no behaviour yet. Task 2 swaps this import for the ⌘K palette. */
export function SearchButton() {
  return (
    <Button
      variant="outline"
      aria-label="Search components"
      className="text-muted-foreground justify-start gap-2 font-normal sm:w-56"
    >
      <Search />
      <span className="hidden sm:inline">Search…</span>
      <Kbd className="ml-auto hidden sm:inline-flex">⌘K</Kbd>
    </Button>
  )
}
