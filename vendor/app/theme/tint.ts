import type { AccentHue } from './theme-presets'

/**
 * Translucent status chips that survive both bases.
 *
 * A tint calibrated against a near-black canvas disappears over a near-white one:
 * `bg-amber-500/15` is a clear glow on Aurora and an almost invisible wash on Daylight.
 * Every entry therefore leads with the *light* value and overrides back to the original
 * with `dark:`, so the dark themes look exactly as they did.
 *
 * The text half is `text-<hue>-fg`, which already flips shade per theme (see
 * `applyTheme`) — only the fill needed this treatment.
 *
 * **Spelled out literally, never interpolated.** Tailwind's JIT scans source for complete
 * class strings, so a computed `bg-${hue}-500/25` would simply never be generated. That is
 * why this is a table rather than a function.
 */

/** Standard chip: a readable fill plus its matching foreground. */
export const TINT: Record<AccentHue, string> = {
    red: 'bg-red-500/25 dark:bg-red-500/15 text-red-fg',
    rose: 'bg-rose-500/25 dark:bg-rose-500/15 text-rose-fg',
    emerald: 'bg-emerald-500/25 dark:bg-emerald-500/15 text-emerald-fg',
    green: 'bg-green-500/25 dark:bg-green-500/15 text-green-fg',
    amber: 'bg-amber-500/28 dark:bg-amber-500/15 text-amber-fg',
    yellow: 'bg-yellow-500/28 dark:bg-yellow-500/15 text-yellow-fg',
    orange: 'bg-orange-500/25 dark:bg-orange-500/15 text-orange-fg',
    blue: 'bg-blue-500/25 dark:bg-blue-500/15 text-blue-fg',
    sky: 'bg-sky-500/25 dark:bg-sky-500/15 text-sky-fg',
    cyan: 'bg-cyan-500/25 dark:bg-cyan-500/15 text-cyan-fg',
    teal: 'bg-teal-500/25 dark:bg-teal-500/15 text-teal-fg',
    violet: 'bg-violet-500/25 dark:bg-violet-500/15 text-violet-fg',
    indigo: 'bg-indigo-500/25 dark:bg-indigo-500/15 text-indigo-fg',
    purple: 'bg-purple-500/25 dark:bg-purple-500/15 text-purple-fg',
    pink: 'bg-pink-500/25 dark:bg-pink-500/15 text-pink-fg',
    // Slate is the neutral "cancelled" chip; it needs more fill than a hue to register.
    slate: 'bg-slate-500/25 dark:bg-slate-500/20 text-slate-fg',
}

/** Adds a visible edge — for chips that sit directly on the canvas rather than a card. */
export const TINT_BORDER: Record<AccentHue, string> = {
    red: 'border border-red-500/40 dark:border-red-500/20',
    rose: 'border border-rose-500/40 dark:border-rose-500/20',
    emerald: 'border border-emerald-500/40 dark:border-emerald-500/20',
    green: 'border border-green-500/40 dark:border-green-500/20',
    amber: 'border border-amber-500/45 dark:border-amber-500/20',
    yellow: 'border border-yellow-500/45 dark:border-yellow-500/20',
    orange: 'border border-orange-500/40 dark:border-orange-500/20',
    blue: 'border border-blue-500/40 dark:border-blue-500/20',
    sky: 'border border-sky-500/40 dark:border-sky-500/20',
    cyan: 'border border-cyan-500/45 dark:border-cyan-500/20',
    teal: 'border border-teal-500/40 dark:border-teal-500/20',
    violet: 'border border-violet-500/40 dark:border-violet-500/20',
    indigo: 'border border-indigo-500/40 dark:border-indigo-500/20',
    purple: 'border border-purple-500/40 dark:border-purple-500/20',
    pink: 'border border-pink-500/40 dark:border-pink-500/20',
    slate: 'border border-slate-500/40 dark:border-slate-500/20',
}

/** Convenience for the common "fill + edge" chip. */
export function tint(hue: AccentHue, withBorder = false): string {
    return withBorder ? `${TINT[hue]} ${TINT_BORDER[hue]}` : TINT[hue]
}
