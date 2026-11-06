/**
 * The curated palette the Custom theme picks from.
 *
 * Two constraints drive every value here:
 *
 * 1. **Contrast can't be broken.** The user never picks a text colour — they pick a
 *    base (dark/light), which selects the whole ink scale, and a canvas that is
 *    pre-tuned to that base. Every dark canvas is L* <= 0.20 and every light one
 *    L* >= 0.94, so the base's ink scale always clears AA on it.
 *
 * 2. **Blob colours can't impersonate a status.** The app already spends colour on
 *    meaning: rose/red = absence + errors, emerald = vacation, amber/orange = a
 *    partial day, blue = the "compensation due" ring, violet = holiday, cyan =
 *    compensation recorded (see features/timesheets/utils/day-status.ts). None of
 *    those families appear below. A large blurred wash in one of them would read
 *    as a status signal spread across the whole window.
 *
 * The stock Aurora preset does use emerald/blue/cyan — it is grandfathered as the
 * look the app shipped with, not an example to follow.
 */

import type { ThemeBase } from './theme-config'

export type CanvasPair = {
    id: string
    base: ThemeBase
    /** The app shell. */
    canvas: string
    /** Panels, cards, modals — one step up from the canvas. */
    surface: string
    /**
     * Some canvases (Snow) are the same colour as their surface, which leaves cards
     * invisible against the shell. Those lift the border alpha to compensate.
     */
    borderAlpha?: number
}

export const CANVAS_PAIRS: CanvasPair[] = [
    // Dark — all L* <= 0.20
    { id: 'obsidian', base: 'dark', canvas: '#030712', surface: '#0d1117' },
    { id: 'graphite', base: 'dark', canvas: '#0e1116', surface: '#171b22' },
    { id: 'inkBlue', base: 'dark', canvas: '#070e1a', surface: '#0f1826' },
    { id: 'plum', base: 'dark', canvas: '#0a0713', surface: '#150f22' },
    { id: 'forest', base: 'dark', canvas: '#04110e', surface: '#0b1a16' },
    { id: 'trueBlack', base: 'dark', canvas: '#000000', surface: '#0a0a0a' },

    // Light — all L* >= 0.94
    { id: 'snow', base: 'light', canvas: '#ffffff', surface: '#ffffff', borderAlpha: 0.14 },
    { id: 'mist', base: 'light', canvas: '#f6f7f9', surface: '#ffffff' },
    { id: 'paper', base: 'light', canvas: '#f0e2b8', surface: '#f9efd2' },
    { id: 'skyWash', base: 'light', canvas: '#f2f6fb', surface: '#ffffff' },
    { id: 'sage', base: 'light', canvas: '#f2f6f3', surface: '#ffffff' },
    { id: 'warmGrey', base: 'light', canvas: '#f5f4f2', surface: '#ffffff' },
]

export const DEFAULT_CANVAS: Record<ThemeBase, string> = {
    dark: 'obsidian',
    light: 'mist',
}

export function canvasesForBase(base: ThemeBase): CanvasPair[] {
    return CANVAS_PAIRS.filter(c => c.base === base)
}

export function findCanvas(id: string, base: ThemeBase): CanvasPair {
    const match = CANVAS_PAIRS.find(c => c.id === id && c.base === base)
    if (match) return match
    // An id from the other base (the user flipped Dark/Light) or an unknown one:
    // fall back to that base's default rather than rendering an unreadable shell.
    return CANVAS_PAIRS.find(c => c.id === DEFAULT_CANVAS[base])!
}

export type BlobSwatch = { id: string; hex: string }

/** Twelve swatches, no reserved family. See the note at the top of this file. */
export const BLOB_SWATCHES: BlobSwatch[] = [
    { id: 'teal', hex: '#14b8a6' },
    { id: 'jade', hex: '#2dd4bf' },
    { id: 'sky', hex: '#38bdf8' },
    { id: 'steel', hex: '#7dd3fc' },
    { id: 'indigo', hex: '#6366f1' },
    { id: 'periwinkle', hex: '#818cf8' },
    { id: 'fuchsia', hex: '#d946ef' },
    { id: 'orchid', hex: '#e879f9' },
    { id: 'pink', hex: '#ec4899' },
    { id: 'lime', hex: '#84cc16' },
    { id: 'moss', hex: '#a3e635' },
    { id: 'slate', hex: '#64748b' },
]

export function findBlobHex(id: string): string | null {
    return BLOB_SWATCHES.find(s => s.id === id)?.hex ?? null
}
