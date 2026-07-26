"use client"
import * as React from "react"
import { CheckIcon, CopyIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SITE_URL } from "@/lib/registry-meta"

export function InstallCommand({ name }: { name: string }) {
  const cmd = `npx shadcn@latest add ${SITE_URL}/r/${name}.json`
  const [copied, setCopied] = React.useState(false)
  return (
    <div className="bg-card flex items-center gap-2 rounded-lg border p-3">
      <code className="flex-1 overflow-x-auto font-mono text-xs">{cmd}</code>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Copy install command"
        onClick={() => {
          navigator.clipboard.writeText(cmd)
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }}
      >
        {copied ? <CheckIcon className="size-4" /> : <CopyIcon className="size-4" />}
      </Button>
    </div>
  )
}
