"use client"

import * as React from "react"
import {
  AsYouType,
  getCountries,
  getCountryCallingCode,
  isValidPhoneNumber,
  parsePhoneNumberFromString,
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
  defaultCountry?: CountryCode
  onChange?: (e164: string) => void
  onCountryChange?: (country: CountryCode) => void
}

const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, defaultCountry = "US", onChange, onCountryChange, className, ...props }, ref) => {
    const [country, setCountry] = React.useState<CountryCode>(defaultCountry)
    const [national, setNational] = React.useState("")
    const [open, setOpen] = React.useState(false)
    const lastEmitted = React.useRef<string | undefined>(undefined)

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

    const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      emit(e.target.value.replace(/\D/g, ""), country)
    }

    const selectCountry = (c: CountryCode) => {
      setCountry(c)
      setOpen(false)
      onCountryChange?.(c)
      emit(national.replace(/\D/g, ""), c)
    }

    return (
      <div className={cn("flex items-stretch gap-2", className)}>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              role="combobox"
              aria-expanded={open}
              aria-label="Select country"
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
          value={national}
          onChange={handleInput}
          {...props}
        />
      </div>
    )
  }
)
PhoneInput.displayName = "PhoneInput"

export { PhoneInput, isValidPhoneNumber }
export type { CountryCode }
