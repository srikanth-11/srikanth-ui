import type { ComponentDoc } from "./types"

export const signaturePadDoc: ComponentDoc = {
  exports: [
    {
      name: "SignaturePad",
      props: [
        {
          name: "onEnd",
          type: "(dataUrl: string) => void",
          description: "Fires at the end of every stroke with the whole canvas as a data URL.",
        },
        {
          name: "penColor",
          type: "string",
          default: "the canvas's computed `color`",
          description: "Any CSS color. Left off, the pen follows the theme foreground. It is resolved once per redraw and applied to every stroke, so a theme flip recolors the whole drawing at the next redraw (a resize, a new stroke, an undo or a clear).",
        },
        {
          name: "backgroundColor",
          type: "string",
          default: "transparent",
          description: "Fills the canvas before each redraw, so exports are not transparent.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Blocks drawing and dims the pad. A stroke in flight when this flips is abandoned rather than committed.",
        },
        {
          name: "name",
          type: "string",
          description: "Renders a hidden input under that name carrying the data URL (empty string while the pad is empty) so a plain form POST picks the signature up.",
        },
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error. Truthy marks the pad invalid. A signature cannot be invalid on its own.",
        },
        {
          name: "showErrorMessage",
          type: "boolean",
          default: "true",
          description: "Set false to keep the invalid styling but render the message yourself.",
        },
        {
          name: "aria-label",
          type: "string",
          default: '"Signature pad"',
          description: "Accessible name of the drawing canvas.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the bordered pad. Override `h-40` here to change its height.",
        },
      ],
    },
    {
      name: "SignaturePadHandle",
      props: [
        {
          name: "clear",
          type: "() => void",
          description: "Drops every stroke and repaints the pad empty.",
        },
        {
          name: "undo",
          type: "() => void",
          description: "Removes the last completed stroke.",
        },
        {
          name: "isEmpty",
          type: "() => boolean",
          description: "True while no stroke has been committed.",
        },
        {
          name: "toDataURL",
          type: "(type?: string) => string",
          description: "Current canvas as a data URL. Pass a mime type such as `\"image/jpeg\"` to change the format.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Sign and submit with a form",
      code: `import { SignaturePad } from "@/components/ui/signature-pad"

export function ConsentForm() {
  return (
    <form action="/api/consent" method="post">
      <SignaturePad name="signature" />
      <button type="submit">Agree</button>
    </form>
  )
}`,
    },
    {
      title: "Clear, undo and export through the ref",
      code: `"use client"

import * as React from "react"
import { SignaturePad, type SignaturePadHandle } from "@/components/ui/signature-pad"

export function SignatureField() {
  const pad = React.useRef<SignaturePadHandle>(null)

  return (
    <div className="space-y-2">
      {/* The ref is the imperative handle, not the DOM node. */}
      <SignaturePad ref={pad} penColor="#1d4ed8" backgroundColor="#ffffff" />
      <button type="button" onClick={() => pad.current?.undo()}>
        Undo
      </button>
      <button type="button" onClick={() => pad.current?.clear()}>
        Clear
      </button>
      <button
        type="button"
        onClick={() => {
          if (!pad.current || pad.current.isEmpty()) return
          console.log(pad.current.toDataURL("image/png"))
        }}
      >
        Save
      </button>
    </div>
  )
}`,
    },
  ],
  errorState:
    "There is nothing a signature can get wrong, so the pad never invalidates itself. `error` is the only source, and it is how an app reports its own rule (\"signature required\", say, checked with `isEmpty()` on submit). A truthy `error` puts `aria-invalid` on the pad wrapper, which is what draws the destructive border and ring, and renders the message in a `role=\"alert\"` paragraph below, linked by `aria-describedby`. With `showErrorMessage={false}` the ring stays, the message is not rendered and the description link is left off. The error is purely presentational. Drawing still works, and the hidden `name` input keeps carrying whatever is on the canvas.",
}
