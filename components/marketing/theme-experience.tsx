'use client'

import { useMemo, useRef, useState } from 'react'
import { useMotionValueEvent, useReducedMotion, useScroll } from 'motion/react'
import { useLocale, useTranslations } from 'next-intl'
import { resolveTheme } from '@/vendor/app/theme/apply-theme'
import { BLOB_INTENSITIES, MAX_CUSTOM_BLOBS, PRESET_IDS, type CustomTheme, type PresetId, type ThemeBase, type ThemeConfig } from '@/vendor/app/theme/theme-config'
import { BLOB_SWATCHES, canvasesForBase, DEFAULT_CANVAS } from '@/vendor/app/theme/theme-palette'
import { ThemePreview } from '@/vendor/app/ui/theme-preview'
import { track } from '@/lib/analytics'
import { cn, stagger } from '@/lib/utils'
import { DemoProvider } from '@/lib/demo/store'
import type { DemoLocale } from '@/lib/demo/strings'
import { ThemeScope } from '../demo/theme-scope'
import { TimesheetView } from '../demo/timesheet'
import { WhenNear } from '../demo/lazy'
import { Band } from './band'

const SEED: CustomTheme = { base: 'dark', canvas: 'obsidian', blobs: ['indigo', 'fuchsia', 'sky', 'teal'], intensity: 'normal', motion: 'animated' }

