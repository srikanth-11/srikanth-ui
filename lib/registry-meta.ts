import type { ComponentType } from "react"
import { TimePickerDemo, TimePickerInvalidDemo } from "@/components/demos/time-picker-demo"
import { PhoneInputDemo, PhoneInputInvalidDemo } from "@/components/demos/phone-input-demo"
import { PasswordInputDemo, PasswordInputInvalidDemo } from "@/components/demos/password-input-demo"
import { NumberInputDemo, NumberInputInvalidDemo } from "@/components/demos/number-input-demo"
import { ColorPickerDemo, ColorPickerInvalidDemo } from "@/components/demos/color-picker-demo"
import { SignaturePadDemo, SignaturePadInvalidDemo } from "@/components/demos/signature-pad-demo"
import { ImageCropperDemo, ImageCropperInvalidDemo } from "@/components/demos/image-cropper-demo"
import { CookieConsentDemo } from "@/components/demos/cookie-consent-demo"
import { EventCalendarDemo } from "@/components/demos/event-calendar-demo"
import { KanbanDemo } from "@/components/demos/kanban-demo"
import { OnboardingTourDemo } from "@/components/demos/onboarding-tour-demo"
import { NotificationInboxDemo } from "@/components/demos/notification-inbox-demo"

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
    InvalidDemo: TimePickerInvalidDemo,
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
    InvalidDemo: PasswordInputInvalidDemo,
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
    InvalidDemo: SignaturePadInvalidDemo,
  },
  {
    name: "image-cropper",
    title: "Image Cropper",
    description: "Image cropper with zoom and rotation sliders, plus a canvas helper returning a Blob.",
    Demo: ImageCropperDemo,
    InvalidDemo: ImageCropperInvalidDemo,
  },
  {
    name: "cookie-consent",
    title: "Cookie Consent",
    description: "Cookie banner with per-category preferences and versioned localStorage consent.",
    Demo: CookieConsentDemo,
  },
  {
    name: "event-calendar",
    title: "Event Calendar",
    description: "Month and week calendar with event chips, overlap-aware week layout, and a keyboard-navigable day grid.",
    Demo: EventCalendarDemo,
  },
  {
    name: "kanban",
    title: "Kanban",
    description: "Controlled drag-and-drop board with sortable cards, cross-column moves, and pointer and keyboard sensors.",
    Demo: KanbanDemo,
  },
  {
    name: "onboarding-tour",
    title: "Onboarding Tour",
    description: "Guided product tour with an SVG spotlight overlay, popover step cards, and optional localStorage completion.",
    Demo: OnboardingTourDemo,
  },
  {
    name: "notification-inbox",
    title: "Notification Inbox",
    description: "Bell trigger with a capped unread badge, opening a tabbed popover with relative timestamps and per-row dismiss.",
    Demo: NotificationInboxDemo,
  },
]
