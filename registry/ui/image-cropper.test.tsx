import { fireEvent, render, screen, waitFor, within } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { ImageCropper, computeCropRect, getCroppedImage } from "./image-cropper"

const PERCENT_AREA = { x: 1, y: 2, width: 3, height: 4 }
const PIXEL_AREA = { x: 12, y: 34, width: 100, height: 50 }

// react-easy-crop measures its container with getBoundingClientRect/ResizeObserver
// and never renders anything queryable in happy-dom. Swap it for a probe that
// mirrors the props we pass down and can fire onCropComplete on demand — what's
// under test is the wrapper's prop plumbing, not the third party's gesture math.
let cropperProps: Record<string, never> | undefined
vi.mock("react-easy-crop", () => ({
  default: (props: Record<string, never>) => {
    cropperProps = props
    const p = props as unknown as {
      image: string
      zoom: number
      rotation: number
      aspect: number
      cropShape: string
      onCropComplete?: (a: typeof PERCENT_AREA, b: typeof PIXEL_AREA) => void
    }
    return (
      <div
        data-testid="cropper"
        data-image={p.image}
        data-zoom={p.zoom}
        data-rotation={p.rotation}
        data-aspect={p.aspect}
        data-crop-shape={p.cropShape}
      >
        <button type="button" onClick={() => p.onCropComplete?.(PERCENT_AREA, PIXEL_AREA)}>
          emit crop
        </button>
      </div>
    )
  },
}))

// happy-dom ships no 2D rasterizer and no image decoder: getContext("2d") returns
// null, toBlob is missing, and an <img> src never resolves. Stub all three — what
// getCroppedImage owns is the geometry it hands to drawImage, not the pixels.
const ctx = {
  translate: vi.fn(),
  rotate: vi.fn(),
  drawImage: vi.fn(),
}
const toBlobCalls: { type?: string; quality?: number }[] = []

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  configurable: true,
  writable: true,
  value: vi.fn(() => ctx),
})
Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
  configurable: true,
  writable: true,
  value: vi.fn(
    (cb: (blob: Blob | null) => void, type?: string, quality?: number) => {
      toBlobCalls.push({ type, quality })
      cb(new Blob(["stub"], { type: type ?? "image/png" }))
    }
  ),
})

class StubImage extends EventTarget {
  naturalWidth = 200
  naturalHeight = 100
  crossOrigin: string | null = null
  #src = ""
  get src() {
    return this.#src
  }
  set src(value: string) {
    this.#src = value
    queueMicrotask(() =>
      this.dispatchEvent(new Event(value.includes("broken") ? "error" : "load"))
    )
  }
}
vi.stubGlobal("Image", StubImage)

beforeEach(() => {
  vi.clearAllMocks()
  toBlobCalls.length = 0
  cropperProps = undefined
})

// Each control is a labelled group wrapping the slider — that group is what
// carries the name to AT, since shadcn's Slider can't name the Radix thumb.
function groupOf(name: string) {
  return screen.getByRole("group", { name })
}

function thumbOf(name: string) {
  return within(groupOf(name)).getByRole("slider")
}

describe("computeCropRect", () => {
  it("clips an area that runs past the image bounds", () => {
    expect(computeCropRect(100, 80, { x: 50, y: 40, width: 500, height: 500 })).toEqual({
      x: 50,
      y: 40,
      width: 50,
      height: 40,
    })
  })

  it("pulls negative offsets back to 0", () => {
    expect(computeCropRect(100, 80, { x: -20, y: -10, width: 30, height: 30 })).toEqual({
      x: 0,
      y: 0,
      width: 30,
      height: 30,
    })
  })

  it("keeps a zero-size area at 1px so the canvas is never empty", () => {
    expect(computeCropRect(100, 80, { x: 10, y: 10, width: 0, height: 0 })).toEqual({
      x: 10,
      y: 10,
      width: 1,
      height: 1,
    })
  })

  it("survives non-finite input instead of producing a NaN rect", () => {
    expect(
      computeCropRect(100, 80, { x: NaN, y: Infinity, width: NaN, height: NaN })
    ).toEqual({ x: 0, y: 79, width: 1, height: 1 })
    expect(
      computeCropRect(100, 80, { x: -Infinity, y: NaN, width: Infinity, height: Infinity })
    ).toEqual({ x: 0, y: 0, width: 100, height: 80 })
  })

  it("leaves an in-bounds area untouched", () => {
    expect(computeCropRect(200, 100, PIXEL_AREA)).toEqual(PIXEL_AREA)
  })
})

