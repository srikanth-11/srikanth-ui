import type { ComponentDoc } from "./types"

export const imageCropperDoc: ComponentDoc = {
  exports: [
    {
      name: "ImageCropper",
      props: [
        {
          name: "src",
          type: "string",
          description: "Image URL. Required. Cross-origin sources need CORS headers or `getCroppedImage` cannot read the pixels back.",
        },
        {
          name: "aspect",
          type: "number",
          default: "1",
          description: "Width / height of the crop box. 1 is square, 16 / 9 is widescreen.",
        },
        {
          name: "cropShape",
          type: '"rect" | "round"',
          default: '"rect"',
          description: "Shape of the crop overlay. `round` is the avatar case. The exported blob is still rectangular.",
        },
        {
          name: "rotate",
          type: "boolean",
          default: "false",
          description: "Adds a 0–360° rotation slider below the zoom slider.",
        },
        {
          name: "onCropComplete",
          type: "(area: Area, rotation: number) => void",
          description: "Fires when an interaction ends with the crop in source-image pixels plus the rotation it was measured under. Keep both. `getCroppedImage` needs the pair.",
        },
        {
          name: "error",
          type: "React.ReactNode",
          description: "External error, and the only way the cropper goes invalid. A crop cannot be invalid on its own, so any truthy value here marks it.",
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
          description: "Extra classes for the grid holding the crop area and the sliders.",
        },
      ],
    },
    {
      name: "getCroppedImage",
      props: [
        {
          name: "src",
          type: "string",
          description: "Same image URL you gave the cropper. It is loaded again with `crossOrigin=\"anonymous\"`.",
        },
        {
          name: "area",
          type: "Area",
          description: "The pixel area from `onCropComplete`. Out-of-bounds or NaN values are clamped into the image, never thrown on.",
        },
        {
          name: "opts",
          type: "CroppedImageOptions",
          default: "{}",
          description: "Output options. Resolves with a `Blob`. Rejects when the image cannot load, when no 2D canvas context is available, or when the canvas cannot encode the result.",
        },
      ],
    },
    {
      name: "CroppedImageOptions",
      props: [
        {
          name: "type",
          type: "string",
          default: '"image/png"',
          description: "Output mime type, e.g. `\"image/jpeg\"` or `\"image/webp\"`.",
        },
        {
          name: "quality",
          type: "number",
          description: "0–1, honoured by lossy types only.",
        },
        {
          name: "rotation",
          type: "number",
          default: "0",
          description: "Must be the rotation `onCropComplete` handed you with the area. The area is measured in that rotated frame, so a mismatch crops the wrong pixels without erroring.",
        },
      ],
    },
    {
      name: "computeCropRect",
      props: [
        {
          name: "width",
          type: "number",
          description: "Width of the source the area should fit inside.",
        },
        {
          name: "height",
          type: "number",
          description: "Height of the source the area should fit inside.",
        },
        {
          name: "area",
          type: "Area",
          description: "The area to clamp. Returns a rounded `{ x, y, width, height }` guaranteed to be inside the source and at least 1px on each axis. It is the same clamping `getCroppedImage` applies internally.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Crop to a blob",
      code: `"use client"

import * as React from "react"
import type { Area } from "react-easy-crop"
import { getCroppedImage, ImageCropper } from "@/components/ui/image-cropper"

const SRC = "/photo.jpg"

export function PhotoCropper() {
  const [crop, setCrop] = React.useState<Area | null>(null)

  return (
    <div className="space-y-3">
      <ImageCropper src={SRC} aspect={16 / 9} onCropComplete={(area) => setCrop(area)} />
      <button
        type="button"
        disabled={!crop}
        onClick={async () => {
          if (!crop) return
          const blob = await getCroppedImage(SRC, crop, { type: "image/jpeg", quality: 0.9 })
          console.log(blob.size)
        }}
      >
        Crop
      </button>
    </div>
  )
}`,
    },
    {
      title: "Round avatar with rotation",
      code: `"use client"

import * as React from "react"
import type { Area } from "react-easy-crop"
import { getCroppedImage, ImageCropper } from "@/components/ui/image-cropper"

const SRC = "/avatar.jpg"

export function AvatarCropper({ onUpload }: { onUpload: (file: Blob) => void }) {
  // Rotation rides along with the area: the area is measured in the rotated
  // frame, so cropping without it yields the wrong pixels.
  const [crop, setCrop] = React.useState<{ area: Area; rotation: number } | null>(null)

  return (
    <div className="space-y-3">
      <ImageCropper
        src={SRC}
        aspect={1}
        cropShape="round"
        rotate
        onCropComplete={(area, rotation) => setCrop({ area, rotation })}
      />
      <button
        type="button"
        disabled={!crop}
        onClick={async () => {
          if (!crop) return
          onUpload(await getCroppedImage(SRC, crop.area, { rotation: crop.rotation }))
        }}
      >
        Use photo
      </button>
    </div>
  )
}`,
    },
  ],
  errorState:
    "Framing cannot go wrong, so the cropper never invalidates itself. Zoom is capped at 1–3×, the crop box stays inside the image, and a garbage area is clamped rather than rejected. `error` is the only source, and it is where an app puts its own rule (\"image must be at least 400×400\", a rejected upload, a failed encode). A truthy `error` sets `aria-invalid` on the wrapper, which rings the crop area in destructive colors, and renders the message in a `role=\"alert\"` paragraph below the sliders, linked by `aria-describedby`. With `showErrorMessage={false}` the ring stays and the message is dropped. `getCroppedImage` clamps bad areas for the same reason, so it never throws on them. It rejects on exactly three things: the image failing to load (\"Could not load image: {src}\"), no 2D canvas context (\"Canvas 2D context is unavailable\"), and the canvas failing to encode the result (\"Could not encode the cropped image\"). The realistic failure is a cross-origin `src` served without CORS headers. Because the image is requested with `crossOrigin=\"anonymous\"`, such a response fails the load outright rather than tainting the canvas, so it surfaces as the load rejection. Worth catching and reporting through `error`.",
}