function Choice<T extends string>({ label, value, options, onChange }: {
  label: string
  value: T
  options: { id: T; label: string }[]
  onChange: (id: T) => void
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm text-muted-fg">{label}</legend>
      <div className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={cn('min-h-10 rounded-[var(--radius-control)] px-3 text-sm font-medium', value === o.id ? 'bg-fg text-band' : 'fluent fluent-control')}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

function CustomControls({ value, onChange }: { value: CustomTheme; onChange: (v: CustomTheme) => void }) {
  const t = useTranslations('themes.custom')
  const canvases = canvasesForBase(value.base)
  return (
    <div className="grid gap-4">
      <Choice<ThemeBase>
        label={t('base')}
        value={value.base}
        options={[{ id: 'dark', label: t('dark') }, { id: 'light', label: t('light') }]}
        onChange={(base) => onChange({ ...value, base, canvas: DEFAULT_CANVAS[base] })}
      />
      <fieldset>
        <legend className="mb-1.5 text-sm text-muted-fg">{t('canvas')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {canvases.map((c) => (
            <button
              key={c.id}
              type="button"
              aria-pressed={value.canvas === c.id}
              aria-label={c.id}
              title={c.id}
              onClick={() => onChange({ ...value, canvas: c.id })}
              style={{ backgroundColor: c.canvas }}
              className={cn('size-9 ring-1 ring-line', value.canvas === c.id && 'ring-2 ring-jade ring-offset-2 ring-offset-band')}
            />
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-1.5 text-sm text-muted-fg">{t('colours')}</legend>
        <div className="flex flex-wrap gap-1.5">
          {BLOB_SWATCHES.map((b) => {
            const on = value.blobs.includes(b.id)
            return (
              <button
                key={b.id}
                type="button"
                aria-pressed={on}
                aria-label={b.id}
                title={b.id}
                disabled={!on && value.blobs.length >= MAX_CUSTOM_BLOBS}
                onClick={() => onChange({ ...value, blobs: on ? value.blobs.filter((x) => x !== b.id) : [...value.blobs, b.id] })}
                style={{ backgroundColor: b.hex }}
                className={cn('size-7 rounded-full disabled:opacity-30', on && 'ring-2 ring-fg ring-offset-2 ring-offset-band')}
              />
            )
          })}
        </div>
      </fieldset>
      <Choice
        label={t('intensity')}
        value={value.intensity}
        options={BLOB_INTENSITIES.map((id) => ({ id, label: t(id) }))}
        onChange={(intensity) => onChange({ ...value, intensity })}
      />
      <Choice
        label={t('motion')}
        value={value.motion}
        options={[{ id: 'animated' as const, label: t('animated') }, { id: 'still' as const, label: t('still') }]}
        onChange={(motion) => onChange({ ...value, motion })}
      />
    </div>
  )
}

/**
 * Every theme on a real screen. Each theme owns a slice of the stage's scroll, so scrolling
 * moves through them in order. Picking one moves the page to its slice, so scrolling carries
 * on from there in either direction. Custom stops the scroll so its controls can be used.
 */
export function ThemeExperience() {
  const t = useTranslations('themes')
  const locale = useLocale() as DemoLocale
  const reduced = useReducedMotion()
  const stage = useRef<HTMLDivElement>(null)
  const [preset, setPreset] = useState<PresetId>('aurora')
  const [custom, setCustom] = useState<CustomTheme>(SEED)
  const [picked, setPicked] = useState(false)
  const { scrollYProgress } = useScroll({ target: stage, offset: ['start start', 'end end'] })

  const auto = PRESET_IDS.filter((p) => p !== 'custom')
  useMotionValueEvent(scrollYProgress, 'change', (v) => {
    if (picked || reduced || v <= 0 || v >= 1) return
    if (!window.matchMedia('(min-width: 1024px)').matches) return
    setPreset(auto[Math.min(auto.length - 1, Math.floor(v * auto.length))])
  })

  /** Moves the page to the middle of a theme's slice of the stage. The stage is sticky, so nothing visibly jumps. */
  function scrollToSlot(index: number) {
    const el = stage.current
    if (!el || reduced || !window.matchMedia('(min-width: 1024px)').matches) return
    const top = el.getBoundingClientRect().top + window.scrollY
    const range = el.offsetHeight - window.innerHeight
    if (range <= 0) return
    // Instant, because html scrolls smoothly and a glide would flash every theme on the way.
    window.scrollTo({ top: top + (range * (index + 0.5)) / auto.length, behavior: 'instant' })
  }

  const config = useMemo<ThemeConfig>(
    () => (preset === 'custom' ? { preset: 'custom', custom } : { preset }),
    [preset, custom],
  )
  const { tokens, blobs } = resolveTheme(config)

  return (
    <Band tone="deep" edge="chevron" id="themes">
      {/* Pulled up by the cut so the band's chevron slices the panel instead of leaving a seam under it. */}
      <div ref={stage} className={cn('lg:mt-[calc(var(--cut)*-1)]', !reduced && 'lg:h-[320vh]')}>
        <div className={cn('relative overflow-hidden', !reduced && 'lg:sticky lg:top-0 lg:h-screen')}>
          <div className="theme-stage h-full">
            <div className="theme-copy py-16 lg:self-center lg:py-20 lg:pt-24">
              <h2 data-reveal="mask" className="display-2 lg:text-[clamp(2rem,3.4vw,3.25rem)]">{t('title')}</h2>
              <p data-reveal="rise" className="lede mt-4">{t('lede')}</p>

              <div role="radiogroup" aria-label={t('label')} className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-4">
                {PRESET_IDS.map((id, i) => {
                  const resolved = resolveTheme(id === 'custom' ? { preset: 'custom', custom } : { preset: id })
                  return (
                    <button
                      key={id}
                      type="button"
                      data-reveal="pop"
                      style={stagger(i * 0.6)}
                      role="radio"
                      aria-checked={preset === id}
                      onClick={() => {
                        setPreset(id)
                        setPicked(id === 'custom')
                        if (id !== 'custom') scrollToSlot(auto.indexOf(id))
                        track('theme_selected', { theme: id })
                      }}
                      className={cn('rounded-[var(--radius-control)] p-1.5 text-left text-sm font-medium', preset === id ? 'bg-fg text-band' : 'fluent fluent-control')}
                    >
                      <ThemePreview tokens={resolved.tokens} blobs={resolved.blobs} className="!h-12" />
                      <span className="mt-1 block truncate">{t(`names.${id}`)}</span>
                    </button>
                  )
                })}
              </div>
              <p aria-live="polite" className="mt-3 min-h-6 text-[0.9375rem] text-muted-fg">{t(`descriptions.${preset}`)}</p>
              {preset === 'custom' && <div className="mt-3"><CustomControls value={custom} onChange={setCustom} /></div>}
            </div>

            {/* The panel is the live theme, with the app sitting straight on it. The outer
                layer shows through the inset fill as the coloured line along the cut. */}
            <div
              className={cn('theme-panel h-[32rem] transition-colors duration-700', reduced ? 'lg:h-auto lg:min-h-[44rem]' : 'lg:h-full')}
              style={{ backgroundColor: blobs?.[0] ?? tokens.primary }}
            >
              <div className="theme-panel-fill transition-colors duration-700" style={{ backgroundColor: tokens.canvas }}>
                <WhenNear className="h-full">
                  <DemoProvider locale={locale} persist={false}>
                    <ThemeScope config={config} className="h-full">
                      <div inert className="theme-panel-view h-full overflow-hidden">
                        <div className="max-w-[68rem]"><TimesheetView /></div>
                      </div>
                    </ThemeScope>
                  </DemoProvider>
                </WhenNear>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Band>
  )
}
