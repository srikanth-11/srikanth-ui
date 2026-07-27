"use client"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { SignaturePad, type SignaturePadHandle } from "@/registry/ui/signature-pad"

export function SignaturePadDemo() {
  const pad = React.useRef<SignaturePadHandle>(null)
  const [signed, setSigned] = React.useState(false)

  const run = (action: "undo" | "clear") => {
    const handle = pad.current
    if (!handle) return
    if (action === "undo") handle.undo()
    else handle.clear()
    setSigned(!handle.isEmpty())
  }

  return (
    <div className="w-full max-w-sm space-y-2">
      <SignaturePad ref={pad} onEnd={() => setSigned(true)} />
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => run("undo")}>
          Undo
        </Button>
        <Button variant="outline" size="sm" onClick={() => run("clear")}>
          Clear
        </Button>
        <p className="text-muted-foreground text-xs">{signed ? "Signed" : "Sign above"}</p>
      </div>
    </div>
  )
}

export function SignaturePadInvalidDemo() {
  // A signature can't be invalid on its own — the form decides, and `error`
  // puts aria-invalid on the pad region.
  return (
    <div className="w-full max-w-sm">
      <SignaturePad error="Signature is required" />
    </div>
  )
}
