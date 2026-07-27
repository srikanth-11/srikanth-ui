"use client"

import * as React from "react"
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
  validatePhoneNumberLength,
  type CountryCode,
} from "libphonenumber-js/min"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

function countryFlag(country: string) {
  return String.fromCodePoint(
    ...[...country.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))
  )
}

const displayName =
  typeof Intl.DisplayNames !== "undefined"
    ? new Intl.DisplayNames(["en"], { type: "region" })
    : null

function countryName(code: string) {
  return displayName?.of(code) ?? code
}

interface PhoneInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange" | "defaultValue"> {
  value?: string
  /** Uncontrolled initial value, E.164. Ignored if `value` is provided. */
  defaultValue?: string
  defaultCountry?: CountryCode
  onChange?: (e164: string) => void
  onCountryChange?: (country: CountryCode) => void
  /** External/controlled error; truthy = invalid. Display takes precedence over internal validation. */
  error?: React.ReactNode
  /** Replaces the default validator. Called on blur with the current E.164 value. */
  validate?: (value: string) => React.ReactNode | null
  /** Fires when internal validation error appears/clears. */
  onErrorChange?: (error: React.ReactNode | null) => void
  /** Default true. False renders visuals (aria-invalid) only — consumer renders the message. */
  showErrorMessage?: boolean
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  (
    {
      value,
      defaultValue,
      defaultCountry = "US",
      onChange,
      onCountryChange,
      disabled,
      className,
      error,
      validate,
      onErrorChange,
      showErrorMessage = true,
      onBlur,
      ...props
    },
    ref
  ) => {
    const [country, setCountry] = React.useState<CountryCode>(() => {
      if (value === undefined && defaultValue) {
        const parsed = parsePhoneNumberFromString(defaultValue)
        if (parsed?.country) return parsed.country
      }
      return defaultCountry
    })
    const [national, setNational] = React.useState(() => {
      if (value === undefined && defaultValue) {
        const parsed = parsePhoneNumberFromString(defaultValue)
        if (parsed) return parsed.formatNational()
      }
      return ""
    })
    const [open, setOpen] = React.useState(false)
    const lastEmitted = React.useRef<string | undefined>(undefined)

    const [internalError, setInternalError] = React.useState<React.ReactNode | null>(null)
    const prevErrorRef = React.useRef<React.ReactNode | null>(null)
    const tooLongRef = React.useRef(false)
    // Digit count at which the number was last known valid. libphonenumber-js/min's
    // TOO_LONG check only fires well past most countries' real max length (e.g. 14+
    // digits for IN, whose numbers are 10) — the more useful "too long" signal is
    // "this was a complete, valid number, and typing more broke it."
    const lastValidLengthRef = React.useRef<number | null>(null)
    const emitError = (next: React.ReactNode | null) => {
      setInternalError(next)
      if (next !== prevErrorRef.current) {
        prevErrorRef.current = next
        onErrorChange?.(next)
      }
    }
    const displayError = error !== undefined ? error : internalError
    const isInvalid = !!displayError

    if (process.env.NODE_ENV !== "production" && value !== undefined && !onChange) {
      console.warn("PhoneInput: `value` without `onChange` — component is read-only.")
    }

    // Sync from controlled E.164 value
    React.useEffect(() => {
      if (value === undefined) return
      // Skip echo of our own onChange
      if (value === lastEmitted.current) return

      const parsed = parsePhoneNumberFromString(value)
      if (parsed?.country) setCountry(parsed.country)

      if (parsed) {
        setNational(parsed.formatNational())
      } else {
        // External value doesn't parse — derive digits and format with current country
        const cc = "+" + getCountryCallingCode(country)
        const digits = value.startsWith(cc) ? value.slice(cc.length) : value.replace(/\D/g, "")
        const formatter = new AsYouType(country)
        setNational(formatter.input(digits))
      }
    }, [value, country])

    const emit = (digits: string, c: CountryCode) => {
      const formatter = new AsYouType(c)
      setNational(formatter.input(digits))
      const e164 = digits ? `+${getCountryCallingCode(c)}${digits}` : ""
      lastEmitted.current = e164
      onChange?.(e164)
    }

    // Too-long is the one violation that can never become valid by typing more —
    // checked immediately per keystroke. Everything else validates on blur only.
    const checkTooLong = (digits: string, c: CountryCode) => {
      if (validate) return
      const e164 = digits ? `+${getCountryCallingCode(c)}${digits}` : ""

      if (digits && isValidPhoneNumber(e164, c)) {
        lastValidLengthRef.current = digits.length
        if (tooLongRef.current) {
          tooLongRef.current = false
          emitError(null)
        }
        return
      }

      const tooLongByLength = !!digits && validatePhoneNumberLength(digits, c) === "TOO_LONG"
      const grewPastValid = lastValidLengthRef.current !== null && digits.length > lastValidLengthRef.current

      if (tooLongByLength || grewPastValid) {
        tooLongRef.current = true
        emitError(`Phone number is too long for ${countryName(c)}`)
      } else if (tooLongRef.current) {
        tooLongRef.current = false
        emitError(null)
      }
    }

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value
      if (raw.startsWith("+")) {
        // Full international number (e.g. pasted) — reparse rather than naively
        // stripping to digits, which would double up the calling code.
        const parsed = parsePhoneNumberFromString(raw)
        if (parsed?.country) {
          if (parsed.country !== country) {
            setCountry(parsed.country)
            onCountryChange?.(parsed.country)
          }
          emit(parsed.nationalNumber, parsed.country)
          checkTooLong(parsed.nationalNumber, parsed.country)
          return
        }
        const cc = getCountryCallingCode(country)
        const rawDigits = raw.replace(/\D/g, "")
        const nationalDigits = rawDigits.startsWith(cc) ? rawDigits.slice(cc.length) : rawDigits
        emit(nationalDigits, country)
        checkTooLong(nationalDigits, country)
        return
      }
      const digits = raw.replace(/\D/g, "")
      emit(digits, country)
      checkTooLong(digits, country)
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      const digits = national.replace(/\D/g, "")
      const e164 = digits ? `+${getCountryCallingCode(country)}${digits}` : ""

      if (validate) {
        emitError(validate(e164) ?? null)
      } else if (!tooLongRef.current) {
        if (digits && !isValidPhoneNumber(e164, country)) {
          emitError(`Enter a valid ${countryName(country)} phone number`)
        } else {
          emitError(null)
        }
      }
      onBlur?.(e)
    }

    const selectCountry = (c: CountryCode) => {
      setCountry(c)
      setOpen(false)
      onCountryChange?.(c)
      const digits = national.replace(/\D/g, "")
      emit(digits, c)
      // Every internal error names the country ("too long for India"), and the
      // length refs are metadata for the country that just went away. Drop both
      // and re-check for the new one — handleBlur skips revalidation while
      // tooLongRef is set, so a stale error would otherwise stick forever.
      tooLongRef.current = false
      lastValidLengthRef.current = null
      emitError(null)
      checkTooLong(digits, c)
    }

    return (
      <>
      <div className={cn("flex items-stretch gap-2", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select country"
              disabled={disabled}
              className="w-[110px] justify-between font-mono"
            >
              <span>
                {countryFlag(country)} +{getCountryCallingCode(country)}
              </span>
              <ChevronsUpDownIcon className="size-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command>
              <CommandInput placeholder="Search country..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                <CommandGroup>
                  {getCountries().map((c) => (
                    <CommandItem
                      key={c}
                      value={`${countryName(c)} ${c}`}
                      onSelect={() => selectCountry(c)}
                    >
                      <span className="me-2">{countryFlag(c)}</span>
                      <span className="flex-1 truncate">{countryName(c)}</span>
                      <span className="text-muted-foreground font-mono text-xs">
                        +{getCountryCallingCode(c)}
                      </span>
                      <CheckIcon
                        className={cn("ms-2 size-4", c === country ? "opacity-100" : "opacity-0")}
                      />
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input
          ref={ref}
          type="tel"
          aria-label="Phone number"
          autoComplete="tel-national"
          aria-invalid={isInvalid}
          value={national}
          onChange={handleInput}
          onBlur={handleBlur}
          disabled={disabled}
          {...props}
        />
      </div>
      {isInvalid && showErrorMessage !== false && (
        <p role="alert" className="text-destructive mt-1.5 text-xs">
          {displayError}
        </p>
      )}
      </>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput, isValidPhoneNumber }
export type { CountryCode }
