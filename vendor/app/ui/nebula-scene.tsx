import { brightStarBackground, STAR_BACKGROUND_SIZE } from './star-shape'

/**
 * Nebula's deep-space layers, drawn by ThemeBackdrop when the active theme claims
 * `scene: 'nebula'`.
 *
 * The aurora blobs give Nebula its gas; this gives it the sky behind it. Tuned to sit
 * behind the work — this is the background to a timesheet, and anything you catch
 * yourself looking at is too strong.
 *
 * Stars must never read through a panel: a point of light seen through a card looks
 * like a dead pixel, not like sky. That occlusion is not solved here but in
 * src/index.css, which frosts the app's translucent surfaces while this scene is
 * active — the right place for it, since the surface is what should be doing the
 * hiding.
 *
 * Geometry stays in code and colour comes from the theme, the same split ThemeBackdrop
 * already makes: the positions and sizes *are* the look, while `--ink` and `--blob-*`
 * decide what fills them.
 */

/** One depth of faint sky. Each renders as a single element with a tiled dot pattern. */
type StarLayer = {
    /** The tile the dots repeat on (`background-size`). */
    tile: string
    /** Radius of every dot in this layer, in px — constant regardless of viewport. */
    r: number
    /** Ink alpha for this depth, 0–100. Nearer stars are brighter. */
    alpha: number
    /** `[x%, y%]` within the tile, plus an optional colour var for the hued few. */
    dots: readonly (readonly [number, number, string?])[]
    animation: string
}

/**
 * The two faint depths, which carry density rather than character — a real sky has far
 * more dim stars than bright ones, and dim stars show no spikes.
 *
 * The tile sizes are deliberately close to coprime: 320/470 across and 280/510 down
 * never re-align inside one viewport, which is what stops the repeat from being
 * findable. The twinkle periods are coprime for the same reason.
 */
const STAR_LAYERS: readonly StarLayer[] = [
    // Far: the most numerous and the faintest. This layer does the work of making the
    // sky read as depth rather than as a handful of dots.
    {
        tile: '320px 280px',
        r: 0.7,
        alpha: 55,
        animation: 'star-twinkle-1 7s',
        dots: [
            [7, 19], [23, 61], [38, 8], [52, 44], [61, 88],
            [74, 27], [86, 70], [94, 12], [16, 92],
        ],
    },
    {
        tile: '470px 510px',
        r: 1,
        alpha: 78,
        animation: 'star-twinkle-2 11s',
        dots: [
            [12, 37], [29, 74], [44, 15], [57, 63], [71, 91], [83, 33], [96, 55],
        ],
    },
]

/** One `background-image` value: every dot in a layer, as its own radial gradient. */
function starGradients(layer: StarLayer): string {
    return layer.dots
        .map(([x, y, tint]) => {
            const colour = `color-mix(in oklab, ${tint ?? 'var(--ink)'} ${layer.alpha}%, transparent)`
            // The outer stop is offset rather than 0 for the same reason the paper grain
            // offsets its own: `transparent 0` clamps to a hard edge, which aliases badly
            // on a sub-pixel radius at fractional device pixel ratios.
            return `radial-gradient(circle at ${x}% ${y}%, ${colour} ${layer.r}px, transparent ${layer.r + 0.4}px)`
        })
        .join(', ')
}

/**
 * A star bright enough to earn diffraction spikes.
 *
 * `[x%, y%, sizePx, colour, keyframe, durationSec, delaySec]`. Every value is a
 * constant — never `Math.random()`, or the field would reshuffle on each render and the
 * flicker would restart. The delays are applied negative so each star begins mid-cycle:
 * without that, all eighteen blink in unison on first paint, which is the one thing this
 * is meant not to do.
 */
type BrightStar = readonly [number, number, number, string, string, number, number]

const INK = 'var(--ink)'
const INDIGO = 'var(--blob-1)'
const SKY = 'var(--blob-3)'

const BRIGHT_STARS: readonly BrightStar[] = [
    [4, 12, 16, INK, 'a', 13, 2],
    [11, 71, 12, INK, 'c', 19, 7],
    [17, 34, 18, SKY, 'b', 23, 1],
    [22, 91, 11, INK, 'a', 11, 5],
    [29, 8, 13, INK, 'c', 17, 12],
    [34, 55, 10, INDIGO, 'a', 21, 3],
    [41, 25, 15, INK, 'b', 15, 9],
    [47, 82, 12, INK, 'a', 19, 14],
    [55, 41, 11, SKY, 'c', 13, 6],
    [61, 16, 17, INK, 'b', 23, 18],
    [66, 68, 12, INK, 'a', 9, 4],
    [72, 37, 14, INK, 'c', 21, 11],
    [78, 88, 10, INDIGO, 'a', 17, 8],
    [83, 21, 16, INK, 'b', 15, 2],
    [88, 59, 12, INK, 'c', 11, 16],
    [93, 78, 13, SKY, 'a', 19, 10],
    [96, 31, 11, INK, 'b', 13, 13],
    [8, 47, 14, INK, 'a', 23, 20],
]

/**
 * The starfield: two tiled depths of faint dots, plus the bright few that carry spikes
 * and flicker on their own schedules.
 *
 * Stars never move — only opacity changes, which stays on the compositor.
 *
 * `data-stars` is what the reduced-motion and "Still" rules in src/index.css key off.
 * They use a descendant selector, so nesting here is free.
 */
export function NebulaStars() {
    return (
        <div data-stars className="absolute inset-0">
            {STAR_LAYERS.map((layer, i) => (
                <div
                    key={`layer-${i}`}
                    className="absolute inset-0"
                    style={{
                        backgroundImage: starGradients(layer),
                        backgroundSize: layer.tile,
                        animation: `${layer.animation} ease-in-out infinite`,
                    }}
                />
            ))}

            {BRIGHT_STARS.map(([x, y, size, colour, kind, duration, delay], i) => (
                <div
                    key={`star-${i}`}
                    className="absolute"
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        transform: 'translate(-50%, -50%)',
                        backgroundImage: brightStarBackground(colour),
                        backgroundSize: STAR_BACKGROUND_SIZE,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        animation: `star-flicker-${kind} ${duration}s ease-in-out infinite`,
                        animationDelay: `-${delay}s`,
                    }}
                />
            ))}
        </div>
    )
}
