"use client"
import { CopyButton } from "@/components/docs/copy-button"
import { SITE_URL } from "@/lib/registry-index"

/** Kept byte-for-byte in step with the snippet in README.md. */
export const REGISTRIES_CONFIG = `{ "registries": { "@srikanth": { "url": "${SITE_URL}/r/{name}.json" } } }`

/**
 * Two ways to install the same component: the full URL, which works with no setup,
 * and the `@srikanth` short form, which needs the namespace in `components.json`
 * first. The setup snippet sits in a closed `<details>` so the hero stays one
 * command tall while the docs page still hands over the whole thing.
 */
export function InstallCommand({ name }: { name: string }) {
  return (
    <div className="flex flex-col gap-2">
      <CommandRow
        cmd={`npx shadcn@latest add ${SITE_URL}/r/${name}.json`}
        label="Copy install command"
      />
      <CommandRow
        cmd={`npx shadcn@latest add @srikanth/${name}`}
        label="Copy the short install command"
      />
      <details className="text-muted-foreground text-xs">
        <summary className="focus-visible:ring-ring/50 hover:text-foreground cursor-pointer rounded-sm py-1 outline-none focus-visible:ring-3">
          One-time setup for the short form
        </summary>
        <p className="mt-2 text-left leading-relaxed">
          Add the namespace to <code className="font-mono">components.json</code> once and the short
          command works for every component here.
        </p>
        <div className="mt-2">
          <CommandRow cmd={REGISTRIES_CONFIG} label="Copy the registries config" />
        </div>
      </details>
    </div>
  )
}

function CommandRow({ cmd, label }: { cmd: string; label: string }) {
  return (
    <div className="bg-card flex items-center gap-2 rounded-lg border p-3">
      <code className="text-foreground flex-1 overflow-x-auto text-left font-mono text-xs whitespace-pre">
        {cmd}
      </code>
      <CopyButton text={cmd} label={label} />
    </div>
  )
}
