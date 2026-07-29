"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type Unit = "hours" | "minutes" | "seconds"

interface Ctx {
  date: Date
  setDate: (d: Date) => void
  hourCycle: 12 | 24
  isInvalid: boolean
  /** Id of the rendered error message, or undefined when none is shown. Every segment
   * points its `aria-describedby` at it — the group wrapper is never focused. */
  errorId?: string
}

const TimePickerContext = React.createContext<Ctx | null>(null)

function useTimePicker() {
  const ctx = React.useContext(TimePickerContext)
  if (!ctx) throw new Error("TimePicker parts must be used within <TimePicker>")
  return ctx
}

function getUnit(date: Date, unit: Unit, hourCycle: 12 | 24): number {
  if (unit === "hours") {
    const h = date.getHours()
    return hourCycle === 12 ? (h % 12 === 0 ? 12 : h % 12) : h
  }
  return unit === "minutes" ? date.getMinutes() : date.getSeconds()
}

function setUnit(date: Date, unit: Unit, raw: number, hourCycle: 12 | 24): Date {
  const d = new Date(date)
  if (unit === "hours") {
    if (hourCycle === 12) {
      const pm = date.getHours() >= 12
      const h12 = ((raw % 12) + 12) % 12
      d.setHours(pm ? h12 + 12 : h12)
    } else {
      d.setHours(((raw % 24) + 24) % 24)
    }
  } else if (unit === "minutes") {
    d.setMinutes(((raw % 60) + 60) % 60)
  } else {
    d.setSeconds(((raw % 60) + 60) % 60)
  }
  return d
}

interface TimePickerProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  value?: Date
  defaultValue?: Date
  onChange?: (date: Date) => void
  hourCycle?: 12 | 24
  /** External error; truthy = invalid. Segments cannot produce invalid times themselves. */
  error?: React.ReactNode
  /** Default true. False renders visuals (aria-invalid) only — consumer renders the message. */
  showErrorMessage?: boolean
}

const TimePicker = React.forwardRef<HTMLDivElement, TimePickerProps>(
  (
    { value, defaultValue, onChange, hourCycle = 24, error, showErrorMessage = true, className, children, ...props },
    ref
  ) => {
    const [internal, setInternal] = React.useState<Date>(
      () => defaultValue ?? new Date(new Date().setHours(0, 0, 0, 0))
    )
    const isControlled = value !== undefined
    const date = isControlled ? value : internal
    const isInvalid = !!error
    const errorId = React.useId()
    const showError = isInvalid && showErrorMessage !== false

    if (process.env.NODE_ENV !== "production" && isControlled && !onChange) {
      console.warn("TimePicker: `value` without `onChange` — component is read-only.")
    }

    const setDate = React.useCallback(
      (d: Date) => {
        if (!isControlled) setInternal(d)
        onChange?.(d)
      },
      [isControlled, onChange]
    )

    return (
      <TimePickerContext.Provider
        value={{ date, setDate, hourCycle, isInvalid, errorId: showError ? errorId : undefined }}
      >
        <div ref={ref} role="group" className={cn("flex items-center gap-1", className)} {...props}>
          {children}
        </div>
        {showError && (
          <p id={errorId} role="alert" className="text-destructive mt-1.5 text-xs">
            {error}
          </p>
        )}
      </TimePickerContext.Provider>
    )
  }
)
TimePicker.displayName = "TimePicker"

const unitLabel: Record<Unit, string> = { hours: "Hours", minutes: "Minutes", seconds: "Seconds" }

interface TimePickerInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  unit: Unit
}

const TimePickerInput = React.forwardRef<HTMLInputElement, TimePickerInputProps>(
  ({ unit, className, onKeyDown, ...props }, ref) => {
    const { date, setDate, hourCycle, isInvalid, errorId } = useTimePicker()
    const buffer = React.useRef<string>("")
    const display = String(getUnit(date, unit, hourCycle)).padStart(2, "0")
    const max = unit === "hours" ? (hourCycle === 12 ? 12 : 23) : 59

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(e)
      if (e.defaultPrevented) return
      if (e.key === "ArrowUp" || e.key === "ArrowDown") {
        e.preventDefault()
        buffer.current = ""
        setDate(setUnit(date, unit, getUnit(date, unit, hourCycle) + (e.key === "ArrowUp" ? 1 : -1), hourCycle))
      } else if (/^\d$/.test(e.key)) {
        e.preventDefault()
        const next = buffer.current + e.key
        let n = parseInt(next, 10)
        if (n > max) {
          buffer.current = e.key
          n = parseInt(e.key, 10)
        } else {
          buffer.current = next.length >= 2 ? "" : next
        }
        setDate(setUnit(date, unit, n, hourCycle))
      } else if (e.key === "Backspace") {
        e.preventDefault()
        buffer.current = ""
        setDate(setUnit(date, unit, 0, hourCycle))
      }
    }

    return (
      <input
        ref={ref}
        type="text"
        inputMode="numeric"
        role="spinbutton"
        aria-label={unitLabel[unit]}
        aria-valuenow={getUnit(date, unit, hourCycle)}
        aria-valuemin={unit === "hours" ? (hourCycle === 12 ? 1 : 0) : 0}
        aria-valuemax={max}
        aria-invalid={isInvalid}
        aria-describedby={errorId}
        value={display}
        onChange={() => {}}
        onKeyDown={handleKeyDown}
        onBlur={() => (buffer.current = "")}
        className={cn(
          "border-input bg-transparent focus-visible:ring-ring w-11 rounded-md border px-2 py-1 text-center font-mono text-sm tabular-nums shadow-xs focus-visible:ring-2 focus-visible:outline-none aria-invalid:border-destructive aria-invalid:ring-destructive/20",
          className
        )}
        {...props}
      />
    )
  }
)
TimePickerInput.displayName = "TimePickerInput"

const TimePickerPeriod = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => {
  const { date, setDate, hourCycle, isInvalid, errorId } = useTimePicker()
  if (hourCycle !== 12) return null
  const pm = date.getHours() >= 12
  const toggle = () => {
    const d = new Date(date)
    d.setHours(pm ? d.getHours() - 12 : d.getHours() + 12)
    setDate(d)
  }
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size="sm"
      aria-label={pm ? "PM, toggle to AM" : "AM, toggle to PM"}
      aria-invalid={isInvalid}
      aria-describedby={errorId}
      onClick={toggle}
      className={cn("w-12 font-mono", className)}
      {...props}
    >
      {pm ? "PM" : "AM"}
    </Button>
  )
})
TimePickerPeriod.displayName = "TimePickerPeriod"

export { TimePicker, TimePickerInput, TimePickerPeriod }
