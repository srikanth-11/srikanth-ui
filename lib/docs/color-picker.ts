import type { ComponentDoc } from "./types"

const trackProps = (surface: string, keys: string) => [
  { name: "className", type: "string", description: `Extra classes for the ${surface}.` },
  {
    name: "style",
    type: "React.CSSProperties",
    description: "Merged after the part's own gradient background, so it can override it.",
  },
  {
    name: "onPointerDown",
    type: "React.PointerEventHandler<HTMLDivElement>",
    description: "Runs before the drag starts; call `preventDefault()` in it to suppress picking.",
  },
  {
    name: "onPointerMove",
    type: "React.PointerEventHandler<HTMLDivElement>",
    description: "Runs before the drag updates; call `preventDefault()` in it to suppress picking.",
  },
  {
    name: "onKeyDown",
    type: "React.KeyboardEventHandler<HTMLDivElement>",
    description: `Runs before the built-in keys; call \`preventDefault()\` in it to suppress ${keys}.`,
  },
]

export const colorPickerDoc: ComponentDoc = {
  exports: [
    {
      name: "ColorPicker",
      props: [
        {
          name: "value",
          type: "string",
          description: "Controlled hex (`#rrggbb` or `#rrggbbaa`). Pair it with `onChange` or the picker is read-only (dev-warned); an unparseable value is ignored, never thrown on.",
        },
        {
          name: "defaultValue",
          type: "string",
          default: '"#000000"',
          description: "Uncontrolled initial hex. Ignored once `value` is provided.",
        },
        {
          name: "onChange",
          type: "(hex: string) => void",
          description: "Fires with the new hex on every committed change — drag, swatch click or a valid hex entry. Includes the alpha pair only when alpha is below 1.",
        },
        {
          name: "disabled",
          type: "boolean",
          description: "Dims and blocks every part: area, hue, alpha, hex field and swatches.",
        },
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error; truthy marks the picker invalid and takes precedence over the built-in hex validation.",
        },
        {
          name: "validate",
          type: "(value: string) => React.ReactNode | null",
          description: "Replaces the default invalid-hex message. Called on commit (blur or Enter) with the typed text.",
        },
        {
          name: "onErrorChange",
          type: "(error: React.ReactNode | null) => void",
          description: "Fires when the internal validation error appears or clears.",
        },
        {
          name: "showErrorMessage",
          type: "boolean",
          default: "true",
          description: "Set false to keep the invalid styling but render the message yourself.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the column that stacks the parts.",
        },
        {
          name: "children",
          type: "React.ReactNode",
          description: "The parts to render — you choose which of area, hue, alpha, hex field and swatches appear and in what order.",
        },
      ],
    },
    {
      name: "ColorPickerArea",
      props: trackProps("saturation/brightness square", "arrow-key stepping (Shift for 10 at a time)"),
    },
    {
      name: "ColorPickerHue",
      props: trackProps("hue strip", "arrow-key stepping (Shift for 10° at a time)"),
    },
    {
      name: "ColorPickerAlpha",
      props: trackProps("alpha strip", "arrow-key stepping (Shift for 10% at a time)"),
    },
    {
      name: "ColorPickerInput",
      props: [
        {
          name: "className",
          type: "string",
          description: "Extra classes for the hex text field.",
        },
        {
          name: "onFocus",
          type: "React.FocusEventHandler<HTMLInputElement>",
          description: "Forwarded, called after the field switches into edit mode.",
        },
        {
          name: "onBlur",
          type: "React.FocusEventHandler<HTMLInputElement>",
          description: "Forwarded, called after the typed hex has been committed or rejected.",
        },
        {
          name: "onKeyDown",
          type: "React.KeyboardEventHandler<HTMLInputElement>",
          description: "Runs before the built-in keys; call `preventDefault()` in it to suppress Enter (commit) and Escape (revert).",
        },
      ],
    },
    {
      name: "ColorPickerSwatches",
      props: [
        {
          name: "swatches",
          type: "string[]",
          description: "Hex colors to offer as one-click presets. Required; a swatch that does not parse is rendered but selects nothing.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the swatch row.",
        },
      ],
    },
    {
      name: "hexToHsva",
      props: [
        {
          name: "hex",
          type: "string",
          description: "`#rrggbb` or `#rrggbbaa` (whitespace trimmed). Returns `{ h, s, v, a }` — h 0–360, s and v 0–100, a 0–1 — or `null` when the string does not parse.",
        },
      ],
    },
    {
      name: "hsvaToHex",
      props: [
        {
          name: "hsva",
          type: "{ h: number; s: number; v: number; a: number }",
          description: "Converts back to a hex string, appending the alpha pair only when `a` is below 1. Out-of-range channels are clamped.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Full picker",
      code: `"use client"

import * as React from "react"
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
} from "@/components/ui/color-picker"

export function BrandColor() {
  const [color, setColor] = React.useState("#3b82f6")

  return (
    <ColorPicker value={color} onChange={setColor} className="w-56">
      <ColorPickerArea />
      <ColorPickerHue />
      <ColorPickerAlpha />
      <ColorPickerInput />
    </ColorPicker>
  )
}`,
    },
    {
      title: "Swatches only",
      code: `import { ColorPicker, ColorPickerSwatches } from "@/components/ui/color-picker"

const SWATCHES = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6"]

export function LabelColor() {
  return (
    <ColorPicker defaultValue="#10b981" onChange={(hex) => console.log(hex)}>
      <ColorPickerSwatches swatches={SWATCHES} />
    </ColorPicker>
  )
}`,
    },
    {
      title: "Converting to and from HSV",
      code: `import { hexToHsva, hsvaToHex } from "@/components/ui/color-picker"

const hsva = hexToHsva("#3b82f6") // ≈ { h: 217, s: 76, v: 96, a: 1 }
const dimmed = hsva ? hsvaToHex({ ...hsva, v: hsva.v / 2 }) : "#000000"`,
    },
  ],
  errorState:
    "Dragging and swatches can only ever produce a valid color, so the hex field is the one part that can go invalid. On commit — blur or Enter — text that is not `#rrggbb`/`#rrggbbaa` shows \"Enter a valid hex color like #3B82F6\", keeps what was typed on screen so it can be fixed, and changes no color. Escape reverts to the canonical hex. A `validate` function runs on the same commit and its message wins whenever it returns one, including for text that parses fine; the built-in message only appears when the text does not parse and `validate` returned nothing. Any color change from elsewhere — a drag, a swatch, a new controlled `value` — clears the error and drops the field back to the canonical hex. A truthy `error` prop marks the picker invalid too and takes precedence over the internal result. The invalid styling lands on the hex field (`aria-invalid`, destructive border and ring) and the message renders in a `role=\"alert\"` paragraph inside the picker, linked by `aria-describedby`; `showErrorMessage={false}` keeps the styling and drops the message. An unparseable controlled `value` is ignored rather than reported — it is a programming error, not user input.",
}
