import { TimePickerDemo } from "@/components/demos/time-picker-demo"
import { PhoneInputDemo } from "@/components/demos/phone-input-demo"
import { PasswordInputDemo } from "@/components/demos/password-input-demo"
import { NumberInputDemo } from "@/components/demos/number-input-demo"

export const SITE_URL = "https://srikanth-ui.vercel.app"

export const registryMeta = [
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
  },
] as const