describe("ImageCropper", () => {
  it("renders the cropper with the source image and a labelled zoom slider", () => {
    render(<ImageCropper src="/photo.png" />)
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-image", "/photo.png")
    expect(within(groupOf("Zoom")).getByLabelText("Zoom")).toHaveAttribute("data-slot", "slider")
    expect(thumbOf("Zoom")).toHaveAttribute("aria-valuenow", "1")
  })

  it("passes aspect and cropShape through", () => {
    render(<ImageCropper src="/photo.png" aspect={16 / 9} cropShape="round" />)
    const cropper = screen.getByTestId("cropper")
    expect(cropper).toHaveAttribute("data-crop-shape", "round")
    expect(cropper).toHaveAttribute("data-aspect", String(16 / 9))
  })

  it("defaults to a square rect crop", () => {
    render(<ImageCropper src="/photo.png" />)
    const cropper = screen.getByTestId("cropper")
    expect(cropper).toHaveAttribute("data-aspect", "1")
    expect(cropper).toHaveAttribute("data-crop-shape", "rect")
  })

  it("moving the zoom slider updates the cropper zoom", () => {
    render(<ImageCropper src="/photo.png" />)
    const thumb = thumbOf("Zoom")
    fireEvent.keyDown(thumb, { key: "ArrowRight" })
    expect(thumb).toHaveAttribute("aria-valuenow", "1.1")
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-zoom", "1.1")
  })

  it("renders no rotation slider by default", () => {
    render(<ImageCropper src="/photo.png" />)
    expect(screen.queryByRole("group", { name: "Rotate" })).toBeNull()
  })

  it("rotate renders a rotation slider that drives the cropper rotation", () => {
    render(<ImageCropper src="/photo.png" rotate />)
    const thumb = thumbOf("Rotate")
    expect(thumb).toHaveAttribute("aria-valuenow", "0")
    fireEvent.keyDown(thumb, { key: "ArrowRight" })
    expect(thumb).toHaveAttribute("aria-valuenow", "1")
    expect(screen.getByTestId("cropper")).toHaveAttribute("data-rotation", "1")
  })

  it("forwards croppedAreaPixels (not the percentage area) plus the rotation", () => {
    const onCropComplete = vi.fn()
    render(<ImageCropper src="/photo.png" onCropComplete={onCropComplete} />)
    fireEvent.click(screen.getByRole("button", { name: "emit crop" }))
    expect(onCropComplete).toHaveBeenCalledTimes(1)
    expect(onCropComplete).toHaveBeenCalledWith(PIXEL_AREA, 0)
  })

  // The pixel area is measured in the rotated frame, so a consumer that never
  // learns the rotation feeds getCroppedImage the wrong frame and crops garbage.
  it("reports the current rotation after the rotate slider moves", () => {
    const onCropComplete = vi.fn()
    render(<ImageCropper src="/photo.png" rotate onCropComplete={onCropComplete} />)
    fireEvent.keyDown(thumbOf("Rotate"), { key: "ArrowRight" })
    fireEvent.click(screen.getByRole("button", { name: "emit crop" }))
    expect(onCropComplete).toHaveBeenLastCalledWith(PIXEL_AREA, 1)
  })

  it("survives a crop callback with no consumer handler", () => {
    render(<ImageCropper src="/photo.png" />)
    expect(() => fireEvent.click(screen.getByRole("button", { name: "emit crop" }))).not.toThrow()
    expect(cropperProps).toBeDefined()
  })

  it("forwards the ref and className to the root", () => {
    const ref = { current: null as HTMLDivElement | null }
    const { container } = render(<ImageCropper ref={ref} src="/photo.png" className="mt-4" />)
    const root = container.querySelector('[data-slot="image-cropper"]')
    expect(ref.current).toBe(root)
    expect(root).toHaveClass("mt-4")
  })

  it("error: aria-invalid on the root and a role=alert message", () => {
    const { container, rerender } = render(
      <ImageCropper src="/photo.png" error="Crop the photo before saving" />
    )
    const root = container.querySelector('[data-slot="image-cropper"]')!
    expect(root).toHaveAttribute("role", "group")
    expect(root).toHaveAttribute("aria-invalid", "true")
    const alert = screen.getByRole("alert")
    expect(alert).toHaveTextContent("Crop the photo before saving")
    expect(root.getAttribute("aria-describedby")).toBe(alert.id)
    expect(alert.id).toBeTruthy()

    rerender(
      <ImageCropper src="/photo.png" error="Crop the photo before saving" showErrorMessage={false} />
    )
    const quiet = container.querySelector('[data-slot="image-cropper"]')!
    expect(quiet).toHaveAttribute("aria-invalid", "true")
    expect(quiet).not.toHaveAttribute("aria-describedby")
    expect(screen.queryByRole("alert")).toBeNull()
  })

  it("keeps a consumer aria-describedby alongside the error id", () => {
    const { container } = render(
      <ImageCropper src="/photo.png" error="Crop the photo" aria-describedby="hint" />
    )
    const root = container.querySelector('[data-slot="image-cropper"]')!
    const alert = screen.getByRole("alert")
    expect(root.getAttribute("aria-describedby")?.split(" ")).toEqual(
      expect.arrayContaining(["hint", alert.id])
    )
  })

  it("no error: root is not aria-invalid and no alert renders", () => {
    const { container } = render(<ImageCropper src="/photo.png" />)
    expect(container.querySelector('[data-slot="image-cropper"]')).not.toHaveAttribute(
      "aria-invalid",
      "true"
    )
    expect(screen.queryByRole("alert")).toBeNull()
  })
})

