"use client"
import { CopyButton } from "@/components/docs/copy-button"
import { SITE_URL } from "@/lib/registry-index"

export function InstallCommand({ name }: { name: string }) {
  const cmd = `npx shadcn@latest add ${SITE_URL}/r/${name}.json`
  return (
    <div className="bg-card flex items-center gap-2 rounded-lg border p-3">
      <code className="flex-1 overflow-x-auto font-mono text-xs">{cmd}</code>
      <CopyButton text={cmd} label="Copy install command" />
    </div>
  )
}
