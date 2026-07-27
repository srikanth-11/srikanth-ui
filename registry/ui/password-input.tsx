"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PasswordInputProps extends Omit<React.ComponentProps<typeof Input>, "type"> {
  /** External/controlled error; truthy = invalid. Display takes precedence over internal validation. */
  error?: React.ReactNode
  /** No default policy (app-specific) — called on blur with the current value. */
  validate?: (value: string) => React.ReactNode | null
  /** Fires when internal validation error appears/clears. */
  onErrorChange?: (error: React.ReactNode | null) => void
  /** Default true. False renders visuals (aria-invalid) only — consumer renders the message. */
  showErrorMessage?: boolean
}

const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className, disabled, error, validate, onErrorChange, showErrorMessage = true, onBlur, ...props }, ref) => {
    const [visible, setVisible] = React.useState(false)

    const [internalError, setInternalError] = React.useState<React.ReactNode | null>(null)
    const prevErrorRef = React.useRef<React.ReactNode | null>(null)
    const emitError = (next: React.ReactNode | null) => {
      setInternalError(next)
      if (next !== prevErrorRef.current) {
        prevErrorRef.current = next
        onErrorChange?.(next)
      }
    }
    const displayError = error !== undefined ? error : internalError
    const isInvalid = !!displayError

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      if (validate) emitError(validate(e.target.value) ?? null)
      onBlur?.(e)
    }

    return (
      <div className="flex flex-col gap-1.5">
        <div className="relative">
          <Input
            ref={ref}
            type={visible ? "text" : "password"}
            disabled={disabled}
            aria-invalid={isInvalid}
            className={cn("pe-10", className)}
            onBlur={handleBlur}
            {...props}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            disabled={disabled}
            onClick={() => setVisible((v) => !v)}
            className="text-muted-foreground absolute end-0 top-0 h-full w-10 hover:bg-transparent"
          >
            {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
          </Button>
        </div>
        {isInvalid && showErrorMessage !== false && (
          <p role="alert" className="text-destructive mt-1.5 text-xs">
            {displayError}
          </p>
        )}
      </div>
    )
  }
)
PasswordInput.displayName = "PasswordInput"

export interface PasswordRule {
  label: string
  test: (pw: string) => boolean
}

const defaultPasswordRules: PasswordRule[] = [
  { label: "At least 8 characters", test: (pw) => pw.length >= 8 },
  { label: "Upper and lower case", test: (pw) => /[a-z]/.test(pw) && /[A-Z]/.test(pw) },
  { label: "At least one number", test: (pw) => /\d/.test(pw) },
  { label: "At least one symbol", test: (pw) => /[^a-zA-Z0-9]/.test(pw) },
]

interface PasswordStrengthProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  rules?: PasswordRule[]
  /** Return 0..1. Plug in zxcvbn etc. Default: fraction of rules met. */
  getScore?: (pw: string) => number
}

const PasswordStrength = React.forwardRef<HTMLDivElement, PasswordStrengthProps>(
  ({ value, rules = defaultPasswordRules, getScore, className, ...props }, ref) => {
    const met = rules.map((r) => r.test(value))
    const score = getScore ? getScore(value) : rules.length ? met.filter(Boolean).length / rules.length : 0
    const pct = Math.round(Math.min(1, Math.max(0, score)) * 100)
    const segments = 4
    const active = Math.round((pct / 100) * segments)

    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        <div
          role="meter"
          aria-label="Password strength"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          className="flex gap-1"
        >
          {Array.from({ length: segments }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-colors",
                i < active
                  ? active <= 1
                    ? "bg-destructive"
                    : active <= 2
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  : "bg-muted"
              )}
            />
          ))}
        </div>
        <ul className="text-muted-foreground space-y-1 text-xs">
          {rules.map((rule, i) => (
            <li
              key={rule.label}
              data-met={met[i]}
              className={cn("flex items-center gap-1.5", met[i] && "text-foreground")}
            >
              <span
                aria-hidden
                className={cn(
                  "size-1.5 rounded-full",
                  met[i] ? "bg-emerald-500" : "bg-muted-foreground/40"
                )}
              />
              {rule.label}
            </li>
          ))}
        </ul>
      </div>
    )
  }
)
PasswordStrength.displayName = "PasswordStrength"

export { PasswordInput, PasswordStrength, defaultPasswordRules }
