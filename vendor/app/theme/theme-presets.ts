/**
 * The theme catalogue.
 *
 * Every preset is data, not CSS. That matters twice over: `applyTheme` writes these
 * values straight onto <html> as custom properties, and the Appearance picker builds
 * each card's mini-preview from the very same record — so a preview can never drift
 * from the theme it advertises.
 */

import type { BlobMotion, PresetId, ThemeBase } from './theme-config'

/** Hue families that get a per-theme foreground token (`text-red-fg`, ...). */
export const ACCENT_HUES = [
    'red', 'rose', 'emerald', 'green', 'amber', 'yellow', 'orange', 'blue',
    'sky', 'cyan', 'teal', 'violet', 'indigo', 'purple', 'pink', 'slate',
] as const

export type AccentHue = (typeof ACCENT_HUES)[number]

export type ThemeTokens = {
    base: ThemeBase
    canvas: string
    surface: string
    /** Recessed panels — the old `bg-black/10`. A light theme needs a *light* recess. */
    sunken: string
    /** Modal backdrops. */
    scrim: string
    /** Tooltip bubbles; carries its own alpha. */
    tooltip: string
    /** Slash-alpha surfaces and borders: `bg-ink/5`, `border-ink/10`. */
    ink: string
    /** Opaque text scale, strongest to faintest. */
    ink1: string
    ink2: string
    ink3: string
    ink4: string
    border: string
    ring: string
    primary: string
    /**
     * Which Tailwind shade the `<hue>-fg` tokens point at. Tinted pills
     * (`bg-emerald-500/15` + `text-emerald-fg`) need a light text shade on dark and a
     * dark one on light, or they wash out.
     */
    accentShade: '200' | '300' | '700' | '800'
    /**
     * An optional printed-paper grain, drawn behind the shell by ThemeBackdrop. Purely
     * decorative and deliberately at the edge of perception — it should read as the
     * surface having a material, never as a pattern you can count.
     */
    texture?: TextureId
    /** Ink colour of the texture, at the very low alpha the dots are drawn with. */
    textureColor?: string
    /**
     * An optional deep-space layer, drawn behind the aurora blobs by ThemeBackdrop: a
     * faint starfield and a central dust cloud. Opt-in per preset exactly like
     * `texture`, but read straight off the resolved tokens rather than written to a
     * custom property — the scene is geometry, and geometry lives in code.
     */
    scene?: SceneId
}

export type TextureId = 'dots'
export type SceneId = 'nebula'

/**
 * What a base contributes before a preset picks its canvas. Splitting this out is
 * what lets the Custom theme guarantee contrast: the user chooses a base and a
 * pre-tuned canvas, and never touches the ink scale at all.
 */
export const BASE_TOKENS: Record<ThemeBase, Omit<ThemeTokens, 'canvas' | 'surface'>> = {
    dark: {
        base: 'dark',
        sunken: 'rgb(0 0 0 / 0.20)',
        scrim: '#000000',
        tooltip: 'rgb(0 0 0 / 0.85)',
        ink: '#ffffff',
        ink1: '#ffffff',
        ink2: 'rgb(255 255 255 / 0.72)',
        ink3: 'rgb(255 255 255 / 0.48)',
        ink4: 'rgb(255 255 255 / 0.30)',
        border: 'rgb(255 255 255 / 0.10)',
        ring: 'rgb(255 255 255 / 0.30)',
        primary: '#10b981',
        accentShade: '300',
    },
    light: {
        base: 'light',
        sunken: 'rgb(11 18 32 / 0.045)',
        // A dark scrim over a light app — the backdrop still needs to recede.
        scrim: '#0b1220',
        // Deliberately a *dark* bubble on a light theme: tooltips read better as
        // inverted chips, and it matches what every OS does.
        tooltip: 'rgb(17 24 39 / 0.92)',
        ink: '#0b1220',
        ink1: '#0b1220',
        ink2: '#3f4a5a',
        ink3: '#5b6779',
        // ~2.9:1 — decorative and disabled text only, exactly the role `text-white/30`
        // plays on dark. Not an AA claim; the `contrast` preset is the escape hatch.
        ink4: '#8a93a3',
        border: 'rgb(11 18 32 / 0.11)',
        ring: 'rgb(11 18 32 / 0.28)',
        primary: '#059669',
        accentShade: '700',
    },
}

