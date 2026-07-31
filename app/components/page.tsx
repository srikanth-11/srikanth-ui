import { registryMeta } from "@/lib/registry-meta"
import { ComponentGallery } from "@/components/gallery/component-gallery"

export const metadata = { title: "Components — srikanth/ui" }

export default function ComponentsPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
      <p className="text-muted-foreground mt-2">
        {registryMeta.length} components. Each card previews one live. Click it for the full
        documentation.
      </p>
      <div className="mt-8">
        <ComponentGallery />
      </div>
    </main>
  )
}
