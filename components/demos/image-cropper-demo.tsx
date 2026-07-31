"use client"
import * as React from "react"
import type { Area } from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { getCroppedImage, ImageCropper } from "@/registry/ui/image-cropper"

// Bundled same-origin photo: a real subject makes framing meaningful, and
// same-origin keeps the crop canvas untainted.
const SRC = "/demo/crop-sample.jpg"

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
      {/* The steps used to live here; they are `howToUse` in the registry index
          now, printed above this demo on the docs page and nowhere twice. */}
      <ImageCropper
        src={SRC}
        aspect={1}
        rotate
        onCropComplete={(area, rotation) => setCrop({ area, rotation })}
      />
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
      {/* Live region on the stable wrapper, not on either branch: a region has to
          be in the DOM before its contents change for the swap to be announced,
          and pressing Crop is otherwise silent to a screen reader. */}
      <div aria-live="polite">
        {preview ? (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element -- runtime blob URL, nothing for next/image to optimise */}
            <img src={preview} alt="Cropped result" className="size-24 rounded-md border" />
            <a
              href={preview}
              download="cropped.png"
              className="text-sm underline underline-offset-4"
            >
              Download
            </a>
          </div>
        ) : (
          <p className="text-muted-foreground text-xs">Your cropped image appears here</p>
        )}
      </div>
    </div>
  )
}

export function ImageCropperInvalidDemo() {
  // A crop can't be invalid on its own — the app validates the result and
  // passes `error`, which rings the crop area.
  return (
    <div className="w-full max-w-sm">
      <ImageCropper src={SRC} aspect={1} error="Image must be at least 400×400" />
    </div>
  )
}