export type ThemePreset = {
    id: Exclude<PresetId, 'custom'>
    tokens: ThemeTokens
    /** Exactly 8 colours (one per render slot) or null for a flat, blob-free look. */
    blobs: string[] | null
    motion: BlobMotion
}

function preset(
    id: Exclude<PresetId, 'custom'>,
    base: ThemeBase,
    canvas: string,
    surface: string,
    blobs: string[] | null,
    overrides: Partial<ThemeTokens> = {},
    motion: BlobMotion = 'animated',
): ThemePreset {
    return {
        id,
        tokens: { ...BASE_TOKENS[base], canvas, surface, ...overrides },
        blobs,
        motion,
    }
}

export const THEME_PRESETS: ThemePreset[] = [
    // The look the app shipped with, reproduced exactly — emerald-500, blue-600,
    // teal-400, cyan-500, teal-500, emerald-400, blue-500, cyan-400, in slot order.
    // Keeping this a true no-op is what makes Stage A verifiable.
    preset('aurora', 'dark', '#030712', '#0d1117', [
        '#10b981', '#2563eb', '#2dd4bf', '#06b6d4',
        '#14b8a6', '#34d399', '#3b82f6', '#22d3ee',
    ]),

    // Canvas is lifted off true #030712 on purpose: with the aurora gone, near-black
    // reads as a rendering failure rather than a deliberate choice.
    preset('midnight', 'dark', '#080b11', '#10151d', null),

    preset('daylight', 'light', '#f6f7f9', '#ffffff', null),

    // Warm cream cuts blue-white glare for the long timesheet and calendar reading
    // this app is built around. Stone neutrals — no reserved hue.
    // Warm cream cuts blue-white glare for the long timesheet and calendar reading
    // this app is built around. Stone-warm neutrals — no reserved hue — plus a faint
    // dot grain so it reads as paper rather than as grey-white.
    preset('paper', 'light', '#f0e2b8', '#f9efd2', null, {
        sunken: 'rgb(33 29 24 / 0.05)',
        ink: '#211d18',
        ink1: '#211d18',
        ink2: '#4a4136',
        ink3: '#6b6053',
        ink4: '#9c9083',
        border: 'rgb(33 29 24 / 0.12)',
        primary: '#047857',
        accentShade: '800',
        texture: 'dots',
        // 7% of the warm ink. Measured: this lands the grain around deltaE 5 against
        // the canvas — a texture you register without resolving individual dots.
        // Below ~4% it disappears at 100% zoom; past ~10% the grid becomes countable.
        textureColor: 'rgb(33 29 24 / 0.07)',
    }),

    // The second animated skin, drawn entirely from the free families (indigo,
    // fuchsia, sky, teal) — it demonstrates the palette constraint in the shipped
    // product rather than only inside the Custom picker. The only preset to claim a
    // scene: the blobs alone made it "Aurora in purple", so it gets the sky and the
    // dust the name promises.
    preset('nebula', 'dark', '#0a0713', '#150f22', [
        '#6366f1', '#d946ef', '#38bdf8', '#14b8a6',
        '#818cf8', '#c026d3', '#0ea5e9', '#2dd4bf',
    ], { scene: 'nebula' }),

    // Turns this app's genuinely low-contrast muted text into an accessibility
    // escape hatch — every ink level steps up, and borders double.
    preset('contrast', 'dark', '#000000', '#0a0a0a', null, {
        sunken: 'rgb(255 255 255 / 0.06)',
        ink2: '#e5e7eb',
        ink3: '#cbd5e1',
        ink4: '#9ca3af',
        border: 'rgb(255 255 255 / 0.24)',
        ring: '#ffffff',
        accentShade: '200',
    }),
]

export function findPreset(id: PresetId): ThemePreset {
    return THEME_PRESETS.find(p => p.id === id) ?? THEME_PRESETS[0]
}
