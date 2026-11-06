import type { ThemeTokens } from '@/vendor/app/theme/theme-presets'
import { brightStarBackground, STAR_BACKGROUND_SIZE } from '@/vendor/app/ui/star-shape'

type Props = {
    tokens: ThemeTokens
    /** Up to 8 blob colours, or null for a flat theme. */
    blobs: string[] | null
    className?: string
}

/**
 * The scene layer, shrunk to card size: a pinch of stars so Nebula's card is not just
 * Aurora's in purple. Its own tiny geometry rather than a scaled copy of the real
 * starfield — at 64px tall, that field's 320px tile would land two dots — and no
 * twinkle, because seven cards breathing at once is exactly the distraction the theme
 * itself is tuned to avoid.
 */
const PREVIEW_STARS: readonly (readonly [number, number])[] = [
    [14, 27], [33, 68], [49, 13], [68, 52], [82, 81], [93, 34],
]

/** The two that get spikes, `[x%, y%, sizePx]` — placed in the strip above the panel,
 *  which is the only part of the card the panel does not cover. */
const PREVIEW_BRIGHT: readonly (readonly [number, number, number])[] = [
    [24, 12, 9], [72, 9, 7],
]

function previewStarGradients(ink: string): string {
    return PREVIEW_STARS
        .map(([x, y]) =>
            `radial-gradient(circle at ${x}% ${y}%, color-mix(in oklab, ${ink} 60%, transparent) 0.7px, transparent 1.1px)`)
        .join(', ')
}

/**
 * A miniature of what a theme actually looks like: the canvas, a surface panel, the
 * three strongest ink levels, and — for animated themes — a couple of blurred blobs
 * in the theme's own colours.
 *
 * Built from the same token record `applyTheme` consumes, so the preview cannot
 * drift from the theme it advertises. Everything is an inline style rather than a
 * class, because these colours belong to the *previewed* theme, not the active one.
 */
export function ThemePreview({ tokens, blobs, className }: Props) {
    return (
        <div
            className={`relative h-16 w-full overflow-hidden rounded-lg ${className ?? ''}`}
            style={{ backgroundColor: tokens.canvas }}
        >
            {tokens.scene === 'nebula' && (
                <div
                    className="absolute inset-0"
                    style={{
                        backgroundImage: previewStarGradients(tokens.ink),
                        backgroundSize: '34px 28px',
                    }}
                />
            )}

            {tokens.scene === 'nebula' && PREVIEW_BRIGHT.map(([x, y, size], i) => (
                <div
                    key={i}
                    className="absolute"
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        width: `${size}px`,
                        height: `${size}px`,
                        transform: 'translate(-50%, -50%)',
                        backgroundImage: brightStarBackground(tokens.ink),
                        backgroundSize: STAR_BACKGROUND_SIZE,
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                    }}
                />
            ))}

            {blobs && (
                <>
                    <div
                        className="absolute -left-3 -top-4 h-12 w-12 rounded-full blur-lg"
                        style={{ backgroundColor: blobs[0], opacity: 0.55 }}
                    />
                    <div
                        className="absolute -right-2 top-2 h-10 w-10 rounded-full blur-lg"
                        style={{ backgroundColor: blobs[1] ?? blobs[0], opacity: 0.5 }}
                    />
                    <div
                        className="absolute -bottom-2 left-1/3 h-9 w-9 rounded-full blur-lg"
                        style={{ backgroundColor: blobs[3] ?? blobs[0], opacity: 0.4 }}
                    />
                </>
            )}

            {/* A panel with three text bars, mirroring the real shell's hierarchy. */}
            <div
                className="absolute inset-x-2 bottom-2 top-4 rounded-md p-1.5"
                style={{ backgroundColor: tokens.surface, border: `1px solid ${tokens.border}` }}
            >
                <div className="h-1.5 w-2/5 rounded-full" style={{ backgroundColor: tokens.ink1 }} />
                <div className="mt-1 h-1.5 w-3/5 rounded-full" style={{ backgroundColor: tokens.ink2 }} />
                <div className="mt-1 h-1.5 w-1/4 rounded-full" style={{ backgroundColor: tokens.ink3 }} />
            </div>
        </div>
    )
}
