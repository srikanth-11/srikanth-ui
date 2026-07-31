import fs from "node:fs/promises"
import path from "node:path"
import { notFound } from "next/navigation"
import { CodeBlock } from "@/components/docs/code-block"
import { PreviewTabs } from "@/components/docs/preview-tabs"
import { PropsTable, Ticks } from "@/components/docs/props-table"
import { InstallCommand } from "@/components/install-command"
import { Badge } from "@/components/ui/badge"
import { Kbd } from "@/components/ui/kbd"
import { componentDocs } from "@/lib/docs"
import { CATEGORY_LABELS } from "@/lib/registry-index"
import { registryMeta, SITE_URL } from "@/lib/registry-meta"

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
  const { title, description, category, howToUse, Demo, InvalidDemo, name } = meta
  const doc = componentDocs[name]

  // The demo file *is* the code sample. Read at build time (every docs route is
  // static), so the Code tab cannot drift from the Preview tab above it.
  const demoSource = await fs.readFile(
    path.join(process.cwd(), "components/demos", `${name}-demo.tsx`),
    "utf8"
  )

  // No wrapper of its own: app/docs/layout.tsx owns the `main`, the width and the padding.
  return (
    <>
      <Badge variant="secondary">{CATEGORY_LABELS[category]}</Badge>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">{title}</h1>
      <p className="text-muted-foreground mt-2">{description}</p>
      <a
        className="text-muted-foreground hover:text-foreground mt-3 inline-block text-sm underline underline-offset-4"
        href={`https://v0.dev/chat/api/open?url=${encodeURIComponent(`${SITE_URL}/r/${name}.json`)}`}
        target="_blank"
        rel="noreferrer"
      >
        Open in v0
      </a>

      <PreviewTabs
        preview={
          <div className="bg-card flex min-h-48 items-center justify-center rounded-xl border p-8">
            <Demo />
          </div>
        }
        code={<CodeBlock code={demoSource} />}
      />

      <h2 className="mt-10 mb-3 text-lg font-medium">How to use</h2>
      <ol className="text-muted-foreground bg-card list-decimal space-y-1 rounded-xl border py-4 ps-9 pe-4 text-sm">
        {howToUse.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <h2 className="mt-10 mb-3 text-lg font-medium">Installation</h2>
      <InstallCommand name={name} />

      <h2 className="mt-10 mb-3 text-lg font-medium">Usage</h2>
      {doc.examples.map((example) => (
        <div key={example.title} className="mt-4 first:mt-0">
          <h3 className="mb-2 text-sm font-medium">{example.title}</h3>
          <CodeBlock code={example.code} />
        </div>
      ))}

      <h2 className="mt-10 mb-3 text-lg font-medium">Props</h2>
      {doc.exports.map((docExport) => (
        <PropsTable key={docExport.name} doc={docExport} />
      ))}

      {doc.errorState && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-medium">Error state</h2>
          {InvalidDemo && (
            <div className="bg-card flex min-h-32 items-center justify-center rounded-xl border p-8">
              <InvalidDemo />
            </div>
          )}
          <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
            <Ticks text={doc.errorState} />
          </p>
        </>
      )}

      {doc.keyboard && (
        <>
          <h2 className="mt-10 mb-3 text-lg font-medium">Keyboard</h2>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-md border-collapse text-left text-sm">
              <tbody>
                {doc.keyboard.map((row) => (
                  <tr key={row.keys} className="border-t align-top first:border-t-0">
                    <td className="px-3 py-2 whitespace-nowrap">
                      <Kbd>{row.keys}</Kbd>
                    </td>
                    <td className="text-muted-foreground px-3 py-2 leading-relaxed">
                      <Ticks text={row.action} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  )
}
