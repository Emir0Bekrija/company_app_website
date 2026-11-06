/**
 * Bakes styles/glass-film.webp, the soap-film texture behind the site's glass.
 *
 * A thin film shows colour by thickness, so the colours follow contour lines of an uneven surface.
 * That's what this draws: a warped height field whose contours index a cyclic palette. The palette
 * is limited to lavender, violet, icy blue, cyan and a little pink, which is why it isn't physical
 * thin-film colour: that would also pass through yellow and green.
 *
 * Every wave has a whole number of cycles across the tile, so the texture repeats without a seam
 * and can slide forever. It's a bitmap because an inline SVG filter is recalculated on each repaint.
 *
 * Run with: npm run make:film
 */
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const SIZE = 256
const OUT = fileURLToPath(new URL('../styles/glass-film.webp', import.meta.url))

/** Seeded, so a rerun gives the same file. */
function mulberry32(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function waves(random, count, maxCycles) {
  return Array.from({ length: count }, () => {
    let fx = 0
    let fy = 0
    while (fx === 0 && fy === 0) {
      fx = Math.round((random() * 2 - 1) * maxCycles)
      fy = Math.round((random() * 2 - 1) * maxCycles)
    }
    return { fx, fy, phase: random() * Math.PI * 2, amp: 1 / Math.hypot(fx, fy) }
  })
}

function field(list, u, v) {
  let sum = 0
  for (const w of list) sum += w.amp * Math.sin(Math.PI * 2 * (w.fx * u + w.fy * v) + w.phase)
  return sum
}

const random = mulberry32(20261105)
const height = waves(random, 7, 2)
const warpU = waves(random, 5, 2)
const warpV = waves(random, 5, 2)

/** Cyclic: the last stop runs back into the first. */
const PALETTE = [
  [201, 189, 253], // lavender
  [176, 158, 250], // violet
  [178, 214, 253], // icy blue
  [150, 236, 245], // cyan
  [190, 226, 252], // icy blue
  [244, 196, 230], // pink, kept short
  [214, 192, 250], // back towards lavender
]

const toLinear = (c) => Math.pow(c / 255, 2.2)
const toGamma = (c) => Math.pow(c, 1 / 2.2) * 255

function palette(t) {
  const at = (((t % 1) + 1) % 1) * PALETTE.length
  const i = Math.floor(at)
  const f = at - i
  const smooth = f * f * (3 - 2 * f)
  const a = PALETTE[i]
  const b = PALETTE[(i + 1) % PALETTE.length]
  return a.map((c, n) => toGamma(toLinear(c) * (1 - smooth) + toLinear(b[n]) * smooth))
}

const pixels = Buffer.alloc(SIZE * SIZE * 4)
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const u = x / SIZE
    const v = y / SIZE
    const wu = u + 0.11 * field(warpU, u, v)
    const wv = v + 0.11 * field(warpV, u, v)
    const thickness = field(height, wu, wv)

    const [r, g, b] = palette(thickness * 0.3)
    // Ribbons of colour with clear glass between them, rather than an even wash.
    const ribbon = 0.5 + 0.5 * Math.sin(thickness * Math.PI * 2 * 0.36)
    const alpha = 0.12 + 0.38 * ribbon * ribbon

    const at = (y * SIZE + x) * 4
    pixels[at] = r
    pixels[at + 1] = g
    pixels[at + 2] = b
    pixels[at + 3] = alpha * 255
  }
}

const info = await sharp(pixels, { raw: { width: SIZE, height: SIZE, channels: 4 } })
  .webp({ quality: 70, alphaQuality: 100, smartSubsample: true, effort: 6 })
  .toFile(OUT)

console.log(`${OUT}: ${(info.size / 1024).toFixed(1)} KB`)
