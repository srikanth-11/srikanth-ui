import Link from "next/link"
import { registryMeta, SITE_URL } from "@/lib/registry-meta"

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <section className="mb-16">
        <h1 className="text-4xl font-semibold tracking-tight">srikanth/ui</h1>
        <p className="text-muted-foreground mt-3 max-w-xl text-lg">
          The components shadcn/ui doesn&apos;t ship. Install with the shadcn CLI, own the code.
        </p>
        <code className="bg-card mt-6 inline-block rounded-lg border px-4 py-2 font-mono text-sm">
          npx shadcn@latest add {SITE_URL}/r/time-picker.json
        </code>
        <p className="text-muted-foreground mt-2 text-sm">
          Or configure the @srikanth namespace once — see README.
        </p>
      </section>
      {/* grid-cols-1 is not a no-op: the implicit single track below `sm` is
          `auto`, so the widest demo (a board that means to scroll) would size
          every card. `minmax(0, 1fr)` hands the overflow back to the demo. */}
      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {registryMeta.map(({ name, title, description, Demo }) => (
          <div
            key={name}
            className="bg-card hover:border-ring group rounded-xl border p-6 transition-colors"
          >
            <div className="flex min-h-32 items-center justify-center py-4">
              <Demo />
            </div>
            <div className="relative mt-4">
              <Link
                href={`/docs/${name}`}
                className="absolute inset-0"
                aria-label={`View ${title} docs`}
              />
              <h2 className="font-medium">{title}</h2>
              <p className="text-muted-foreground mt-1 text-sm">{description}</p>
            </div>
          </div>
        ))}
      </section>
    </main>
  )
}
