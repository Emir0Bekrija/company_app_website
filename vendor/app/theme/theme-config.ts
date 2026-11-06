/**
 * The shape of a user's theme choice, and the (deliberately forgiving) codec that
 * moves it between localStorage, the server column, and the running app.
 *
 * A theme is either a named preset or a `custom` config assembled from curated
 * ids — never raw colours. Storing ids means the palette can be retuned centrally
 * without migrating stored values, and a garbled or hostile value can only ever
 * resolve to a known id or the default.
 */

export const THEME_VERSION = 1

export type PresetId =
    | 'aurora'
    | 'midnight'
    | 'daylight'
    | 'paper'
    | 'nebula'
    | 'contrast'
    | 'custom'

export type ThemeBase = 'dark' | 'light'
export type BlobIntensity = 'subtle' | 'normal' | 'vivid'
export type BlobMotion = 'animated' | 'still'

/** Ids into CANVAS_PAIRS / BLOB_SWATCHES in theme-palette.ts. */
export type CanvasId = string
export type BlobSwatchId = string

export type CustomTheme = {
    base: ThemeBase
    canvas: CanvasId
    /** 0–4 entries. Empty means "no blobs" — the flat look. */
    blobs: BlobSwatchId[]
    intensity: BlobIntensity
    motion: BlobMotion
}

export type ThemeConfig =
    /**
     * `stars` is Nebula's starfield switch. Absent means on, so every theme value
     * stored before the switch existed keeps its stars — and the common case adds
     * nothing to the string that has to fit the server's 400-char column.
     */
    | { preset: Exclude<PresetId, 'custom'>; stars?: boolean }
    | { preset: 'custom'; custom: CustomTheme }

export const DEFAULT_THEME: ThemeConfig = { preset: 'aurora' }

export const PRESET_IDS = [
    'aurora',
    'midnight',
    'daylight',
    'paper',
    'nebula',
    'contrast',
    'custom',
] as const

export const BLOB_INTENSITIES: BlobIntensity[] = ['subtle', 'normal', 'vivid']

/** How many blob colours a custom theme may pick. The 8 render slots cycle through them. */
export const MAX_CUSTOM_BLOBS = 4

function isPresetId(value: unknown): value is PresetId {
    return typeof value === 'string' && (PRESET_IDS as readonly string[]).includes(value)
}

/**
 * Never throws. Bad JSON, an unknown preset, a future version, or a hand-edited
 * localStorage value all fall back to the default rather than breaking the shell —
 * a theme is not worth a blank page.
 *
 * Custom configs are repaired field by field instead of rejected wholesale, so a
 * single unrecognised swatch id doesn't discard the user's whole palette.
 */
export function parseTheme(raw: string | null | undefined): ThemeConfig {
    if (!raw) return DEFAULT_THEME

    let parsed: unknown
    try {
        parsed = JSON.parse(raw)
    } catch {
        return DEFAULT_THEME
    }

    if (typeof parsed !== 'object' || parsed === null) return DEFAULT_THEME
    const obj = parsed as Record<string, unknown>

    if (obj.v !== THEME_VERSION) return DEFAULT_THEME
    if (!isPresetId(obj.preset)) return DEFAULT_THEME

    // Normalised to "field absent" for on, because `useThemeSync` decides whether the
    // server disagrees with the local value by comparing serialized strings — two
    // spellings of the same choice would read as a difference.
    if (obj.preset !== 'custom') {
        return obj.stars === false
            ? { preset: obj.preset, stars: false }
            : { preset: obj.preset }
    }

    const custom = obj.custom
    if (typeof custom !== 'object' || custom === null) return DEFAULT_THEME
    const c = custom as Record<string, unknown>

    const base: ThemeBase = c.base === 'light' ? 'light' : 'dark'

    return {
        preset: 'custom',
        custom: {
            base,
            canvas: typeof c.canvas === 'string' ? c.canvas : '',
            blobs: Array.isArray(c.blobs)
                ? c.blobs.filter((b): b is string => typeof b === 'string').slice(0, MAX_CUSTOM_BLOBS)
                : [],
            intensity: BLOB_INTENSITIES.includes(c.intensity as BlobIntensity)
                ? (c.intensity as BlobIntensity)
                : 'normal',
            motion: c.motion === 'still' ? 'still' : 'animated',
        },
    }
}

export function serializeTheme(config: ThemeConfig): string {
    return JSON.stringify({ v: THEME_VERSION, ...config })
}
