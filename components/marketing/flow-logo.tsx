import { useId } from 'react'
import Image from 'next/image'
import { brand } from '@/lib/brand'
import { cn } from '@/lib/utils'

/** The original artwork's pixel size. All layout numbers below use these same units. */
export const LOGO = { width: 5375, height: 726 }

/**
 * A lossless third-size copy of public/brand/navitecs-logo.png, for page use. The full file
 * takes about 15 MB of memory to decode, and the logo never shows anywhere near that large.
 */
export const LOGO_SRC = '/brand/navitecs-logo-1792.png'

/** FLOW is drawn on a 252-tall grid: letter tops at y=0, baseline at y=252. */
const WORD = { width: 982, capHeight: 252, overshoot: 4 }

const FLOW_PATH = [
  // F, with its middle arm split from the stem like the breaks in NAVITECS
  'M0 0H200L144 56H56V252L0 196Z',
  'M74 110H172L118 164H74Z',
  // L
  'M214 0L270 56V196H390L334 252H214Z',
  // O, an open ring split along the rising diagonal
  'M611.34 27.94A130 130 0 0 0 427.94 211.34L467.7 171.58A74 74 0 0 1 571.58 67.7Z',
  'M440.66 224.06A130 130 0 0 0 624.06 40.66L584.3 80.42A74 74 0 0 1 480.42 184.3Z',
  // W, as two sharp Vs with a break where they meet
  'M642 0H700L737 98L774 0H832L737 252Z',
  'M821 77L850 0L887 98L924 0H982L887 252Z',
].join('')

export type FlowLayout = {
  /** Letter height, in logo pixels. */
  height: number
  /** Where the word's baseline starts, in logo pixels from the logo's top left corner. */
  x: number
  y: number
  /** Degrees the baseline climbs towards the right. */
  rise: number
  /** Degrees of italic lean. */
  slant: number
}

export const defaultFlowLayout: FlowLayout = { height: 320, x: 4980, y: 1200, rise: 12, slant: 19 }

function wordTransform({ height, x, y, rise, slant }: FlowLayout) {
  return `translate(${x} ${y}) rotate(${-rise}) skewX(${-slant}) scale(${height / WORD.capHeight}) translate(0 ${-WORD.capHeight})`
}

/** The box holding both the logo and the word, so an overhang is never clipped. */
export function flowCanvas(layout: FlowLayout = defaultFlowLayout) {
  const scale = layout.height / WORD.capHeight
  const rise = (layout.rise * Math.PI) / 180
  const lean = Math.tan((layout.slant * Math.PI) / 180)
  const top = -(WORD.capHeight + WORD.overshoot) * scale
  const bottom = WORD.overshoot * scale
  const corners = [[0, top], [WORD.width * scale, top], [0, bottom], [WORD.width * scale, bottom]].map(([cx, cy]) => {
    const sx = cx - cy * lean
    return [
      layout.x + sx * Math.cos(rise) + cy * Math.sin(rise),
      layout.y - sx * Math.sin(rise) + cy * Math.cos(rise),
    ]
  })
  const xs = corners.map(([cx]) => cx)
  const ys = corners.map(([, cy]) => cy)
  const minX = Math.floor(Math.min(0, ...xs))
  const minY = Math.floor(Math.min(0, ...ys))
  const maxX = Math.ceil(Math.max(LOGO.width, ...xs))
  const maxY = Math.ceil(Math.max(LOGO.height, ...ys))
  return { minX, minY, width: maxX - minX, height: maxY - minY }
}

/**
 * The word's SVG content. A plain function, not a component, because the share image renders
 * it outside React. One path and one gradient in the word's own coordinates keep the colour
 * continuous across all four letters.
 */
export function flowShapes(gradientId: string, layout: FlowLayout = defaultFlowLayout) {
  return [
    <defs key="defs">
      <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2={WORD.width} y2="0">
        <stop offset="0" stopColor="#20D99A" />
        <stop offset="1" stopColor="#248BFF" />
      </linearGradient>
    </defs>,
    <path key="word" d={FLOW_PATH} fill={`url(#${gradientId})`} transform={wordTransform(layout)} />,
  ]
}

/**
 * Drawn as paths, so it needs no font. The gradient id is unique per instance: a shared id
 * would blank every copy once the first is hidden with display:none.
 */
export function FlowWordmark({ layout = defaultFlowLayout, className }: { layout?: FlowLayout; className?: string }) {
  const gradientId = `flow-gradient-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const canvas = flowCanvas(layout)
  return (
    <svg
      viewBox={`${canvas.minX} ${canvas.minY} ${canvas.width} ${canvas.height}`}
      className={className}
      aria-hidden="true"
    >
      {flowShapes(gradientId, layout)}
    </svg>
  )
}

type FlowLogoProps = {
  background?: 'transparent' | 'dark'
  /** `current` draws NAVITECS in the text colour, for surfaces that can be light. */
  ink?: 'white' | 'current'
  /** Shifts the logo so a centred box centres NAVITECS, leaving FLOW to hang below the line. */
  centerNavitecs?: boolean
  layout?: FlowLayout
  /** Set the size here with a width class. Height follows. */
  className?: string
}

/**
 * The Navitecs Flow lockup: the NAVITECS artwork with the FLOW wordmark. Everything is placed
 * in percentages of one shared box, so it scales as a single piece. `unoptimized` serves the
 * lossless file rather than a re-encoded copy.
 */
export function FlowLogo({ background = 'transparent', ink = 'white', centerNavitecs = false, layout = defaultFlowLayout, className }: FlowLogoProps) {
  const canvas = flowCanvas(layout)
  const percent = (value: number, total: number) => `${(value / total) * 100}%`
  const placement = {
    left: percent(-canvas.minX, canvas.width),
    top: percent(-canvas.minY, canvas.height),
    width: percent(LOGO.width, canvas.width),
  }
  const mask = `url(${LOGO_SRC}) center / 100% 100% no-repeat`
  const centerOffset = canvas.height / 2 + canvas.minY - LOGO.height / 2
  return (
    <div
      role="img"
      aria-label={brand.name}
      className={cn('block', background === 'dark' && 'bg-[#080B10] p-[6%]', className)}
      style={centerNavitecs ? { translate: `0 ${percent(centerOffset, canvas.height)}` } : undefined}
    >
      <div className="relative w-full" style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
        {ink === 'white' ? (
          <Image
            src={LOGO_SRC}
            alt=""
            width={LOGO.width}
            height={LOGO.height}
            unoptimized
            loading="eager"
            className="absolute h-auto max-w-none"
            style={placement}
          />
        ) : (
          <span
            className="absolute bg-current"
            style={{ ...placement, aspectRatio: `${LOGO.width} / ${LOGO.height}`, mask, WebkitMask: mask }}
          />
        )}
        <FlowWordmark layout={layout} className="absolute inset-0 size-full" />
      </div>
    </div>
  )
}
