"use client"
import * as React from "react"
import type { Area } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { getCroppedImage, ImageCropper } from "@/registry/ui/image-cropper"

// Inline SVG data URI: no network fetch, no CORS, works offline and under a
// strict CSP. Encoded whole so the `url(#g)` fill reference survives.
const SRC = `data:image/svg+xml,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="0 0 480 480">
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="rgb(59,130,246)"/>
      <stop offset="1" stop-color="rgb(139,92,246)"/>
    </linearGradient></defs>
    <rect width="480" height="480" fill="url(#g)"/>
    <circle cx="150" cy="150" r="86" fill="rgb(255,255,255)" fill-opacity="0.35"/>
    <rect x="250" y="270" width="170" height="140" rx="24" fill="rgb(255,255,255)" fill-opacity="0.5"/>
    <text x="240" y="245" text-anchor="middle" font-family="sans-serif" font-size="30" fill="rgb(255,255,255)">drag · zoom · rotate</text>
  </svg>`
)}`

export function ImageCropperDemo() {
  // Rotation rides along with the area — getCroppedImage needs both, since the
  // area is measured in the rotated frame.
  const [crop, setCrop] = React.useState<{ area: Area; rotation: number } | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  return (
    <div className="w-full max-w-sm space-y-3">
      <ImageCropper
        src={SRC}
        aspect={1}
        rotate
        onCropComplete={(area, rotation) => setCrop({ area, rotation })}
      />
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!crop}
          onClick={() => {
            if (!crop) return
            getCroppedImage(SRC, crop.area, { rotation: crop.rotation })
              .then((blob) => setPreview(URL.createObjectURL(blob)))
              .catch(() => setPreview(null))
          }}
        >
          Crop
        </Button>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element -- runtime blob URL, nothing for next/image to optimise
          <img src={preview} alt="Cropped result" className="size-10 rounded-md border" />
        ) : (
          <p className="text-muted-foreground text-xs">Crop returns a Blob</p>
        )}
      </div>
    </div>
  )
}
