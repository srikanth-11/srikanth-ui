/**
 * The registry as plain data — no component references, so importing this pulls
 * nothing into the client bundle. Anything that only needs to *name* components
 * (nav, search, sidebars, counts) imports here; `registry-meta` zips these
 * entries together with their demo components for the pages that render them.
 */

export const SITE_URL = "https://srikanth-ui.vercel.app"

export type ComponentCategory = "form" | "picker" | "widget" | "overlay"

/**
 * One spelling of each category, for the gallery pills, the command palette and
 * the docs sidebar. Insertion order is the order all three present them in.
 */
export const CATEGORY_LABELS: Record<ComponentCategory, string> = {
  form: "Form inputs",
  picker: "Pickers & canvas",
  widget: "Widgets",
  overlay: "Overlays",
}

export interface RegistryIndexEntry {
  name: string
  title: string
  description: string
  category: ComponentCategory
  /** 2-4 imperative steps describing how a person operates the demo, not how to install it. */
  howToUse: string[]
}

export const registryIndex: RegistryIndexEntry[] = [
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
  },
  {
    name: "phone-input",
    title: "Phone Input",
    description: "International phone input with searchable country select and E.164 output.",
    category: "form",
    howToUse: [
      "Open the flag button and type to search for a country",
      "Type the local number and it spaces itself out as you go",
      "Watch the line underneath for the number in international form",
    ],
  },
  {
    name: "password-input",
    title: "Password Input",
    description: "Password field with visibility toggle, strength meter, and rule checklist.",
    category: "form",
    howToUse: [
      "Start typing a password and watch the strength bar fill",
      "Follow the checklist below it, where each rule ticks off as you meet it",
      "Press the eye button to read back what you have typed",
    ],
  },
  {
    name: "number-input",
    title: "Number Input",
    description: "Numeric input with steppers, clamping, and Intl currency/percent formatting.",
    category: "form",
    howToUse: [
      "Press the plus and minus buttons to nudge the amount up or down",
      "Or click into the field and use the up and down arrow keys",
      "Type a bare number, click away, and it comes back formatted as money",
    ],
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
  },
  {
    name: "image-cropper",
    title: "Image Cropper",
    description: "Image cropper with zoom and rotation sliders, plus a canvas helper returning a Blob.",
    category: "picker",
    howToUse: [
      "Zoom in with the slider, then drag the photo to frame it",
      "Straighten it with the rotate slider",
      "Press Crop to get the result",
    ],
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
  },
  {
    name: "event-calendar",
    title: "Event Calendar",
    description: "Month and week calendar with event chips, overlap-aware week layout, and a keyboard-navigable day grid.",
    category: "widget",
    howToUse: [
      "Switch between Month and Week with the two buttons on the right",
      "Step back and forward with the chevrons, or press Today to come home",
      "Walk the day grid with the arrow keys, and find events as chips on their day",
    ],
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
  },
  {
    name: "onboarding-tour",
    title: "Onboarding Tour",
    description: "Guided product tour with an SVG spotlight overlay, popover step cards, and optional localStorage completion.",
    category: "overlay",
    howToUse: [
      "Press Start tour to put the spotlight on the first control",
      "Move along with Next and Back, or bail out with Skip",
      "The lit-up control still works, so try typing in the search box mid-tour",
    ],
  },
  {
    name: "notification-inbox",
    title: "Notification Inbox",
    description: "Bell trigger with a capped unread badge, opening a tabbed popover with relative timestamps and per-row dismiss.",
    category: "widget",
    howToUse: [
      "Click the bell to open the list, with the badge counting what you have not read",
      "Switch to the Unread tab to hide everything you have already seen",
      "Dismiss a single row with its x, or clear the badge with Mark all as read",
    ],
  },
]
