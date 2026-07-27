import * as React from "react"
import { act, fireEvent, render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { SignaturePad, type SignaturePadHandle } from "./signature-pad"

// happy-dom ships no 2D rasterizer: getContext("2d") returns null and toDataURL
// has nothing to encode. Stub both — what's under test is the stroke STATE
// machine (strokes list, undo, isEmpty, hidden input sync), not pixels.
const fillRectColors: string[] = []
const ctx = {
  canvas: null,
  lineWidth: 0,
  lineCap: "",
  lineJoin: "",
  strokeStyle: "",
  fillStyle: "",
  setTransform: vi.fn(),
  clearRect: vi.fn(),
  // Records the fillStyle in force at paint time so backgroundColor is observable.
  fillRect: vi.fn(() => {
    fillRectColors.push(ctx.fillStyle)
  }),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  quadraticCurveTo: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  stroke: vi.fn(),
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  writable: true,
  value: vi.fn(() => ctx),
})
Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
  configurable: true,
  writable: true,
  value: vi.fn((type?: string) => `data:${type ?? "image/png"};base64,STUB`),
})

beforeEach(() => {
  vi.clearAllMocks()
  fillRectColors.length = 0
})

function setup(props: React.ComponentProps<typeof SignaturePad> = {}) {
  const ref = React.createRef<SignaturePadHandle>()
  const utils = render(<SignaturePad ref={ref} {...props} />)
  const canvas = screen.getByRole("img")
  return { ...utils, ref, canvas }
}

function drawStroke(canvas: HTMLElement, from = [10, 10], to = [40, 40]) {
  fireEvent.pointerDown(canvas, { pointerId: 1, buttons: 1, clientX: from[0], clientY: from[1] })
  fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1, clientX: 25, clientY: 25 })
  fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1, clientX: to[0], clientY: to[1] })
  fireEvent.pointerUp(canvas, { pointerId: 1, clientX: to[0], clientY: to[1] })
}

