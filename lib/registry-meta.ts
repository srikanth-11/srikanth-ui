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

export type ComponentCategory = "form" | "picker" | "widget" | "overlay"

interface RegistryMetaEntry {
  name: string
  title: string
  description: string
  category: ComponentCategory
  /** 2-4 imperative steps describing how a person operates the demo, not how to install it. */
  howToUse: string[]
  Demo: ComponentType
  /** Optional error-state example, rendered under the main preview on the docs page. */
  InvalidDemo?: ComponentType
}

export const registryMeta: RegistryMetaEntry[] = [
  {
    name: "time-picker",
    title: "Time Picker",
    description: "Keyboard-first time input with hour/minute/second segments and 12/24h support.",
    category: "form",
    howToUse: [
      "Click the hour or minute box and type the number you want",
      "Or hold the up and down arrow keys to run the value along",
      "Press the AM/PM button to switch the half of the day",
    ],
    Demo: TimePickerDemo,
    InvalidDemo: TimePickerInvalidDemo,
  },
  {
    name: "phone-input",
    title: "Phone Input",
    description: "International phone input with searchable country select and E.164 output.",
    category: "form",
    howToUse: [
      "Open the flag button and type to search for a country",
      "Type the local number — it spaces itself out as you go",
      "Watch the line underneath for the number in international form",
    ],
    Demo: PhoneInputDemo,
    InvalidDemo: PhoneInputInvalidDemo,
  },
  {
    name: "password-input",
    title: "Password Input",
    description: "Password field with visibility toggle, strength meter, and rule checklist.",
    category: "form",
    howToUse: [
      "Start typing a password and watch the strength bar fill",
      "Follow the checklist below it — each rule ticks off as you meet it",
      "Press the eye button to read back what you have typed",
    ],
    Demo: PasswordInputDemo,
    InvalidDemo: PasswordInputInvalidDemo,
  },
  {
    name: "number-input",
    title: "Number Input",
    description: "Numeric input with steppers, clamping, and Intl currency/percent formatting.",
    category: "form",
    howToUse: [
      "Press the plus and minus buttons to nudge the amount up or down",
      "Or click into the field and use the up and down arrow keys",
      "Type a bare number and click away — it comes back formatted as money",
    ],
    Demo: NumberInputDemo,
    InvalidDemo: NumberInputInvalidDemo,
  },
  {
    name: "color-picker",
    title: "Color Picker",
    description: "HSV color picker with saturation pad, hue and alpha sliders, hex input, and swatches.",
    category: "picker",
    howToUse: [
      "Drag inside the big square to set how rich and how bright the color is",
      "Slide the rainbow bar to change the color itself, the checkered one for see-through",
      "Or type a hex code, or click one of the swatches, to jump straight there",
    ],
    Demo: ColorPickerDemo,
    InvalidDemo: ColorPickerInvalidDemo,
  },
  {
    name: "signature-pad",
    title: "Signature Pad",
    description: "Canvas signature capture with pointer drawing, stroke-level undo, and a hidden form input.",
    category: "picker",
    howToUse: [
      "Sign in the box with a mouse, a stylus or your finger",
      "Press Undo to take back the last stroke, one at a time",
      "Press Clear to wipe the pad and start again",
    ],
    Demo: SignaturePadDemo,
    InvalidDemo: SignaturePadInvalidDemo,
  },
  {
    name: "image-cropper",
    title: "Image Cropper",
    description: "Image cropper with zoom and rotation sliders, plus a canvas helper returning a Blob.",
    category: "picker",
    howToUse: [
      "Drag the photo to frame the part you want",
      "Fine-tune with the zoom and rotate sliders",
      "Press Crop to get the result",
    ],
    Demo: ImageCropperDemo,
    InvalidDemo: ImageCropperInvalidDemo,
  },
  {
    name: "cookie-consent",
    title: "Cookie Consent",
    description: "Cookie banner with per-category preferences and versioned localStorage consent.",
    category: "overlay",
    howToUse: [
      "Take everything with Accept all, or keep only the essentials with Reject non-required",
      "Or open Preferences to turn analytics and marketing on one at a time",
      "Press Reset stored consent to forget the answer and see the banner again",
    ],
    Demo: CookieConsentDemo,
  },
  {
    name: "event-calendar",
    title: "Event Calendar",
    description: "Month and week calendar with event chips, overlap-aware week layout, and a keyboard-navigable day grid.",
    category: "widget",
    howToUse: [
      "Switch between Month and Week with the two buttons on the right",
      "Step back and forward with the chevrons, or press Today to come home",
      "Walk the day grid with the arrow keys — events sit as chips on their day",
    ],
    Demo: EventCalendarDemo,
  },
  {
    name: "kanban",
    title: "Kanban",
    description: "Controlled drag-and-drop board with sortable cards, cross-column moves, and pointer and keyboard sensors.",
    category: "widget",
    howToUse: [
      "Drag cards between columns with the pointer",
      "Or focus a card and press Space, arrows, Space to move it with the keyboard",
      "Every drop hands the whole new board back to your app",
    ],
    Demo: KanbanDemo,
  },
  {
    name: "onboarding-tour",
    title: "Onboarding Tour",
    description: "Guided product tour with an SVG spotlight overlay, popover step cards, and optional localStorage completion.",
    category: "overlay",
    howToUse: [
      "Press Start tour to put the spotlight on the first control",
      "Move along with Next and Back, or bail out with Skip",
      "The lit-up control still works — try typing in the search box mid-tour",
    ],
    Demo: OnboardingTourDemo,
  },
  {
    name: "notification-inbox",
    title: "Notification Inbox",
    description: "Bell trigger with a capped unread badge, opening a tabbed popover with relative timestamps and per-row dismiss.",
    category: "widget",
    howToUse: [
      "Click the bell to open the list — the badge counts what you have not read",
      "Switch to the Unread tab to hide everything you have already seen",
      "Dismiss a single row with its x, or clear the badge with Mark all as read",
    ],
    Demo: NotificationInboxDemo,
  },
]
