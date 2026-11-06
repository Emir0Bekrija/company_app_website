/**
 * The shape of a bright star, shared between the live Nebula backdrop
 * (`nebula-scene.tsx`) and the Appearance card's miniature (`theme-preview.tsx`).
 *
 * It lives in its own module for two reasons: the preview's contract is that it can
 * never drift from the theme it advertises, which means drawing the *same* star rather
 * than a lookalike; and a component file that also exports helpers breaks fast refresh.
 */

/**
 * Core, halo and a 4-point cross, as four background layers on one element.
 *
 * The spikes are the part worth reading twice: a `linear-gradient` is squeezed into a
 * 1px band by `background-size`, and tapers itself through its own transparent ends. Two
 * of them crossed give a star that scales with the element and needs no children, no
 * pseudo-elements and no SVG.
 *
 * `colour` is any CSS colour — a `var(--ink)` reference in the live backdrop, a literal
 * hex in the preview, where the previewed theme is not the active one.
 */
export function brightStarBackground(colour: string): string {
    const halo = `color-mix(in oklab, ${colour} 40%, transparent)`
    const spike = `color-mix(in oklab, ${colour} 70%, transparent)`

    return [
        `radial-gradient(circle at 50% 50%, ${colour} 0, ${colour} 1px, transparent 2.2px)`,
        `radial-gradient(circle at 50% 50%, ${halo} 0, transparent 60%)`,
        `linear-gradient(to right, transparent, ${spike} 50%, transparent)`,
        `linear-gradient(to bottom, transparent, ${spike} 50%, transparent)`,
    ].join(', ')
}

/** Must stay in lockstep with the layer order above — it is what confines the spikes. */
export const STAR_BACKGROUND_SIZE = '100% 100%, 100% 100%, 100% 1px, 1px 100%'
