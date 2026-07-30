import Link from "next/link"
import { Button } from "@/components/ui/button"
import { SearchButton } from "@/components/site/search-button"
import { ThemeToggle } from "@/components/site/theme-toggle"
import { GITHUB_URL } from "@/lib/site"

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight">
          srikanth/ui
        </Link>
        <nav className="text-sm">
          <Link
            href="/components"
            className="text-muted-foreground hover:text-foreground transition-colors motion-reduce:transition-none"
          >
            Components
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <SearchButton />
          <Button asChild variant="ghost" size="icon" aria-label="GitHub">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              <GitHubIcon />
            </a>
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}

/** lucide-react dropped its brand icons, so the mark is inline. */
function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.21 11.39.6.11.82-.26.82-.58l-.01-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.12-.31-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.01 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.18.77.84 1.24 1.91 1.24 3.23 0 4.63-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22l-.01 3.29c0 .32.21.7.82.58A12 12 0 0 0 24 12.5C24 5.87 18.63.5 12 .5Z" />
    </svg>
  )
}
