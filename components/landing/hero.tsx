import Link from "next/link"
import { Button } from "@/components/ui/button"
import { InstallCommand } from "@/components/install-command"
import { registryIndex } from "@/lib/registry-index"
import { GITHUB_URL } from "@/lib/site"

/** Stagger step, ms. Five blocks land over ~0.4s — a sequence, not a queue. */
const STEP = 80

export function Hero() {
  return (
    // The 56px navbar sits above this now, so the top padding drops by that much.
    <section className="relative isolate overflow-hidden px-6 pt-16 pb-20 sm:pt-24 sm:pb-28">
      <Backdrop />
      <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
        <p
          className="reveal text-muted-foreground border-border bg-card/50 rounded-full border px-3 py-1 text-xs font-medium"
          style={{ animationDelay: "0ms" }}
        >
          {registryIndex.length} components · MIT · you own the code
        </p>
        {/* One text node on purpose: split across spans, the accessible name picks
            up the seams. */}
        <h1
          className="reveal mt-7 text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl"
          style={{ animationDelay: `${STEP}ms` }}
        >
          The components shadcn/ui doesn&apos;t ship.
        </h1>
        <p
          className="text-muted-foreground reveal mt-6 max-w-2xl text-lg text-balance"
          style={{ animationDelay: `${STEP * 2}ms` }}
        >
          Time pickers, phone inputs, kanban boards, croppers. Installed by the shadcn CLI,
          dropped into your repo as source you can read and change.
        </p>
        <div className="reveal mt-9 w-full max-w-xl" style={{ animationDelay: `${STEP * 3}ms` }}>
          <InstallCommand name="time-picker" />
        </div>
        <div
          className="reveal mt-6 flex flex-wrap items-center justify-center gap-3"
          style={{ animationDelay: `${STEP * 4}ms` }}
        >
          <Button asChild size="lg">
            <Link href="/components">Browse components</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href={GITHUB_URL} target="_blank" rel="noreferrer">
              GitHub
            </a>
          </Button>
        </div>
      </div>
    </section>
  )
}

/**
 * Decorative only, so `aria-hidden`. Two drifting glows over a grid that the mask
 * fades out before it reaches the copy — the animation runs on `transform` alone,
 * which the compositor handles without touching layout.
 */
function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_0%,#000_50%,transparent_100%)]" />
      <div className="drift absolute -top-56 left-1/2 h-[38rem] w-[38rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--foreground)_16%,transparent),transparent_70%)] blur-2xl" />
      <div className="drift absolute -top-32 -right-32 h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,color-mix(in_oklch,var(--foreground)_9%,transparent),transparent_70%)] blur-2xl [animation-delay:-11s] [animation-duration:28s]" />
    </div>
  )
}
