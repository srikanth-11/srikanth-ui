import { notFound } from "next/navigation"
import { registryMeta, SITE_URL } from "@/lib/registry-meta"
import { InstallCommand } from "@/components/install-command"

export function generateStaticParams() {
  return registryMeta.map((c) => ({ component: c.name }))
}

export async function generateMetadata({ params }: { params: Promise<{ component: string }> }) {
  const { component } = await params
  const meta = registryMeta.find((c) => c.name === component)
  if (!meta) return {}
  return { title: `${meta.title} — srikanth/ui`, description: meta.description }
}

export default async function ComponentPage({
  params,
}: {
  params: Promise<{ component: string }>
}) {
  const { component } = await params
  const meta = registryMeta.find((c) => c.name === component)
  if (!meta) notFound()
  const { title, description, Demo, name } = meta

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
      <div className="bg-card mt-8 flex min-h-48 items-center justify-center rounded-xl border p-8">
        <Demo />
      </div>
      <h2 className="mt-10 mb-3 text-lg font-medium">Installation</h2>
      <InstallCommand name={name} />
      <h2 className="mt-10 mb-3 text-lg font-medium">Open in v0</h2>
      <a
        className="text-sm underline underline-offset-4"
        href={`https://v0.dev/chat/api/open?url=${encodeURIComponent(`${SITE_URL}/r/${name}.json`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Open {title} in v0
      </a>
    </main>
  )
}
