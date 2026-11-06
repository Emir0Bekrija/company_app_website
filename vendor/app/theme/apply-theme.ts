/**
 * Turns a stored ThemeConfig into concrete tokens, and writes them onto <html>.
 *
 * Presets and the Custom theme deliberately share one mechanism. Custom needs
 * inline custom properties anyway, so driving presets through `.theme-*` classes
 * instead would mean maintaining two ways for a colour to reach the page.
 */

import {
    findBlobHex,
    findCanvas,
} from './theme-palette'
import {
    ACCENT_HUES,
    BASE_TOKENS,
    findPreset,
    type ThemeTokens,
} from './theme-presets'
import { ACCENT_SHADE_COLORS } from './accent-shades'
import type { BlobIntensity, BlobMotion, ThemeConfig } from './theme-config'

/** How many blobs ThemeBackdrop renders. Custom picks fewer and they cycle. */
export const BLOB_SLOTS = 8

const INTENSITY_ALPHA: Record<BlobIntensity, number> = {
    subtle: 0.6,
    normal: 1,
    vivid: 1.5,
}

export type ResolvedTheme = {
    tokens: ThemeTokens
    /** Exactly BLOB_SLOTS colours, or null for a flat theme (no blobs rendered at all). */
    blobs: string[] | null
    blobAlpha: number
    motion: BlobMotion
}

/** Fill the 8 render slots from however many colours the user picked. */
function expandBlobs(hexes: string[]): string[] | null {
    if (hexes.length === 0) return null
    return Array.from({ length: BLOB_SLOTS }, (_, i) => hexes[i % hexes.length])
}

export function resolveTheme(config: ThemeConfig): ResolvedTheme {
    if (config.preset !== 'custom') {
        const p = findPreset(config.preset)
        // Turning Nebula's starfield off is a scene-level choice, so it is resolved here
        // rather than in the backdrop: dropping `scene` also drops the `data-scene` hook
        // below, and with it the frosting that only ever existed to hide stars behind
        // panels. Spread rather than mutate — `p.tokens` is a shared preset constant.
        const tokens = config.stars === false && p.tokens.scene
            ? { ...p.tokens, scene: undefined }
            : p.tokens
        return { tokens, blobs: p.blobs, blobAlpha: 1, motion: p.motion }
    }

    const { base, canvas, blobs, intensity, motion } = config.custom
    const pair = findCanvas(canvas, base)

    const tokens: ThemeTokens = {
        ...BASE_TOKENS[base],
        canvas: pair.canvas,
        surface: pair.surface,
        // Snow's surface matches its canvas, so cards would vanish without this.
        ...(pair.borderAlpha
            ? { border: `rgb(11 18 32 / ${pair.borderAlpha})` }
            : {}),
    }

    const hexes = blobs
        .map(findBlobHex)
        .filter((h): h is string => h !== null)

    return {
        tokens,
        blobs: expandBlobs(hexes),
        blobAlpha: INTENSITY_ALPHA[intensity],
        motion,
    }
}

/**
 * The one place a theme becomes visible. Writes ~35 custom properties inline on
 * <html>, so switching themes is a variable write — no stylesheet regeneration and
 * no re-render of anything that isn't reading `useTheme()`.
 */
export function applyTheme(config: ThemeConfig): ResolvedTheme {
    const resolved = resolveTheme(config)
    const { tokens, blobs, blobAlpha, motion } = resolved
    const root = document.documentElement
    const s = root.style

    s.setProperty('--canvas', tokens.canvas)
    s.setProperty('--surface', tokens.surface)
    s.setProperty('--sunken', tokens.sunken)
    s.setProperty('--scrim', tokens.scrim)
    s.setProperty('--tooltip', tokens.tooltip)

    s.setProperty('--ink', tokens.ink)
    s.setProperty('--ink-1', tokens.ink1)
    s.setProperty('--ink-2', tokens.ink2)
    s.setProperty('--ink-3', tokens.ink3)
    s.setProperty('--ink-4', tokens.ink4)

    s.setProperty('--border', tokens.border)
    s.setProperty('--ring', tokens.ring)
    s.setProperty('--primary', tokens.primary)
    // Text on a saturated accent (gradient buttons, avatar circles) stays white in
    // every theme — the background under it doesn't change with the theme.
    s.setProperty('--on-accent', '#ffffff')

    // Point each hue's foreground at the right Tailwind shade for this base, so a
    // tinted pill (bg-emerald-500/15 + text-emerald-fg) stays readable either way.
    const shade = ACCENT_SHADE_COLORS[tokens.accentShade]
    for (const hue of ACCENT_HUES) {
        s.setProperty(`--${hue}-fg`, shade[hue])
    }

    if (blobs) {
        blobs.forEach((hex, i) => s.setProperty(`--blob-${i + 1}`, hex))
        s.setProperty('--blob-alpha', String(blobAlpha))
    }

    // Paper grain. Cleared rather than left stale, so switching away from Paper doesn't
    // leave a texture the next theme never asked for.
    if (tokens.texture) {
        s.setProperty('--texture', tokens.textureColor ?? 'rgb(0 0 0 / 0.035)')
        root.dataset.texture = tokens.texture
    } else {
        s.removeProperty('--texture')
        delete root.dataset.texture
    }

    // Nebula's scene needs a selector hook — see the frosting rule in src/index.css.
    // Cleared in the same way the texture above is, or switching away from Nebula would
    // leave the whole app frosted for a theme that never asked for it.
    if (tokens.scene) {
        root.dataset.scene = tokens.scene
    } else {
        delete root.dataset.scene
    }

    // `dark:` variants key off this class (see @custom-variant in index.css).
    root.classList.toggle('dark', tokens.base === 'dark')
    // Tells the browser how to paint form controls, scrollbars and the like.
    s.colorScheme = tokens.base
    root.dataset.motion = motion

    return resolved
}
