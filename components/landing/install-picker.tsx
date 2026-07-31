"use client"
import * as React from "react"
import { InstallCommand } from "@/components/install-command"
import { registryIndex } from "@/lib/registry-index"

/**
 * The hero's install command, with the component swappable. A native `<select>`
 * so the arrow keys, the type-ahead and the mobile wheel all come for free.
 * `registry-index` only, never `registry-meta`: this runs in the browser and the
 * meta module drags every demo component along with it.
 */
export function InstallPicker() {
  const [name, setName] = React.useState("time-picker")
  return (
    <div className="flex flex-col gap-2">
      <div className="text-muted-foreground flex items-center justify-center gap-2 text-xs">
        <label htmlFor="install-picker">Component</label>
        <select
          id="install-picker"
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="bg-card text-foreground border-border focus-visible:ring-ring/50 hover:border-ring rounded-lg border px-2 py-1 font-mono text-xs outline-none focus-visible:ring-3"
        >
          {registryIndex.map((entry) => (
            <option key={entry.name} value={entry.name}>
              {entry.title}
            </option>
          ))}
        </select>
      </div>
      <InstallCommand name={name} />
    </div>
  )
}
