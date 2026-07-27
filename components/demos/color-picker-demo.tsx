"use client"
import * as React from "react"
import {
  ColorPicker,
  ColorPickerAlpha,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerInput,
  ColorPickerSwatches,
} from "@/registry/ui/color-picker"

const SWATCHES = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#111827"]

export function ColorPickerDemo() {
  const [color, setColor] = React.useState("#3b82f6")
  return (
    <ColorPicker value={color} onChange={setColor} className="w-full max-w-56">
      <ColorPickerArea />
      <ColorPickerHue />
      <ColorPickerAlpha />
      <ColorPickerInput />
      <ColorPickerSwatches swatches={SWATCHES} />
    </ColorPicker>
  )
}

export function ColorPickerInvalidDemo() {
  // Seeded so the error styling is visible without interacting; typing junk in
  // the hex field and blurring reproduces it live (onErrorChange), and picking
  // any real colour clears it (onChange).
  const [error, setError] = React.useState<React.ReactNode>("Enter a valid hex color like #3B82F6")
  return (
    <ColorPicker
      defaultValue="#3b82f6"
      error={error}
      onChange={() => setError(null)}
      onErrorChange={setError}
      className="w-full max-w-56"
    >
      <ColorPickerInput />
      <ColorPickerSwatches swatches={SWATCHES} />
    </ColorPicker>
  )
}
