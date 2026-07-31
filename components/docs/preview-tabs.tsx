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
      <TabsContent value="preview">{preview}</TabsContent>
      <TabsContent value="code">{code}</TabsContent>
    </Tabs>
  )
}
