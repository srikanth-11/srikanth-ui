"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface Hsva {
  h: number
  s: number
  v: number
  a: number
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function hexToHsva(hex: string): Hsva | null {
  const m = /^#([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(hex.trim())
  if (!m) return null
  const r = parseInt(m[1].slice(0, 2), 16) / 255
  const g = parseInt(m[1].slice(2, 4), 16) / 255
  const b = parseInt(m[1].slice(4, 6), 16) / 255
  const a = m[2] ? parseInt(m[2], 16) / 255 : 1
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6)
    else if (max === g) h = 60 * ((b - r) / d + 2)
    else h = 60 * ((r - g) / d + 4)
  }
  if (h < 0) h += 360
  const s = max === 0 ? 0 : d / max
  return { h, s: s * 100, v: max * 100, a }
}

const byteToHex = (n: number) => clamp(Math.round(n * 255), 0, 255).toString(16).padStart(2, "0")

function hsvaToHex({ h, s, v, a }: Hsva): string {
  const hue = ((h % 360) + 360) % 360
  const sN = clamp(s, 0, 100) / 100
  const vN = clamp(v, 0, 100) / 100
  const c = vN * sN
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1))
  const m = vN - c
  let [r, g, b] = [0, 0, 0]
  if (hue < 60) [r, g, b] = [c, x, 0]
  else if (hue < 120) [r, g, b] = [x, c, 0]
  else if (hue < 180) [r, g, b] = [0, c, x]
  else if (hue < 240) [r, g, b] = [0, x, c]
  else if (hue < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  const hex = `#${byteToHex(r + m)}${byteToHex(g + m)}${byteToHex(b + m)}`
  const alpha = clamp(a, 0, 1)
  return alpha < 1 ? `${hex}${byteToHex(alpha)}` : hex
}

const DEFAULT_HEX_ERROR = "Enter a valid hex color like #3B82F6"

interface Ctx {
  hsva: Hsva
  hex: string
  setHsva: (next: Hsva) => void
  disabled?: boolean
  isInvalid: boolean
  validate?: (value: string) => React.ReactNode | null
  emitError: (next: React.ReactNode | null) => void
}

const ColorPickerContext = React.createContext<Ctx | null>(null)

function useColorPicker() {
  const ctx = React.useContext(ColorPickerContext)
  if (!ctx) throw new Error("ColorPicker parts must be used within <ColorPicker>")
  return ctx
}

// Shared 1D pointer-drag + keyboard-step behavior for Hue/Alpha strips.
function useTrackPct(disabled: boolean | undefined, onPct: (pct: number) => void) {
  const trackRef = React.useRef<HTMLDivElement | null>(null)

  const fromClientX = (clientX: number) => {
    const el = trackRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const pct = rect.width === 0 ? 0 : clamp((clientX - rect.left) / rect.width, 0, 1)
    onPct(pct)
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled) return
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    fromClientX(e.clientX)
  }
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (disabled || e.buttons !== 1) return
    fromClientX(e.clientX)
  }

  return { trackRef, onPointerDown, onPointerMove }
}

interface ColorPickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: string
  defaultValue?: string
  onChange?: (hex: string) => void
  disabled?: boolean
  /** External/controlled error; truthy = invalid. Display takes precedence over internal validation. */
  error?: React.ReactNode
  /** Replaces the default invalid-hex validator. Called on commit (blur/Enter) with the typed text. */
  validate?: (value: string) => React.ReactNode | null
  /** Fires when internal validation error appears/clears. */
  onErrorChange?: (error: React.ReactNode | null) => void
  /** Default true. False renders visuals (aria-invalid) only — consumer renders the message. */
  showErrorMessage?: boolean
}

const DEFAULT_HEX = "#000000"

