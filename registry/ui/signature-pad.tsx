"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type Point = { x: number; y: number }

/** Imperative API exposed on the SignaturePad ref (the ref is NOT the DOM node). */
interface SignaturePadHandle {
  clear(): void
  undo(): void
  isEmpty(): boolean
  toDataURL(type?: string): string
}

interface SignaturePadProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fires on stroke end with the current canvas data URL. */
  onEnd?: (dataUrl: string) => void
  /** Any CSS color. Defaults to the canvas's computed `color` (theme foreground). */
  penColor?: string
  backgroundColor?: string
  disabled?: boolean
  /** Renders a hidden input carrying the data URL (empty string when empty) for form POST. */
  name?: string
  /** External error; truthy = invalid. Signatures cannot be invalid on their own. */
  error?: React.ReactNode
  /** Default true. False renders visuals (aria-invalid) only — consumer renders the message. */
  showErrorMessage?: boolean
}

// Quadratic midpoint smoothing: each recorded point is a control point, the curve
// passes through the midpoints — cheap, and hides pointer sampling jitter.
function traceStroke(ctx: CanvasRenderingContext2D, pts: Point[]) {
  if (pts.length === 0) return
  if (pts.length === 1) {
    ctx.beginPath()
    ctx.arc(pts[0].x, pts[0].y, ctx.lineWidth / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length - 1; i++) {
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + pts[i + 1].x) / 2, (pts[i].y + pts[i + 1].y) / 2)
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y)
  ctx.stroke()
}

