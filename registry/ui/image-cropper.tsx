"use client"

import * as React from "react"
import Cropper, { type Area, type Point } from "react-easy-crop"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

const MIN_ZOOM = 1
const MAX_ZOOM = 3

interface ImageCropperProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onCropComplete" | "rotate"> {
  /** Image URL. Cross-origin sources need CORS headers for getCroppedImage to work. */
  src: string
  /** Width / height of the crop box. Default 1 (square). */
  aspect?: number
  cropShape?: "rect" | "round"
  /** Adds a rotation slider below the zoom slider. */
  rotate?: boolean
  /**
   * Receives the crop in source-image pixels plus the rotation it was taken
   * under. Both are needed by getCroppedImage — the area is measured in the
   * rotated frame, so cropping it without the rotation yields the wrong pixels.
   */
  onCropComplete?: (area: Area, rotation: number) => void
  /** External error; truthy = invalid. A crop can't be invalid on its own. */
  error?: React.ReactNode
  /** Default true. False renders visuals (aria-invalid) only — consumer renders the message. */
  showErrorMessage?: boolean
}

interface CroppedImageOptions {
  /** Output mime type. Default "image/png". */
  type?: string
  /** 0–1, honoured by lossy types only. */
  quality?: number
  /**
   * Degrees. Must be the rotation ImageCropper handed to onCropComplete
   * alongside the area — the area is measured in that rotated frame, so a
   * mismatch here crops the wrong pixels without erroring.
   */
  rotation?: number
}

// NaN falls back to lo: a garbage area must degrade to a drawable rect, never
// poison drawImage — getCroppedImage is contractually throw-free on bad areas.
// ±Infinity needs no special case, it clamps to the bound like any other number.
function clamp(value: number, lo: number, hi: number) {
  return Number.isNaN(value) ? lo : Math.min(Math.max(value, lo), hi)
}

/**
 * Clamps a crop area to the bounds of a `width` × `height` source. Result is
 * always inside the source and at least 1px on each axis.
 */
function computeCropRect(width: number, height: number, area: Area) {
  const x = clamp(Math.round(area.x), 0, Math.max(0, width - 1))
  const y = clamp(Math.round(area.y), 0, Math.max(0, height - 1))
  return {
    x,
    y,
    width: clamp(Math.round(area.width), 1, Math.max(1, width - x)),
    height: clamp(Math.round(area.height), 1, Math.max(1, height - y)),
  }
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener("load", () => resolve(image))
    image.addEventListener("error", () => reject(new Error(`Could not load image: ${src}`)))
    // Same-origin images ignore it. For cross-origin ones it swaps a silent failure
    // for a loud one: without it the canvas turns tainted and toBlob throws a
    // SecurityError at crop time; with it, a server that sends no CORS headers
    // simply fails to load and rejects here instead.
    image.crossOrigin = "anonymous"
    image.src = src
  })
}

function get2dContext(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas 2D context is unavailable")
  return ctx
}

/** Draws the image rotated about its centre onto a canvas sized to the rotated bounding box. */
function rotateToCanvas(image: HTMLImageElement, degrees: number) {
  const radians = (degrees * Math.PI) / 180
  const w = image.naturalWidth
  const h = image.naturalHeight
  const sin = Math.abs(Math.sin(radians))
  const cos = Math.abs(Math.cos(radians))
  const canvas = document.createElement("canvas")
  // round, not ceil: cos(90deg) is 6e-17 rather than 0, and ceil turns that
  // rounding dust into a stray blank pixel column on every right-angle rotation.
  canvas.width = Math.round(w * cos + h * sin)
  canvas.height = Math.round(w * sin + h * cos)
  const ctx = get2dContext(canvas)
  ctx.translate(canvas.width / 2, canvas.height / 2)
  ctx.rotate(radians)
  ctx.drawImage(image, -w / 2, -h / 2)
  return canvas
}

/**
 * Crops `src` to `area` (source-image pixels, as handed to onCropComplete).
 * A bad area is clamped, never thrown on. Rejects in exactly three cases: the image
 * fails to load, the canvas has no 2D context, or the crop can't be encoded.
 */
