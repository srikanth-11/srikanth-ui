"use client"

import * as React from "react"
import { MinusIcon, PlusIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface NumberInputProps
  extends Omit<
    React.ComponentProps<typeof Input>,
    "value" | "defaultValue" | "onChange" | "type" | "min" | "max" | "step"
  > {
  value?: number | null
  defaultValue?: number
  onChange?: (value: number | null) => void
  min?: number
  max?: number
  step?: number
  format?: Intl.NumberFormatOptions
  locale?: string
  allowWheel?: boolean
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  (
    {
      value,
      defaultValue,
      onChange,
      min = Number.MIN_SAFE_INTEGER,
      max = Number.MAX_SAFE_INTEGER,
      step = 1,
      format,
      locale,
      allowWheel = false,
      disabled,
      className,
      onBlur,
      onFocus,
      onKeyDown,
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined
    const [internal, setInternal] = React.useState<number | null>(defaultValue ?? null)
    const current = isControlled ? value : internal
    const [editing, setEditing] = React.useState(false)
    const [text, setText] = React.useState("")
    const holdRef = React.useRef<ReturnType<typeof setInterval> | null>(null)
    const inputRef = React.useRef<HTMLInputElement | null>(null)
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement)

    if (process.env.NODE_ENV !== "production" && isControlled && !onChange) {
      console.warn("NumberInput: `value` without `onChange` — component is read-only.")
    }

    const formatter = React.useMemo(
      () => new Intl.NumberFormat(locale, format),
      [locale, format]
    )

    const commit = (n: number | null) => {
      const next = n === null ? null : clamp(n, min, max)
      if (!isControlled) setInternal(next)
      onChange?.(next)
      return next
    }

    const stepBy = (dir: 1 | -1) => {
      commit((current ?? 0) + dir * step)
    }

    const startHold = (dir: 1 | -1) => {
      let val = clamp((current ?? 0) + dir * step, min, max)
      commit(val)
      let ticks = 0
      holdRef.current = setInterval(() => {
        ticks++
        if (ticks > 3) {
          val = clamp(val + dir * step, min, max)
          commit(val)
        }
      }, 120)
    }
    const endHold = () => {
      if (holdRef.current) clearInterval(holdRef.current)
      holdRef.current = null
    }
    React.useEffect(() => endHold, [])

    // React's onWheel is passive, so preventDefault() there is a no-op (page still
    // scrolls + browsers warn). Attach a native non-passive listener instead.
    const stepByLatest = React.useRef(stepBy)
    stepByLatest.current = stepBy
    React.useEffect(() => {
      const el = inputRef.current
      if (!el || !allowWheel) return
      const handler = (e: WheelEvent) => {
        if (document.activeElement !== el) return
        e.preventDefault()
        stepByLatest.current(e.deltaY < 0 ? 1 : -1)
      }
      el.addEventListener("wheel", handler, { passive: false })
      return () => el.removeEventListener("wheel", handler)
    }, [allowWheel])

    const display = editing
      ? text
      : current === null || current === undefined
        ? ""
        : formatter.format(current)

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setEditing(false)
      // ponytail: naive parse (strips , as thousands sep) — breaks comma-decimal locales; swap for Intl-aware parser if reported
      const cleaned = text.replace(/[^\d.,-]/g, "").replace(/,/g, "")
      const parsed = cleaned === "" || cleaned === "-" ? null : Number(cleaned)
      commit(parsed === null || Number.isNaN(parsed) ? null : parsed)
      onBlur?.(e)
    }

    const decreaseDisabled = disabled || (current !== null && current !== undefined && current <= min)
    const increaseDisabled = disabled || (current !== null && current !== undefined && current >= max)

    return (
      <div className={cn("flex items-stretch gap-1", className)}>
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Decrease"
          tabIndex={-1}
          disabled={decreaseDisabled}
          onPointerDown={() => !decreaseDisabled && startHold(-1)}
          onPointerUp={endHold}
          onPointerLeave={endHold}
        >
          <MinusIcon className="size-4" />
        </Button>
        <Input
          ref={inputRef}
          type="text"
          inputMode="decimal"
          role="spinbutton"
          aria-valuenow={current ?? undefined}
          aria-valuemin={min === Number.MIN_SAFE_INTEGER ? undefined : min}
          aria-valuemax={max === Number.MAX_SAFE_INTEGER ? undefined : max}
          value={display}
          disabled={disabled}
          onFocus={(e) => {
            setEditing(true)
            setText(current === null || current === undefined ? "" : String(current))
            onFocus?.(e)
          }}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => {
            onKeyDown?.(e)
            if (e.defaultPrevented) return
            if (e.key === "ArrowUp") { e.preventDefault(); stepBy(1); setEditing(false) }
            if (e.key === "ArrowDown") { e.preventDefault(); stepBy(-1); setEditing(false) }
          }}
          className="text-center tabular-nums"
          {...props}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label="Increase"
          tabIndex={-1}
          disabled={increaseDisabled}
          onPointerDown={() => !increaseDisabled && startHold(1)}
          onPointerUp={endHold}
          onPointerLeave={endHold}
        >
          <PlusIcon className="size-4" />
        </Button>
      </div>
    )
  }
)
NumberInput.displayName = "NumberInput"

export { NumberInput }
