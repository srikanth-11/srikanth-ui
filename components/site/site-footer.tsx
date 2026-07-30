import { GITHUB_URL } from "@/lib/site"

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-10 text-sm">
        <span>Built on shadcn/ui.</span>
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-foreground underline underline-offset-4"
        >
          GitHub
        </a>
      </div>
    </footer>
  )
}
