"use client"

import * as React from "react"
import { EyeIcon, EyeOffIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<typeof Input>, "type">
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false)
  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        className={cn("pe-10", className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground absolute end-0 top-0 h-full w-10 hover:bg-transparent"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </Button>
    </div>
  )
})
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
    const score = getScore ? getScore(value) : met.filter(Boolean).length / rules.length
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