describe("SignaturePad", () => {
  it("renders canvas with role=img and default aria-label", () => {
    const { canvas } = setup()
    expect(canvas.tagName).toBe("CANVAS")
    expect(canvas).toHaveAttribute("aria-label", "Signature pad")
  })

  it("accepts a custom aria-label", () => {
    setup({ "aria-label": "Sign here" })
    expect(screen.getByRole("img", { name: "Sign here" })).toBeInTheDocument()
  })

  it("pointer down/move/up fires onEnd with a data URL", () => {
    const onEnd = vi.fn()
    const { canvas } = setup({ onEnd })
    drawStroke(canvas)
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(onEnd.mock.calls[0][0]).toMatch(/^data:image\//)
  })

  it("isEmpty is true initially, false after a stroke, true again after clear()", () => {
    const { ref, canvas } = setup()
    expect(ref.current!.isEmpty()).toBe(true)
    drawStroke(canvas)
    expect(ref.current!.isEmpty()).toBe(false)
    act(() => ref.current!.clear())
    expect(ref.current!.isEmpty()).toBe(true)
  })

  it("undo() removes the last stroke only", () => {
    const { ref, canvas } = setup()
    drawStroke(canvas, [10, 10], [20, 20])
    drawStroke(canvas, [30, 30], [40, 40])
    act(() => ref.current!.undo())
    expect(ref.current!.isEmpty()).toBe(false)
    act(() => ref.current!.undo())
    expect(ref.current!.isEmpty()).toBe(true)
    // undo past the start is a no-op, never throws
    expect(() => act(() => ref.current!.undo())).not.toThrow()
    expect(ref.current!.isEmpty()).toBe(true)
  })

  it("toDataURL() passes the requested mime type through", () => {
    const { ref } = setup()
    expect(ref.current!.toDataURL("image/jpeg")).toBe("data:image/jpeg;base64,STUB")
  })

  it("disabled: pointer events draw nothing, onEnd never fires, aria-disabled is set", () => {
    const onEnd = vi.fn()
    const { ref, canvas, container } = setup({ onEnd, disabled: true })
    // aria-disabled lives on the wrapper region — role="img" does not support it.
    expect(container.querySelector('[data-slot="signature-pad"]')).toHaveAttribute(
      "aria-disabled",
      "true"
    )
    drawStroke(canvas)
    expect(onEnd).not.toHaveBeenCalled()
    expect(ref.current!.isEmpty()).toBe(true)
  })

  it("name renders a hidden input that fills after a stroke and empties after clear", () => {
    const { ref, canvas, container } = setup({ name: "signature" })
    const hidden = container.querySelector('input[type="hidden"]') as HTMLInputElement
    expect(hidden).toHaveAttribute("name", "signature")
    expect(hidden.value).toBe("")
    drawStroke(canvas)
    expect(hidden.value).toMatch(/^data:image\//)
    act(() => ref.current!.clear())
    expect(hidden.value).toBe("")
  })

  it("renders no hidden input without a name", () => {
    const { container } = setup()
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })

  it("ignores pointers other than the one that started the stroke", () => {
    const onEnd = vi.fn()
    const { ref, canvas } = setup({ onEnd })
    fireEvent.pointerDown(canvas, { pointerId: 1, buttons: 1, clientX: 10, clientY: 10 })

    // Foreign pointer: no redraw at all, so it cannot have added a point.
    vi.clearAllMocks()
    fireEvent.pointerMove(canvas, { pointerId: 2, buttons: 1, clientX: 300, clientY: 300 })
    expect(ctx.stroke).not.toHaveBeenCalled()
    fireEvent.pointerUp(canvas, { pointerId: 2, clientX: 300, clientY: 300 })
    expect(onEnd).not.toHaveBeenCalled()
    expect(ref.current!.isEmpty()).toBe(true)

    // The owning pointer still draws and still ends the stroke, exactly once.
    fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 1, clientX: 20, clientY: 20 })
    expect(ctx.stroke).toHaveBeenCalled()
    fireEvent.pointerUp(canvas, { pointerId: 1, clientX: 20, clientY: 20 })
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(ref.current!.isEmpty()).toBe(false)
  })

  it("right-click does not draw", () => {
    const onEnd = vi.fn()
    const { ref, canvas } = setup({ onEnd })
    const mouse = { pointerId: 1, pointerType: "mouse" }
    fireEvent.pointerDown(canvas, { ...mouse, button: 2, buttons: 2, clientX: 10, clientY: 10 })
    fireEvent.pointerMove(canvas, { ...mouse, buttons: 2, clientX: 40, clientY: 40 })
    fireEvent.pointerUp(canvas, { ...mouse, clientX: 40, clientY: 40 })
    expect(onEnd).not.toHaveBeenCalled()
    expect(ref.current!.isEmpty()).toBe(true)
  })

  it("disabling mid-stroke abandons the stroke and leaves the pad usable after re-enabling", () => {
    const onEnd = vi.fn()
    const ref = React.createRef<SignaturePadHandle>()
    const { rerender } = render(<SignaturePad ref={ref} onEnd={onEnd} />)
    const canvas = screen.getByRole("img")
    fireEvent.pointerDown(canvas, { pointerId: 1, buttons: 1, clientX: 10, clientY: 10 })

    rerender(<SignaturePad ref={ref} onEnd={onEnd} disabled />)
    expect(onEnd).not.toHaveBeenCalled()
    expect(ref.current!.isEmpty()).toBe(true)

    rerender(<SignaturePad ref={ref} onEnd={onEnd} />)
    // Hover (no button down, no pointerdown) must not draw — the abandoned
    // stroke would otherwise still be collecting points.
    vi.clearAllMocks()
    fireEvent.pointerMove(canvas, { pointerId: 1, buttons: 0, clientX: 50, clientY: 50 })
    expect(ctx.stroke).not.toHaveBeenCalled()

    drawStroke(canvas)
    expect(onEnd).toHaveBeenCalledTimes(1)
    expect(ref.current!.isEmpty()).toBe(false)
  })

  it("penColor and backgroundColor reach the canvas context", () => {
    const { canvas } = setup({ penColor: "#ff0000", backgroundColor: "#00ff00" })
    drawStroke(canvas)
    expect(fillRectColors).toContain("#00ff00")
    expect(ctx.strokeStyle).toBe("#ff0000")
  })

  it("error: aria-invalid on the wrapper region and a role=alert message", () => {
    const { container, rerender } = setup({ error: "Signature is required" })
    const wrapper = container.querySelector('[data-slot="signature-pad"]')!
    expect(wrapper).toHaveAttribute("role", "group")
    expect(wrapper).toHaveAttribute("aria-invalid", "true")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Signature is required")
    // The region is described by the message, so AT announces the reason.
    expect(wrapper.getAttribute("aria-describedby")).toBe(alert.id)
    expect(alert.id).toBeTruthy()

    rerender(<SignaturePad error="Signature is required" showErrorMessage={false} />)
    const quiet = container.querySelector('[data-slot="signature-pad"]')!
    expect(quiet).toHaveAttribute("aria-invalid", "true")
    // No message rendered, so nothing to point aria-describedby at.
    expect(quiet).not.toHaveAttribute("aria-describedby")
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("no error: wrapper is not aria-invalid and no alert renders", () => {
    const { container } = setup()
    expect(container.querySelector('[data-slot="signature-pad"]')).not.toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.queryByRole("alert")).toBeNull()
  })
})