async function getCroppedImage(src: string, area: Area, opts: CroppedImageOptions = {}) {
  const { type = "image/png", quality, rotation = 0 } = opts
  const image = await loadImage(src)
  // react-easy-crop reports the area in the rotated frame, so the crop has to be
  // taken from a rotated copy — not from the upright image.
  const rotated = rotation ? rotateToCanvas(image, rotation) : null
  const source = rotated ?? image
  const rect = computeCropRect(
    rotated?.width ?? image.naturalWidth,
    rotated?.height ?? image.naturalHeight,
    area
  )

  const canvas = document.createElement("canvas")
  canvas.width = rect.width
  canvas.height = rect.height
  get2dContext(canvas).drawImage(
    source,
    rect.x,
    rect.y,
    rect.width,
    rect.height,
    0,
    0,
    rect.width,
    rect.height
  )

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Could not encode the cropped image"))),
      type,
      quality
    )
  })
}

const ImageCropper = React.forwardRef<HTMLDivElement, ImageCropperProps>(
  (
    {
      src,
      aspect = 1,
      cropShape = "rect",
      rotate = false,
      onCropComplete,
      error,
      showErrorMessage = true,
      className,
      ...props
    },
    ref
  ) => {
    const [crop, setCrop] = React.useState<Point>({ x: 0, y: 0 })
    const [zoom, setZoom] = React.useState(MIN_ZOOM)
    const [rotation, setRotation] = React.useState(0)
    const errorId = React.useId()
    const zoomLabelId = React.useId()
    const rotateLabelId = React.useId()
    const isInvalid = !!error
    const showError = isInvalid && showErrorMessage !== false
    // aria-describedby takes an id LIST — merge the consumer's ids with ours instead of
    // letting one replace the other. Applied after {...props} below, or it gets overwritten.
    const describedBy =
      [props["aria-describedby"], showError ? errorId : undefined].filter(Boolean).join(" ") ||
      undefined

    // react-easy-crop already fires this on interaction end (not per frame), so
    // the passthrough needs no debounce of its own. Rotation rides along because
    // the pixel area is expressed in the rotated frame and is unusable without it.
    const handleCropComplete = React.useCallback(
      (_percent: Area, pixels: Area) => onCropComplete?.(pixels, rotation),
      [onCropComplete, rotation]
    )

    return (
      /* ARIA 1.2 dropped aria-invalid from the global attributes, so `group`
         formally rejects it — but it is this registry's invalid styling hook
         (group-aria-invalid:* below), and the error itself is announced by the
         role="alert" message, not by the attribute. */
      /* eslint-disable-next-line jsx-a11y/role-supports-aria-props */
      <div
        ref={ref}
        data-slot="image-cropper"
        role="group"
        aria-invalid={isInvalid || undefined}
        className={cn("group grid gap-4", className)}
        {...props}
        aria-describedby={describedBy}
      >
        <div
          data-slot="image-cropper-area"
          className={cn(
            "border-input bg-muted relative h-64 w-full overflow-hidden rounded-md border",
            "group-aria-invalid:border-destructive group-aria-invalid:ring-destructive/20 group-aria-invalid:ring-[3px]"
          )}
        >
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={aspect}
            cropShape={cropShape}
            minZoom={MIN_ZOOM}
            maxZoom={MAX_ZOOM}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={handleCropComplete}
          />
        </div>

        {/* The labelled group is what carries the name to assistive tech: shadcn's
            Slider spreads props onto Radix's Root, never onto the Thumb, and Radix
            only names a single-thumb slider from the Thumb's own aria-label. So the
            aria-label below lands on the Root and the Thumb stays unnamed — the
            group announces "Zoom" on entry instead. Forward aria-label to
            SliderPrimitive.Thumb in ui/slider.tsx if you want it on the thumb. */}
        <div role="group" aria-labelledby={zoomLabelId} className="grid gap-1.5">
          <Label id={zoomLabelId} className="text-muted-foreground text-xs">
            Zoom
          </Label>
          <Slider
            aria-label="Zoom"
            value={[zoom]}
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={0.1}
            onValueChange={([value]) => setZoom(value)}
          />
        </div>

        {rotate && (
          <div role="group" aria-labelledby={rotateLabelId} className="grid gap-1.5">
            <Label id={rotateLabelId} className="text-muted-foreground text-xs">
              Rotate
            </Label>
            <Slider
              aria-label="Rotate"
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              onValueChange={([value]) => setRotation(value)}
            />
          </div>
        )}

        {showError && (
          <p id={errorId} role="alert" className="text-destructive text-xs">
            {error}
          </p>
        )}
      </div>
    )
  }
)
ImageCropper.displayName = "ImageCropper"

export { ImageCropper, computeCropRect, getCroppedImage }
export type { ImageCropperProps, CroppedImageOptions }
