import type { ComponentType } from "react"
import { registryIndex, type RegistryIndexEntry } from "@/lib/registry-index"
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

export { SITE_URL } from "@/lib/registry-index"
export type { ComponentCategory } from "@/lib/registry-index"

interface DemoBinding {
  Demo: ComponentType
  /** Optional error-state example, rendered under the main preview on the docs page. */
  InvalidDemo?: ComponentType
}

export interface RegistryMetaEntry extends RegistryIndexEntry, DemoBinding {}

/**
 * Demos live here and not in `registry-index` on purpose: they are client components,
 * so every module that reaches this one hands the whole demo graph — dnd-kit,
 * react-easy-crop, libphonenumber — to the browser, on every route that imports it.
 * Import `registryIndex` instead unless you actually render a demo.
 */
const demos: Record<string, DemoBinding> = {
  "time-picker": { Demo: TimePickerDemo, InvalidDemo: TimePickerInvalidDemo },
  "phone-input": { Demo: PhoneInputDemo, InvalidDemo: PhoneInputInvalidDemo },
  "password-input": { Demo: PasswordInputDemo, InvalidDemo: PasswordInputInvalidDemo },
  "number-input": { Demo: NumberInputDemo, InvalidDemo: NumberInputInvalidDemo },
  "color-picker": { Demo: ColorPickerDemo, InvalidDemo: ColorPickerInvalidDemo },
  "signature-pad": { Demo: SignaturePadDemo, InvalidDemo: SignaturePadInvalidDemo },
  "image-cropper": { Demo: ImageCropperDemo, InvalidDemo: ImageCropperInvalidDemo },
  "cookie-consent": { Demo: CookieConsentDemo },
  "event-calendar": { Demo: EventCalendarDemo },
  kanban: { Demo: KanbanDemo },
  "onboarding-tour": { Demo: OnboardingTourDemo },
  "notification-inbox": { Demo: NotificationInboxDemo },
}

export const registryMeta: RegistryMetaEntry[] = registryIndex.map((entry) => ({
  ...entry,
  ...demos[entry.name],
}))
