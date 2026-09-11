/**
 * Renders the PWA icons from code so they can be regenerated and reviewed in a diff, instead of
 * living in the repository as opaque binaries. Run with: pnpm icons
 */
import { deflateSync } from 'node:zlib'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'

const BRAND = [31, 111, 74] as const
const MARK = [255, 255, 255] as const
const SAMPLES = 3

type Rgb = readonly [number, number, number]

/** Coverage of the pin mark at a point, in 0..1, supersampled to smooth the edges. */
function markCoverage(x: number, y: number, size: number, scale: number): number {
  const cx = size / 2
  const headY = size * (0.5 - 0.08 * scale)
  const headR = size * 0.17 * scale
  const holeR = size * 0.068 * scale
  const tipY = size * (0.5 + 0.28 * scale)

  let hits = 0
  for (let sy = 0; sy < SAMPLES; sy += 1) {
    for (let sx = 0; sx < SAMPLES; sx += 1) {
      const px = x + (sx + 0.5) / SAMPLES
      const py = y + (sy + 0.5) / SAMPLES
      const dx = px - cx
      const dy = py - headY

      const inHead = dx * dx + dy * dy <= headR * headR
      // Tail: a triangle narrowing from the head down to the tip.
      const t = (py - headY) / (tipY - headY)
      const halfWidth = headR * (1 - t) * 0.86
      const inTail = t >= 0 && t <= 1 && Math.abs(dx) <= halfWidth
      const inHole = dx * dx + dy * dy <= holeR * holeR

      if ((inHead || inTail) && !inHole) hits += 1
    }
  }

  return hits / (SAMPLES * SAMPLES)
}

function roundedBackground(x: number, y: number, size: number, radius: number): number {
  let hits = 0
  for (let sy = 0; sy < SAMPLES; sy += 1) {
    for (let sx = 0; sx < SAMPLES; sx += 1) {
      const px = x + (sx + 0.5) / SAMPLES
      const py = y + (sy + 0.5) / SAMPLES
      const qx = Math.max(radius - px, px - (size - radius), 0)
      const qy = Math.max(radius - py, py - (size - radius), 0)
      if (Math.hypot(qx, qy) <= radius) hits += 1
    }
  }
  return hits / (SAMPLES * SAMPLES)
}

function renderIcon(size: number, { maskable }: { maskable: boolean }): Buffer {
  // A maskable icon may be cropped to a circle by the launcher, so the mark shrinks into the
  // safe zone and the background fills the whole square.
  const radius = maskable ? 0 : size * 0.22
  const scale = maskable ? 0.62 : 1

  const pixels = Buffer.alloc(size * size * 4)

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const bg = maskable ? 1 : roundedBackground(x, y, size, radius)
      const mark = markCoverage(x, y, size, scale)
      const color = blend(BRAND, MARK, mark)
      const offset = (y * size + x) * 4

      pixels[offset] = color[0]
      pixels[offset + 1] = color[1]
      pixels[offset + 2] = color[2]
      pixels[offset + 3] = Math.round(bg * 255)
    }
  }

  return encodePng(pixels, size, size)
}

function blend(from: Rgb, to: Rgb, amount: number): Rgb {
  return [
    Math.round(from[0] + (to[0] - from[0]) * amount),
    Math.round(from[1] + (to[1] - from[1]) * amount),
    Math.round(from[2] + (to[2] - from[2]) * amount),
  ]
}

function encodePng(pixels: Buffer, width: number, height: number): Buffer {
  const stride = width * 4
  const raw = Buffer.alloc((stride + 1) * height)

  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0 // filter type: none
    pixels.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride)
  }

  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width, 0)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8 // bit depth
  ihdr[9] = 6 // colour type: RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ])
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length, 0)

  const body = Buffer.concat([Buffer.from(type, 'ascii'), data])
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body), 0)

  return Buffer.concat([length, body, crc])
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n
  for (let k = 0; k < 8; k += 1) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
  }
  return c >>> 0
})

function crc32(buffer: Buffer): number {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

const outputs = [
  { path: 'public/icons/icon-192.png', size: 192, maskable: false },
  { path: 'public/icons/icon-512.png', size: 512, maskable: false },
  { path: 'public/icons/icon-maskable-512.png', size: 512, maskable: true },
  { path: 'src/app/icon.png', size: 180, maskable: false },
]

for (const { path, size, maskable } of outputs) {
  const file = resolve(process.cwd(), path)
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file, renderIcon(size, { maskable }))
  console.log(`gerado ${path} (${size}x${size})`)
}