const SignaturePad = React.forwardRef<SignaturePadHandle, SignaturePadProps>(
  (
    {
      onEnd,
      penColor,
      backgroundColor,
      disabled,
      name,
      error,
      showErrorMessage = true,
      className,
      "aria-label": ariaLabel = "Signature pad",
      ...props
    },
    ref
  ) => {
    const canvasRef = React.useRef<HTMLCanvasElement | null>(null)
    // Points live in refs, not state: a stroke is hundreds of points and none of
    // them should re-render React. Only the hidden input's value is state.
    const strokes = React.useRef<Point[][]>([])
    const current = React.useRef<Point[] | null>(null)
    // Only the pointer that started the stroke may extend or end it — a palm or
    // second finger otherwise jumps the line and commits the stroke early.
    const activeId = React.useRef<number | null>(null)
    const [value, setValue] = React.useState("")
    const errorId = React.useId()
    const isInvalid = !!error
    const showError = isInvalid && showErrorMessage !== false
    // Merge the consumer's aria-describedby with the error id (ARIA takes an id list).
    const describedBy =
      [props["aria-describedby"], showError ? errorId : undefined].filter(Boolean).join(" ") ||
      undefined

    const toDataURL = React.useCallback(
      (type?: string) => canvasRef.current?.toDataURL(type) ?? "",
      []
    )

    // ponytail: full replay of every stroke per frame + a getComputedStyle per
    // redraw — fine for signatures (hundreds of points), cache stroke bitmaps if
    // pads ever exceed ~10k points.
    const redraw = React.useCallback(() => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext("2d")
      if (!canvas || !ctx) return
      const dpr = window.devicePixelRatio || 1
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.clearRect(0, 0, w, h)
      if (backgroundColor) {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, w, h)
      }
      ctx.lineWidth = 2
      ctx.lineCap = "round"
      ctx.lineJoin = "round"
      // Canvas 2D can't resolve "currentColor" — read the inherited text color so
      // the default pen follows the theme. Resolved once per redraw and applied to
      // every replayed stroke, so a theme flip repaints the whole signature in the
      // new color at the next redraw (resize, or the next stroke) — not just the
      // strokes drawn after it.
      const pen = penColor || getComputedStyle(canvas).color || "#000"
      ctx.strokeStyle = pen
      ctx.fillStyle = pen
      for (const stroke of strokes.current) traceStroke(ctx, stroke)
      if (current.current) traceStroke(ctx, current.current)
    }, [penColor, backgroundColor])

    // Backing store follows element size × DPR; strokes are CSS-pixel coords, so
    // a resize just replays them at the new scale.
    React.useEffect(() => {
      const canvas = canvasRef.current
      if (!canvas) return
      const resize = () => {
        const dpr = window.devicePixelRatio || 1
        const rect = canvas.getBoundingClientRect()
        canvas.width = Math.max(1, Math.round(rect.width * dpr))
        canvas.height = Math.max(1, Math.round(rect.height * dpr))
        redraw()
      }
      resize()
      if (typeof ResizeObserver === "undefined") return
      const observer = new ResizeObserver(resize)
      observer.observe(canvas)
      return () => observer.disconnect()
    }, [redraw])

    // Disabled mid-stroke: abandon the in-flight stroke instead of committing it.
    // Without this the pad wedges — `pointer-events-none` swallows the ending
    // event, so `current` stays set and every later pointerdown returns early.
    React.useEffect(() => {
      if (!disabled || !current.current) return
      current.current = null
      activeId.current = null
      redraw()
    }, [disabled, redraw])

    const sync = React.useCallback(() => {
      const url = strokes.current.length ? toDataURL() : ""
      setValue(url)
      return url
    }, [toDataURL])

    React.useImperativeHandle(
      ref,
      () => ({
        clear() {
          strokes.current = []
          current.current = null
          redraw()
          sync()
        },
        undo() {
          strokes.current = strokes.current.slice(0, -1)
          redraw()
          sync()
        },
        isEmpty: () => strokes.current.length === 0,
        toDataURL,
      }),
      [redraw, sync, toDataURL]
    )

    const pointFrom = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const rect = e.currentTarget.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const isActive = (e: React.PointerEvent<HTMLCanvasElement>) =>
      !disabled && !!current.current && e.pointerId === activeId.current

    const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (disabled || current.current) return
      // Right/middle mouse buttons open menus, they don't draw.
      if (e.pointerType === "mouse" && e.button !== 0) return
      e.currentTarget.setPointerCapture?.(e.pointerId)
      activeId.current = e.pointerId
      current.current = [pointFrom(e)]
      redraw()
    }

    const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isActive(e)) return
      current.current!.push(pointFrom(e))
      redraw()
    }

    const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!isActive(e)) return
      strokes.current = [...strokes.current, current.current!]
      current.current = null
      activeId.current = null
      redraw()
      // sync() outside the optional call — `onEnd?.(sync())` would skip the
      // hidden-input update entirely whenever no onEnd handler is passed.
      const url = sync()
      onEnd?.(url)
    }

    return (
      <>
        {/* ARIA 1.2 dropped aria-invalid from the global attributes, so `group`
            formally rejects it — but it is this registry's invalid styling hook
            (aria-invalid:* below), and the error itself is announced by the
            role="alert" message, not by the attribute. */}
        {/* eslint-disable-next-line jsx-a11y/role-supports-aria-props */}
        <div
          data-slot="signature-pad"
          role="group"
          aria-invalid={isInvalid || undefined}
          aria-disabled={disabled || undefined}
          className={cn(
            "border-input bg-background relative h-40 w-full overflow-hidden rounded-md border shadow-xs",
            "aria-invalid:border-destructive aria-invalid:ring-destructive/20 aria-invalid:ring-[3px]",
            disabled && "pointer-events-none opacity-50",
            className
          )}
          {...props}
          aria-describedby={describedBy}
        >
          <canvas
            ref={canvasRef}
            role="img"
            aria-label={ariaLabel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="block size-full cursor-crosshair touch-none"
          />
        </div>
        {name && <input type="hidden" name={name} value={value} disabled={disabled} readOnly />}
        {showError && (
          <p id={errorId} role="alert" className="text-destructive mt-1.5 text-xs">
            {error}
          </p>
        )}
      </>
    )
  }
)
SignaturePad.displayName = "SignaturePad"

export { SignaturePad }
export type { SignaturePadHandle }
