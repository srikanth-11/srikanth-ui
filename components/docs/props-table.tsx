import type { DocExport } from "@/lib/docs"

/**
 * The docs prose is written with `backticks` around identifiers. This is the only
 * markup it gets — no markdown parser, no MDX (see spec section 8).
 */
export function Ticks({ text }: { text: string }) {
  return text
    .split(/`([^`]+)`/g)
    .map((part, i) =>
      i % 2 ? (
        <code key={i} className="bg-muted rounded px-1 py-0.5 font-mono text-[0.85em]">
          {part}
        </code>
      ) : (
        part
      )
    )
}

/** One table per documented export. Server component — nothing here is interactive. */
export function PropsTable({ doc }: { doc: DocExport }) {
  return (
    <>
      <h3 className="mt-6 mb-2 font-mono text-sm font-medium">{doc.name}</h3>
      {/* The table sets its own width from the type and description columns; the
          wrapper is what scrolls, so a narrow viewport never widens the page. */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full min-w-xl border-collapse text-left text-sm">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th scope="col" className="px-3 py-2 font-medium">
                Prop
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Type
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Default
              </th>
              <th scope="col" className="px-3 py-2 font-medium">
                Description
              </th>
            </tr>
          </thead>
          <tbody>
            {doc.props.map((prop) => (
              <tr key={prop.name} className="border-t align-top">
                <td className="px-3 py-2 font-mono text-xs whitespace-nowrap">{prop.name}</td>
                <td className="px-3 py-2">
                  <code className="font-mono text-xs">{prop.type}</code>
                </td>
                <td className="text-muted-foreground px-3 py-2 font-mono text-xs">
                  {prop.default ?? "—"}
                </td>
                <td className="text-muted-foreground min-w-64 px-3 py-2 leading-relaxed">
                  <Ticks text={prop.description} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
