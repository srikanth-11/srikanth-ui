import { DocsSidebar } from "@/components/site/docs-sidebar"

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    // flex-1 by hand: the root layout gives it to a direct `main` child, and the
    // grid shell is what sits there now — without it the footer rides up on short pages.
    <div className="mx-auto grid max-w-6xl flex-1 gap-10 px-6 py-10 lg:grid-cols-[220px_1fr]">
      <DocsSidebar />
      {/* min-w-0: a demo that means to scroll must not size the 1fr track. */}
      <main className="min-w-0 max-w-3xl">{children}</main>
    </div>
  )
}