const ColorPicker = React.forwardRef<HTMLDivElement, ColorPickerProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      disabled,
      error,
      validate,
      onErrorChange,
      showErrorMessage = true,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined

    if (process.env.NODE_ENV !== "production" && isControlled && !onChange) {
      console.warn("ColorPicker: `value` without `onChange` — component is read-only.")
    }

    // Source of truth is HSV state, not the hex prop: hex can't disambiguate
    // hue at s=0/v=0 (black/white), so re-deriving it every render would snap
    // hue to 0 while dragging through those edges.
    const [hsva, setHsvaState] = React.useState<Hsva>(
      () => hexToHsva((isControlled ? value : defaultValue) ?? DEFAULT_HEX) ?? { h: 0, s: 0, v: 0, a: 1 }
    )
    // Tracks the last external `value` we've already applied, so a genuine
    // external change (not our own commit) can be detected and folded into
    // state during render — the React-docs "adjust state on prop change"
    // pattern, not an effect (avoids an extra render + effect-in-render lint).
    const [syncedValue, setSyncedValue] = React.useState(value)

    let currentHsva = hsva
    if (isControlled && value !== syncedValue) {
      setSyncedValue(value)
      const parsed = hexToHsva(value)
      if (parsed) {
        currentHsva = parsed.s > 0 && parsed.v > 0 ? parsed : { ...parsed, h: hsva.h }
        setHsvaState(currentHsva)
      }
      // invalid external value: ignore, keep prior state (never throw)
    }

    const hex = hsvaToHex(currentHsva)

    const [internalError, setInternalError] = React.useState<React.ReactNode | null>(null)
    const prevErrorRef = React.useRef<React.ReactNode | null>(null)
    const emitError = React.useCallback(
      (next: React.ReactNode | null) => {
        setInternalError(next)
        if (next !== prevErrorRef.current) {
          prevErrorRef.current = next
          onErrorChange?.(next)
        }
      },
      [onErrorChange]
    )
    const displayError = error !== undefined ? error : internalError
    const isInvalid = !!displayError

    const setHsva = React.useCallback(
      (next: Hsva) => {
        setHsvaState(next)
        onChange?.(hsvaToHex(next))
        emitError(null)
      },
      [onChange, emitError]
    )

    return (
      <ColorPickerContext.Provider
        value={{ hsva: currentHsva, hex, setHsva, disabled, isInvalid, validate, emitError }}
      >
        <div ref={ref} className={cn("flex flex-col gap-3", className)} {...props}>
          {children}
          {isInvalid && showErrorMessage !== false && (
            <p role="alert" className="text-destructive mt-1.5 text-xs">
              {displayError}
            </p>
          )}
        </div>
      </ColorPickerContext.Provider>
    )
  }
)
ColorPicker.displayName = "ColorPicker"

const ColorPickerArea = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, onPointerDown, onPointerMove, onKeyDown, ...props }, ref) => {
    const { hsva, setHsva, disabled } = useColorPicker()
    const trackRef = React.useRef<HTMLDivElement | null>(null)
    React.useImperativeHandle(ref, () => trackRef.current as HTMLDivElement)

    const updateFromPoint = (clientX: number, clientY: number) => {
      const el = trackRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const s = rect.width === 0 ? 0 : clamp((clientX - rect.left) / rect.width, 0, 1) * 100
      const v = rect.height === 0 ? 0 : (1 - clamp((clientY - rect.top) / rect.height, 0, 1)) * 100
      setHsva({ ...hsva, s, v })
    }

    const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e)
      if (e.defaultPrevented || disabled) return
      ;(e.target as Element).setPointerCapture?.(e.pointerId)
      updateFromPoint(e.clientX, e.clientY)
    }
    const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
      onPointerMove?.(e)
      if (e.defaultPrevented || disabled || e.buttons !== 1) return
      updateFromPoint(e.clientX, e.clientY)
    }
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      const step = e.shiftKey ? 10 : 1
      let { s, v } = hsva
      if (e.key === "ArrowRight") s = clamp(s + step, 0, 100)
      else if (e.key === "ArrowLeft") s = clamp(s - step, 0, 100)
      else if (e.key === "ArrowUp") v = clamp(v + step, 0, 100)
      else if (e.key === "ArrowDown") v = clamp(v - step, 0, 100)
      else return
      e.preventDefault()
      setHsva({ ...hsva, s, v })
    }

    return (
      <div
        ref={trackRef}
        role="slider"
        aria-label="Color"
        aria-valuetext={`Saturation ${Math.round(hsva.s)}%, Brightness ${Math.round(hsva.v)}%`}
        aria-valuenow={Math.round(hsva.v)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onKeyDown={handleKeyDown}
        className={cn("relative h-40 w-full touch-none rounded-md", disabled && "opacity-50", className)}
        style={{
          backgroundColor: `hsl(${hsva.h} 100% 50%)`,
          backgroundImage:
            "linear-gradient(to top, #000, transparent), linear-gradient(to right, #fff, transparent)",
          ...style,
        }}
        {...props}
      >
        <div
          aria-hidden
          className="border-background absolute size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow"
          style={{ insetInlineStart: `${hsva.s}%`, insetBlockStart: `${100 - hsva.v}%`, backgroundColor: hsvaToHex({ ...hsva, a: 1 }) }}
        />
      </div>
    )
  }
)
ColorPickerArea.displayName = "ColorPickerArea"

