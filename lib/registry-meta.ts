import type { ComponentType } from "react"
import { TimePickerDemo } from "@/components/demos/time-picker-demo"
import { PhoneInputDemo, PhoneInputInvalidDemo } from "@/components/demos/phone-input-demo"
import { PasswordInputDemo } from "@/components/demos/password-input-demo"
import { NumberInputDemo, NumberInputInvalidDemo } from "@/components/demos/number-input-demo"
import { ColorPickerDemo, ColorPickerInvalidDemo } from "@/components/demos/color-picker-demo"
import { SignaturePadDemo } from "@/components/demos/signature-pad-demo"
import { ImageCropperDemo } from "@/components/demos/image-cropper-demo"
import { CookieConsentDemo } from "@/components/demos/cookie-consent-demo"

export const SITE_URL = "https://srikanth-ui.vercel.app"

interface RegistryMetaEntry {
  name: string
  title: string
  description: string
  Demo: ComponentType
  /** Optional error-state example, rendered under the main preview on the docs page. */
  InvalidDemo?: ComponentType
}

export const registryMeta: RegistryMetaEntry[] = [
  {
    name: "time-picker",
    title: "Time Picker",
    description: "Keyboard-first time input with hour/minute/second segments and 12/24h support.",
    Demo: TimePickerDemo,
  },
  {
    name: "phone-input",
    title: "Phone Input",
    description: "International phone input with searchable country select and E.164 output.",
    Demo: PhoneInputDemo,
    InvalidDemo: PhoneInputInvalidDemo,
  },
  {
    name: "password-input",
    title: "Password Input",
    description: "Password field with visibility toggle, strength meter, and rule checklist.",
    Demo: PasswordInputDemo,
  },
  {
    name: "number-input",
    title: "Number Input",
    description: "Numeric input with steppers, clamping, and Intl currency/percent formatting.",
    Demo: NumberInputDemo,
    InvalidDemo: NumberInputInvalidDemo,
  },
  {
    name: "color-picker",
    title: "Color Picker",
    description: "HSV color picker with saturation pad, hue and alpha sliders, hex input, and swatches.",
    Demo: ColorPickerDemo,
    InvalidDemo: ColorPickerInvalidDemo,
  },
  {
    name: "signature-pad",
    title: "Signature Pad",
    description: "Canvas signature capture with pointer drawing, stroke-level undo, and a hidden form input.",
    Demo: SignaturePadDemo,
  },
  {
    name: "image-cropper",
    title: "Image Cropper",
    description: "Image cropper with zoom and rotation sliders, plus a canvas helper returning a Blob.",
    Demo: ImageCropperDemo,
  },
  {
    name: "cookie-consent",
    title: "Cookie Consent",
    description: "Cookie banner with per-category preferences and versioned localStorage consent.",
    Demo: CookieConsentDemo,
  },
]
