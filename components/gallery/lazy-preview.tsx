"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

/**
 * Mounts `children` only once the wrapper nears the viewport, then holds it
 * inert: a gallery card is a button, so the preview inside it must not be
 * clickable, focusable or announced. Before that it is a skeleton of exactly
 * the same height, so nothing shifts when the demo arrives.
 */
export function LazyPreview({
  children,
  previewHeightClass,
}: {
  children: React.ReactNode
  previewHeightClass: string
}) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [visible, setVisible] = React.useState(false)

  React.useEffect(() => {
    // No IntersectionObserver (SSR, happy-dom, old browsers): stay a skeleton
    // rather than mount twelve demos at once.
    if (visible || typeof IntersectionObserver === "undefined") return
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [visible])

  return (
    <div ref={ref} className={cn("overflow-hidden rounded-lg", previewHeightClass)}>
      {visible ? (
        <div
          inert
          aria-hidden="true"
          className="pointer-events-none flex h-full w-full items-center justify-center"
        >
          {children}
        </div>
      ) : (
        <div className="bg-muted h-full w-full animate-pulse rounded-md motion-reduce:animate-none" />
      )}
    </div>
  )
}
