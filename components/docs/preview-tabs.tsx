"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

/**
 * Panes come in as slots, not children of a client boundary's own imports: the
 * code pane is a server-rendered shiki block, and it has to stay that way.
 */
export function PreviewTabs({
  preview,
  code,
}: {
  preview: React.ReactNode
  code: React.ReactNode
}) {
  return (
    <Tabs defaultValue="preview" className="mt-8">
      <TabsList variant="line">
        <TabsTrigger value="preview">Preview</TabsTrigger>
        <TabsTrigger value="code">Code</TabsTrigger>
      </TabsList>
      {/* forceMount, because the demos are the point: a reader who crops a photo
          or rearranges the board and then glances at the code should come back to
          what they left. Radix stops applying `hidden` once it is mounted for
          good, so the class has to hide it instead. The code pane keeps the
          default unmount — it is static markup with no state to lose, and
          mounting it up front doubles the page's HTML. */}
      <TabsContent value="preview" forceMount className="data-[state=inactive]:hidden">
        {preview}
      </TabsContent>
      <TabsContent value="code">{code}</TabsContent>
    </Tabs>
  )
}
