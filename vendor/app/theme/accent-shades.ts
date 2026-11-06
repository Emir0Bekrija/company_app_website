/**
 * Tailwind's palette values for the four shades the accent-foreground tokens use,
 * copied in rather than referenced as var(--color-<hue>-<shade>).
 *
 * That indirection looks tidier but does not work: Tailwind v4 only emits a palette
 * variable when some utility in the project actually uses that exact shade. The app
 * uses text-red-300, so --color-red-300 exists — but nothing uses emerald-700, so
 * --color-emerald-700 is absent from the stylesheet and the light themes would
 * silently lose their accent colours.
 *
 * Generated from node_modules/tailwindcss/theme.css.
 */

import type { AccentHue } from './theme-presets'

export const ACCENT_SHADE_COLORS: Record<string, Record<AccentHue, string>> = {
    200: {
        red: 'oklch(88.5% 0.062 18.334)',
        rose: 'oklch(89.2% 0.058 10.001)',
        emerald: 'oklch(90.5% 0.093 164.15)',
        green: 'oklch(92.5% 0.084 155.995)',
        amber: 'oklch(92.4% 0.12 95.746)',
        yellow: 'oklch(94.5% 0.129 101.54)',
        orange: 'oklch(90.1% 0.076 70.697)',
        blue: 'oklch(88.2% 0.059 254.128)',
        sky: 'oklch(90.1% 0.058 230.902)',
        cyan: 'oklch(91.7% 0.08 205.041)',
        teal: 'oklch(91% 0.096 180.426)',
        violet: 'oklch(89.4% 0.057 293.283)',
        indigo: 'oklch(87% 0.065 274.039)',
        purple: 'oklch(90.2% 0.063 306.703)',
        pink: 'oklch(89.9% 0.061 343.231)',
        slate: 'oklch(92.9% 0.013 255.508)',
    },
    300: {
        red: 'oklch(80.8% 0.114 19.571)',
        rose: 'oklch(81% 0.117 11.638)',
        emerald: 'oklch(84.5% 0.143 164.978)',
        green: 'oklch(87.1% 0.15 154.449)',
        amber: 'oklch(87.9% 0.169 91.605)',
        yellow: 'oklch(90.5% 0.182 98.111)',
        orange: 'oklch(83.7% 0.128 66.29)',
        blue: 'oklch(80.9% 0.105 251.813)',
        sky: 'oklch(82.8% 0.111 230.318)',
        cyan: 'oklch(86.5% 0.127 207.078)',
        teal: 'oklch(85.5% 0.138 181.071)',
        violet: 'oklch(81.1% 0.111 293.571)',
        indigo: 'oklch(78.5% 0.115 274.713)',
        purple: 'oklch(82.7% 0.119 306.383)',
        pink: 'oklch(82.3% 0.12 346.018)',
        slate: 'oklch(86.9% 0.022 252.894)',
    },
    700: {
        red: 'oklch(50.5% 0.213 27.518)',
        rose: 'oklch(51.4% 0.222 16.935)',
        emerald: 'oklch(50.8% 0.118 165.612)',
        green: 'oklch(52.7% 0.154 150.069)',
        amber: 'oklch(55.5% 0.163 48.998)',
        yellow: 'oklch(55.4% 0.135 66.442)',
        orange: 'oklch(55.3% 0.195 38.402)',
        blue: 'oklch(48.8% 0.243 264.376)',
        sky: 'oklch(50% 0.134 242.749)',
        cyan: 'oklch(52% 0.105 223.128)',
        teal: 'oklch(51.1% 0.096 186.391)',
        violet: 'oklch(49.1% 0.27 292.581)',
        indigo: 'oklch(45.7% 0.24 277.023)',
        purple: 'oklch(49.6% 0.265 301.924)',
        pink: 'oklch(52.5% 0.223 3.958)',
        slate: 'oklch(37.2% 0.044 257.287)',
    },
    800: {
        red: 'oklch(44.4% 0.177 26.899)',
        rose: 'oklch(45.5% 0.188 13.697)',
        emerald: 'oklch(43.2% 0.095 166.913)',
        green: 'oklch(44.8% 0.119 151.328)',
        amber: 'oklch(47.3% 0.137 46.201)',
        yellow: 'oklch(47.6% 0.114 61.907)',
        orange: 'oklch(47% 0.157 37.304)',
        blue: 'oklch(42.4% 0.199 265.638)',
        sky: 'oklch(44.3% 0.11 240.79)',
        cyan: 'oklch(45% 0.085 224.283)',
        teal: 'oklch(43.7% 0.078 188.216)',
        violet: 'oklch(43.2% 0.232 292.759)',
        indigo: 'oklch(39.8% 0.195 277.366)',
        purple: 'oklch(43.8% 0.218 303.724)',
        pink: 'oklch(45.9% 0.187 3.815)',
        slate: 'oklch(27.9% 0.041 260.031)',
    },
}