describe("getCroppedImage", () => {
  it("resolves a PNG blob and draws the clamped rect", async () => {
    // 200x100 image, area running off both edges -> 50x20 tile at (150, 80).
    const blob = await getCroppedImage("/photo.png", { x: 150, y: 80, width: 500, height: 500 })
    expect(blob).toBeInstanceOf(Blob)
    expect(blob.type).toBe("image/png")
    expect(ctx.drawImage).toHaveBeenCalledTimes(1)
    expect(ctx.drawImage).toHaveBeenCalledWith(
      expect.anything(),
      150,
      80,
      50,
      20,
      0,
      0,
      50,
      20
    )
  })

  it("honours type and quality options", async () => {
    const blob = await getCroppedImage("/photo.png", PIXEL_AREA, {
      type: "image/jpeg",
      quality: 0.8,
    })
    expect(blob.type).toBe("image/jpeg")
    expect(toBlobCalls).toEqual([{ type: "image/jpeg", quality: 0.8 }])
  })

  it("rotation draws through an intermediate canvas sized to the rotated bounds", async () => {
    await getCroppedImage("/photo.png", PIXEL_AREA, { rotation: 90 })
    // 200x100 rotated 90deg -> 100x200 bounding box, so the crop clamps to it.
    expect(ctx.rotate).toHaveBeenCalledWith(Math.PI / 2)
    expect(ctx.drawImage).toHaveBeenCalledTimes(2)
    expect(ctx.drawImage).toHaveBeenNthCalledWith(1, expect.anything(), -100, -50)
    expect(ctx.drawImage).toHaveBeenNthCalledWith(2, expect.anything(), 12, 34, 88, 50, 0, 0, 88, 50)
  })

  it("rejects when the image fails to load", async () => {
    await expect(getCroppedImage("/broken.png", PIXEL_AREA)).rejects.toThrow(/broken\.png/)
  })

  it("never rejects on a nonsense area", async () => {
    await waitFor(async () => {
      await expect(
        getCroppedImage("/photo.png", { x: -1e9, y: -1e9, width: 0, height: 0 })
      ).resolves.toBeInstanceOf(Blob)
    })
  })
})
