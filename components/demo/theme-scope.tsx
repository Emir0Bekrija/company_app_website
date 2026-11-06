'use client'

import { forwardRef, useMemo, type CSSProperties, type ReactNode } from 'react'
import { resolveTheme } from '@/vendor/app/theme/apply-theme'
import { ACCENT_SHADE_COLORS } from '@/vendor/app/theme/accent-shades'
import { ACCENT_HUES } from '@/vendor/app/theme/theme-presets'
import type { ThemeConfig } from '@/vendor/app/theme/theme-config'
import { NebulaStars } from '@/vendor/app/ui/nebula-scene'
import { cn } from '@/lib/utils'

/**
 * The app's applyTheme(), aimed at one element instead of <html>. Tailwind's `inline`
 * token layer emits var() references, so the same custom properties on a div theme
 * everything inside it while the marketing site around it stays untouched.
 */
function themeVars(config: ThemeConfig) {
  const { tokens, blobs, blobAlpha, motion } = resolveTheme(config)
  const shade = ACCENT_SHADE_COLORS[tokens.accentShade]
  const style: Record<string, string> = {
    '--canvas': tokens.canvas,
    '--surface': tokens.surface,
    '--sunken': tokens.sunken,
    '--scrim': tokens.scrim,
    '--tooltip': tokens.tooltip,
    '--ink': tokens.ink,
    '--ink-1': tokens.ink1,
    '--ink-2': tokens.ink2,
    '--ink-3': tokens.ink3,
    '--ink-4': tokens.ink4,
    '--border': tokens.border,
    '--ring': tokens.ring,
    '--primary': tokens.primary,
    '--on-accent': '#ffffff',
    colorScheme: tokens.base,
  }
  for (const hue of ACCENT_HUES) style[`--${hue}-fg`] = shade[hue]
  blobs?.forEach((hex, i) => { style[`--blob-${i + 1}`] = hex })
  style['--blob-alpha'] = String(blobAlpha)
  if (tokens.texture) style['--texture'] = tokens.textureColor ?? 'rgb(0 0 0 / 0.035)'
  return { style: style as CSSProperties, tokens, blobs, motion }
}

/** Geometry is the app's own, from theme-backdrop.tsx. */
const BLOBS = [
  { cls: '-top-40 -left-40 h-[37.5rem] w-[37.5rem] blur-[7.5rem]', v: '--blob-1', a: 20, anim: 'aurora-1 5s' },
  { cls: 'top-20 right-0 h-[31.25rem] w-[31.25rem] blur-[7.5rem]', v: '--blob-2', a: 20, anim: 'aurora-2 4s' },
  { cls: 'bottom-0 left-1/3 h-[25rem] w-[25rem] blur-[6.25rem]', v: '--blob-3', a: 10, anim: 'aurora-3 6s' },
  { cls: 'top-1/2 left-1/2 h-[18.75rem] w-[18.75rem] -translate-x-1/2 -translate-y-1/2 blur-[5rem]', v: '--blob-4', a: 10, anim: 'aurora-4 3.5s' },
  { cls: 'top-1/4 left-1/4 h-[28.125rem] w-[28.125rem] blur-[6.875rem]', v: '--blob-5', a: 15, anim: 'aurora-2 7s' },
  { cls: 'top-1/3 right-1/4 h-[25rem] w-[25rem] blur-[6.25rem]', v: '--blob-6', a: 15, anim: 'aurora-1 4.5s' },
  { cls: 'bottom-1/4 right-1/3 h-[21.875rem] w-[21.875rem] blur-[5.625rem]', v: '--blob-7', a: 15, anim: 'aurora-3 5.5s' },
  { cls: 'bottom-1/3 left-1/4 h-[18.75rem] w-[18.75rem] blur-[5rem]', v: '--blob-8', a: 10, anim: 'aurora-4 6.5s' },
] as const

function Backdrop({ blobs, texture, scene }: { blobs: string[] | null; texture?: string; scene?: string }) {
  if (!blobs && !texture && !scene) return null
  return (
    <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {scene === 'nebula' && <NebulaStars />}
      {blobs && (
        <div data-aurora className="absolute inset-0">
          {BLOBS.map((b) => (
            <div
              key={b.v}
              className={`absolute rounded-full ${b.cls}`}
              style={{
                backgroundColor: `color-mix(in oklab, var(${b.v}) calc(${b.a}% * var(--blob-alpha)), transparent)`,
                animation: `${b.anim} ease-in-out infinite`,
                willChange: 'transform, opacity',
              }}
            />
          ))}
        </div>
      )}
      {texture === 'dots' && (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle at 0.09375rem 0.09375rem, var(--texture) 0.09375rem, transparent 0.1rem)',
            backgroundSize: '1.25rem 1.25rem',
          }}
        />
      )}
    </div>
  )
}

type Props = { config: ThemeConfig; className?: string; children: ReactNode; backdrop?: boolean }

export const ThemeScope = forwardRef<HTMLDivElement, Props>(function ThemeScope(
  { config, className, children, backdrop = true },
  ref,
) {
  const { style, tokens, blobs, motion } = useMemo(() => themeVars(config), [config])
  return (
    <div
      ref={ref}
      style={style}
      data-scene={tokens.scene}
      data-texture={tokens.texture}
      data-motion={motion}
      className={cn('theme-scope relative isolate bg-canvas transition-[background-color] duration-500', tokens.base === 'dark' && 'dark', className)}
    >
      {backdrop && <Backdrop blobs={blobs} texture={tokens.texture} scene={tokens.scene} />}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
})
