import { colorPickerDoc } from "./color-picker"
import { cookieConsentDoc } from "./cookie-consent"
import { eventCalendarDoc } from "./event-calendar"
import { imageCropperDoc } from "./image-cropper"
import { kanbanDoc } from "./kanban"
import { notificationInboxDoc } from "./notification-inbox"
import { numberInputDoc } from "./number-input"
import { onboardingTourDoc } from "./onboarding-tour"
import { passwordInputDoc } from "./password-input"
import { phoneInputDoc } from "./phone-input"
import { signaturePadDoc } from "./signature-pad"
import { timePickerDoc } from "./time-picker"
import type { ComponentDoc } from "./types"

// Pure data, keyed by registry name. Nothing here imports a component — the docs
// page is a server component and this stays client-safe by never touching one.
export const componentDocs: Record<string, ComponentDoc> = {
  "time-picker": timePickerDoc,
  "phone-input": phoneInputDoc,
  "password-input": passwordInputDoc,
  "number-input": numberInputDoc,
  "color-picker": colorPickerDoc,
  "signature-pad": signaturePadDoc,
  "image-cropper": imageCropperDoc,
  "cookie-consent": cookieConsentDoc,
  "event-calendar": eventCalendarDoc,
  kanban: kanbanDoc,
  "onboarding-tour": onboardingTourDoc,
  "notification-inbox": notificationInboxDoc,
}

export type { ComponentDoc, DocExample, DocExport, KeyRow, PropRow } from "./types"
