import { highlight } from "@/lib/highlight"
import { CopyButton } from "./copy-button"

/**
 * Server component — no `"use client"` here or anywhere up its import chain, or
 * shiki lands in the browser bundle.
 */
export async function CodeBlock({ code }: { code: string }) {
  const html = await highlight(code)
  return (
    <div className="relative">
      {/* dangerouslySetInnerHTML is for shiki's own markup over source we ship in
          this repo — build-time content, never user input. */}
      <div
        className="[&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:p-4 [&_pre]:text-sm"
        dangerouslySetInnerHTML={{ __html: html }}
      />
      <div className="absolute top-1.5 right-1.5">
        <CopyButton text={code} label="Copy code" />
      </div>
    </div>
  )
}