const HUE_GRADIENT =
  "linear-gradient(to right, #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%)"

const ColorPickerHue = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, onPointerDown, onPointerMove, onKeyDown, ...props }, ref) => {
    const { hsva, setHsva, disabled } = useColorPicker()
    const { trackRef, onPointerDown: dragDown, onPointerMove: dragMove } = useTrackPct(disabled, (pct) =>
      setHsva({ ...hsva, h: pct * 360 })
    )
    React.useImperativeHandle(ref, () => trackRef.current as HTMLDivElement)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      const step = e.shiftKey ? 10 : 1
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault()
        setHsva({ ...hsva, h: clamp(hsva.h + step, 0, 360) })
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault()
        setHsva({ ...hsva, h: clamp(hsva.h - step, 0, 360) })
      }
    }

    return (
      <div
        ref={trackRef}
        role="slider"
        aria-label="Hue"
        aria-valuenow={Math.round(hsva.h)}
        aria-valuemin={0}
        aria-valuemax={360}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(e) => { onPointerDown?.(e); if (!e.defaultPrevented) dragDown(e) }}
        onPointerMove={(e) => { onPointerMove?.(e); if (!e.defaultPrevented) dragMove(e) }}
        onKeyDown={handleKeyDown}
        className={cn("relative h-3 w-full touch-none rounded-full", disabled && "opacity-50", className)}
        style={{ backgroundImage: HUE_GRADIENT, ...style }}
        {...props}
      >
        <div
          aria-hidden
          className="border-background absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow"
          style={{ insetInlineStart: `${(hsva.h / 360) * 100}%`, backgroundColor: `hsl(${hsva.h} 100% 50%)` }}
        />
      </div>
    )
  }
)
ColorPickerHue.displayName = "ColorPickerHue"

const ColorPickerAlpha = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, style, onPointerDown, onPointerMove, onKeyDown, ...props }, ref) => {
    const { hsva, setHsva, disabled } = useColorPicker()
    const { trackRef, onPointerDown: dragDown, onPointerMove: dragMove } = useTrackPct(disabled, (pct) =>
      setHsva({ ...hsva, a: pct })
    )
    React.useImperativeHandle(ref, () => trackRef.current as HTMLDivElement)

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented || disabled) return
      const step = (e.shiftKey ? 10 : 1) / 100
      if (e.key === "ArrowRight" || e.key === "ArrowUp") {
        e.preventDefault()
        setHsva({ ...hsva, a: clamp(hsva.a + step, 0, 1) })
      } else if (e.key === "ArrowLeft" || e.key === "ArrowDown") {
        e.preventDefault()
        setHsva({ ...hsva, a: clamp(hsva.a - step, 0, 1) })
      }
    }

    const solid = hsvaToHex({ ...hsva, a: 1 })

    return (
      <div
        ref={trackRef}
        role="slider"
        aria-label="Alpha"
        aria-valuenow={Math.round(hsva.a * 100)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onPointerDown={(e) => { onPointerDown?.(e); if (!e.defaultPrevented) dragDown(e) }}
        onPointerMove={(e) => { onPointerMove?.(e); if (!e.defaultPrevented) dragMove(e) }}
        onKeyDown={handleKeyDown}
        className={cn("relative h-3 w-full touch-none rounded-full", disabled && "opacity-50", className)}
        style={{
          backgroundImage: `linear-gradient(to right, transparent, ${solid}), repeating-conic-gradient(#ccc 0% 25%, #fff 0% 50%)`,
          backgroundSize: "100% 100%, 0.5rem 0.5rem",
          ...style,
        }}
        {...props}
      >
        <div
          aria-hidden
          className="border-background absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 shadow"
          style={{ insetInlineStart: `${hsva.a * 100}%`, backgroundColor: solid }}
        />
      </div>
    )
  }
)
ColorPickerAlpha.displayName = "ColorPickerAlpha"

const ColorPickerInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange">
>(({ className, onFocus, onBlur, onKeyDown, ...props }, ref) => {
  const { hex, setHsva, disabled, isInvalid, validate, emitError } = useColorPicker()
  const [editing, setEditing] = React.useState(false)
  const [text, setText] = React.useState(hex)

  const commit = () => {
    const parsed = hexToHsva(text)
    const customMsg = validate ? validate(text) ?? null : null
    const msg = parsed === null ? customMsg ?? DEFAULT_HEX_ERROR : customMsg
    if (msg) {
      emitError(msg)
      setText(hex) // invalid input: revert, never throw
    } else {
      setHsva(parsed!) // also clears the error
    }
    setEditing(false)
  }

  return (
    <input
      ref={ref}
      type="text"
      aria-label="Hex color"
      disabled={disabled}
      aria-invalid={isInvalid}
      value={editing ? text : hex}
      onFocus={(e) => {
        setText(hex)
        setEditing(true)
        onFocus?.(e)
      }}
      onChange={(e) => {
        // Guards against a retained-focus edge case: if the previous commit was
        // invalid (revert set editing=false while focus never left), typing again
        // without a fresh focus event must still switch back into edit mode, or
        // the controlled value stays pinned to `hex` and swallows keystrokes.
        setEditing(true)
        setText(e.target.value)
      }}
      onBlur={(e) => {
        commit()
        onBlur?.(e)
      }}
      onKeyDown={(e) => {
        onKeyDown?.(e)
        if (e.defaultPrevented) return
        if (e.key === "Enter") {
          e.preventDefault()
          commit()
        } else if (e.key === "Escape") {
          setText(hex)
          setEditing(false)
        }
      }}
      className={cn(
        "border-input bg-transparent focus-visible:ring-ring w-full rounded-md border px-2 py-1 font-mono text-sm shadow-xs focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20",
        className
      )}
      {...props}
    />
  )
})
ColorPickerInput.displayName = "ColorPickerInput"

interface ColorPickerSwatchesProps extends React.HTMLAttributes<HTMLDivElement> {
  swatches: string[]
}

const ColorPickerSwatches = React.forwardRef<HTMLDivElement, ColorPickerSwatchesProps>(
  ({ swatches, className, ...props }, ref) => {
    const { setHsva, disabled } = useColorPicker()
    return (
      <div ref={ref} role="group" aria-label="Swatches" className={cn("flex flex-wrap gap-1.5", className)} {...props}>
        {swatches.map((swatch) => (
          <button
            key={swatch}
            type="button"
            aria-label={swatch}
            disabled={disabled}
            onClick={() => {
              const parsed = hexToHsva(swatch)
              if (parsed) setHsva(parsed)
            }}
            className="border-input size-6 shrink-0 rounded-full border shadow-xs disabled:opacity-50"
            style={{ backgroundColor: swatch }}
          />
        ))}
      </div>
    )
  }
)
ColorPickerSwatches.displayName = "ColorPickerSwatches"

export {
  ColorPicker,
  ColorPickerArea,
  ColorPickerHue,
  ColorPickerAlpha,
  ColorPickerInput,
  ColorPickerSwatches,
  hexToHsva,
  hsvaToHex,
}
