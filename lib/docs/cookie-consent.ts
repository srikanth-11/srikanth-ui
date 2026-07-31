import type { ComponentDoc } from "./types"

export const cookieConsentDoc: ComponentDoc = {
  exports: [
    {
      name: "CookieConsent",
      props: [
        {
          name: "categories",
          type: "CookieCategory[]",
          description: "The cookie groups you are asking about, in the order the preferences dialog lists them. Required, and the shape of every consent payload. Reported consent always has exactly these ids.",
        },
        {
          name: "onConsent",
          type: "(consent: Record<string, boolean>) => void",
          description: "Fires on every save, and once on mount when a valid stored choice already exists, so this is the single place to switch scripts on. Required categories always arrive `true`.",
        },
        {
          name: "storageKey",
          type: "string",
          default: '"cookie-consent"',
          description: "localStorage key the choice is written under. Changing it re-prompts, since the old key is never read again.",
        },
        {
          name: "version",
          type: "number",
          default: "1",
          description: "Stamped into the stored payload. Bump it when the categories change. A stored choice under a different version is ignored and the banner comes back.",
        },
        {
          name: "policyHref",
          type: "string",
          description: "Adds a \"Cookie Policy\" link to both the banner copy and the dialog copy. Omit it and the sentence simply ends.",
        },
        {
          name: "className",
          type: "string",
          description: "Extra classes for the fixed bottom banner region. The preferences dialog is portalled and unaffected. Remaining props go to the banner as well.",
        },
      ],
    },
    {
      name: "CookieCategory",
      props: [
        {
          name: "id",
          type: "string",
          description: "Key this category takes in every consent payload.",
        },
        {
          name: "label",
          type: "string",
          description: "Switch label in the preferences dialog.",
        },
        {
          name: "description",
          type: "string",
          description: "Optional line under the label, wired to the switch through `aria-describedby`.",
        },
        {
          name: "required",
          type: "boolean",
          description: "Locks the category on: the switch renders checked and disabled, \"Reject non-required\" leaves it on, and it is emitted as `true` no matter what was stored.",
        },
      ],
    },
    {
      name: "getStoredConsent",
      props: [
        {
          name: "storageKey",
          type: "string",
          default: '"cookie-consent"',
          description: "The key to read. Pass the same one you gave the banner.",
        },
        {
          name: "version",
          type: "number",
          default: "1",
          description: "The version to accept. A payload stamped with anything else reads as no consent.",
        },
        {
          name: "→ returns",
          type: "Record<string, boolean> | null",
          description: "The raw stored choice, or `null` when there is none, it was saved under another version, it fails the shape check, or storage is unavailable. Safe on the server and never throws. The map is what was stored, not what the banner would report. It is not re-normalized against your categories.",
        },
      ],
    },
  ],
  examples: [
    {
      title: "Banner wired to scripts",
      code: `"use client"

import { CookieConsent, type CookieCategory } from "@/components/ui/cookie-consent"

const CATEGORIES: CookieCategory[] = [
  {
    id: "necessary",
    label: "Strictly necessary",
    description: "Sign-in and security. These cannot be turned off.",
    required: true,
  },
  { id: "analytics", label: "Analytics", description: "How the site is used, in aggregate." },
  { id: "marketing", label: "Marketing", description: "Ads measured across sites." },
]

export function Consent() {
  return (
    <CookieConsent
      categories={CATEGORIES}
      policyHref="/cookies"
      // Runs on save and once on mount when a choice is already stored, so this
      // is the only place that needs to know about consent.
      onConsent={(consent) => {
        if (consent.analytics) loadAnalytics()
      }}
    />
  )
}`,
    },
    {
      title: "Reading the stored choice elsewhere",
      code: `import { getStoredConsent } from "@/components/ui/cookie-consent"

export function canTrack() {
  // null on the server, before any choice, after a version bump, or when
  // storage is blocked. All of those mean "no consent yet".
  return getStoredConsent()?.analytics === true
}`,
    },
    {
      title: "Re-prompting after a policy change",
      code: `"use client"

import { CookieConsent, type CookieCategory } from "@/components/ui/cookie-consent"

// A new category means the old choice no longer covers everything being asked,
// so bump the version and the banner returns for everyone.
const CATEGORIES: CookieCategory[] = [
  { id: "necessary", label: "Strictly necessary", required: true },
  { id: "analytics", label: "Analytics" },
  { id: "personalization", label: "Personalization" },
]

export function Consent({ onConsent }: { onConsent: (c: Record<string, boolean>) => void }) {
  return <CookieConsent categories={CATEGORIES} version={2} onConsent={onConsent} />
}`,
    },
  ],
  errorState:
    "There is no `error` prop and no invalid input. A consent choice is three buttons and a set of switches. What can go wrong is storage, and every touch of it is guarded. Reading is wrapped in a `try`/`catch`, because `globalThis.localStorage` is undefined on the server and the getter itself throws in browsers with storage blocked. A missing entry, unparseable JSON, a version that does not match, and a `consent` value that is not a plain object of booleans all read as no consent, so the banner simply shows again. Arrays and `null` are rejected explicitly, since a hand-edited or foreign payload is untrusted. Writing is guarded the same way. With storage blocked the choice still applies for this session (the banner closes and `onConsent` fires) but it cannot be remembered, so the banner returns on the next load. Storage is read from an effect and never during render, which is why the banner starts hidden and appears a frame later once the client confirms there is no valid consent. A render-time read would hydration-mismatch. What reaches `onConsent` is always normalized against `categories`: required ids forced to `true`, missing or stale ids resolved to `false`, and ids you no longer declare dropped, so a payload left over from an older category list can never leak a permission you stopped asking about.",
}
