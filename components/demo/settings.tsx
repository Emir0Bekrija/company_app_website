'use client'

import { useState, type FormEvent } from 'react'
import type { SettingsTab, TwoFactorRequirement } from '@/lib/demo/engine'
import { useDemo } from '@/lib/demo/store'
import { BLOB_INTENSITIES, MAX_CUSTOM_BLOBS, PRESET_IDS, type CustomTheme, type ThemeBase } from '@/vendor/app/theme/theme-config'
import { BLOB_SWATCHES, canvasesForBase, DEFAULT_CANVAS } from '@/vendor/app/theme/theme-palette'
import { ErrorNote, Field, Input, Page, Pill, PrimaryButton, Select, SoftButton } from './primitives'

const TABS: SettingsTab[] = ['security', 'appearance', 'language']
const REQUIREMENTS: TwoFactorRequirement[] = ['none', 'admins', 'everyone']
// Invented for the demo. They unlock nothing.
const SAMPLE_CODES = ['DEMO-1A2B', 'DEMO-3C4D', 'DEMO-5E6F', 'DEMO-7G8H', 'DEMO-9J1K', 'DEMO-2L3M', 'DEMO-4N5P', 'DEMO-6Q7R', 'DEMO-8S9T', 'DEMO-1U2V']

/** Decoration only: it isn't a real QR code and encodes nothing. */
function SampleCode() {
  const cells = Array.from({ length: 121 }, (_, i) => ((i * 7 + (i % 11) * 3 + Math.floor(i / 11) * 5) % 4 < 2))
  return (
    <div aria-hidden className="grid size-32 shrink-0 grid-cols-11 gap-px rounded-lg bg-white p-2">
      {cells.map((on, i) => <span key={i} className={on ? 'bg-slate-900' : ''} />)}
    </div>
  )
}

function TwoFactorSetup({ onCancel }: { onCancel: () => void }) {
  const { dispatch, t } = useDemo()
  const [code, setCode] = useState('123456')
  const [error, setError] = useState<string | null>(null)

  function submit(e: FormEvent) {
    e.preventDefault()
    if (!/^\d{6}$/.test(code)) { setError(t('error.sixDigits')); return }
    dispatch({ type: 'verifyTwoFactor' })
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="flex flex-col gap-4 sm:flex-row">
        <SampleCode />
        <ol className="list-decimal space-y-1 pl-5 text-sm text-ink-2">
          <li>{t('security.step1')}</li>
          <li>{t('security.step2')}</li>
          <li>{t('security.step3')}</li>
        </ol>
      </div>
      <p className="text-xs text-ink-3">{t('security.sample')}</p>
      <Field label={t('security.code')}><Input inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} /></Field>
      <ErrorNote>{error}</ErrorNote>
      <div className="flex gap-2">
        <PrimaryButton type="submit" data-tour="twofa-verify">{t('security.turnOnShort')}</PrimaryButton>
        <SoftButton className="h-10" onClick={onCancel}>{t('action.close')}</SoftButton>
      </div>
    </form>
  )
}

function RecoveryCodes() {
  const { dispatch, t, toast } = useDemo()
  const [saved, setSaved] = useState(false)
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-ink-1">{t('security.saveCodes')}</h4>
      <ul className="grid grid-cols-2 gap-1 rounded-lg bg-ink/5 p-3 text-sm text-ink-1 sm:grid-cols-5">
        {SAMPLE_CODES.map((c) => <li key={c}>{c}</li>)}
      </ul>
      <label data-tour="twofa-ack" className="flex items-center gap-2 text-sm text-ink-2">
        <input type="checkbox" className="size-4 accent-emerald-600" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
        {t('security.savedThem')}
      </label>
      <PrimaryButton
        data-tour="twofa-done"
        disabled={!saved}
        onClick={() => { dispatch({ type: 'confirmRecoveryCodes' }); toast(t('toast.twoFactorOn')) }}
      >
        {t('security.done')}
      </PrimaryButton>
    </div>
  )
}

function Security() {
  const { state, dispatch, t, toast } = useDemo()
  const [setting, setSetting] = useState(false)
  const on = state.twoFactor === 'on'
  return (
    <div className="space-y-4">
      <div className="space-y-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-ink-2">{t('security.twoStep')}</h3>
          <Pill tone={on ? 'emerald' : 'ink'}>{t(on ? 'security.on' : 'security.off')}</Pill>
        </div>
        {state.twoFactor === 'codes' ? <RecoveryCodes />
          : on ? <SoftButton tone="red" onClick={() => { dispatch({ type: 'turnOffTwoFactor' }); setSetting(false) }}>{t('security.turnOff')}</SoftButton>
          : setting ? <TwoFactorSetup onCancel={() => setSetting(false)} />
          : <PrimaryButton data-tour="twofa-start" onClick={() => setSetting(true)}>{t('security.turnOn')}</PrimaryButton>}
      </div>

      <div className="space-y-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <h3 className="text-sm font-semibold text-ink-2">{t('security.company')}</h3>
        <div role="radiogroup" aria-label={t('security.company')} className="grid grid-cols-3 gap-1 rounded-lg bg-ink/5 p-1">
          {REQUIREMENTS.map((r) => (
            <button
              key={r}
              type="button"
              role="radio"
              data-tour={`twofa-${r}`}
              aria-checked={state.twoFactorRequirement === r}
              disabled={!on}
              onClick={() => { dispatch({ type: 'setTwoFactorRequirement', requirement: r }); toast(t('toast.requirementSaved')) }}
              className={`h-9 rounded-md px-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm ${state.twoFactorRequirement === r ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
            >
              {t(`security.require.${r}`)}
            </button>
          ))}
        </div>
        <p className="text-xs text-ink-3">{t(on ? 'security.requireNote' : 'security.requireOff')}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
        <p className="min-w-0 flex-1 basis-56 text-sm text-ink-2">{t('security.signOutNote')}</p>
        <SoftButton onClick={() => toast(t('toast.signOutSimulated'), 'info')}>{t('security.signOut')}</SoftButton>
      </div>
    </div>
  )
}

const DEFAULT_CUSTOM: CustomTheme = { base: 'dark', canvas: DEFAULT_CANVAS.dark, blobs: ['teal', 'indigo'], intensity: 'normal', motion: 'animated' }

function CustomPanel({ custom }: { custom: CustomTheme }) {
  const { dispatch, t } = useDemo()
  const set = (patch: Partial<CustomTheme>) => dispatch({ type: 'setTheme', theme: { preset: 'custom', custom: { ...custom, ...patch } } })
  const toggle = (id: string) => {
    if (custom.blobs.includes(id)) set({ blobs: custom.blobs.filter((b) => b !== id) })
    else if (custom.blobs.length < MAX_CUSTOM_BLOBS) set({ blobs: [...custom.blobs, id] })
  }
  return (
    <div className="space-y-3 rounded-xl border border-ink/10 bg-ink/[0.03] p-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t('theme.base')}>
          <Select value={custom.base} onChange={(e) => { const base = e.target.value as ThemeBase; set({ base, canvas: DEFAULT_CANVAS[base] }) }}>
            <option value="dark">{t('theme.dark')}</option>
            <option value="light">{t('theme.light')}</option>
          </Select>
        </Field>
        <Field label={t('theme.intensity')}>
          <Select value={custom.intensity} onChange={(e) => set({ intensity: e.target.value as CustomTheme['intensity'] })}>
            {BLOB_INTENSITIES.map((i) => <option key={i} value={i}>{t(`theme.intensity.${i}`)}</option>)}
          </Select>
        </Field>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-ink-3">{t('theme.background')}</p>
        <div className="flex flex-wrap gap-2">
          {canvasesForBase(custom.base).map((c, i) => (
            <button
              key={c.id}
              type="button"
              aria-label={t('theme.backgroundN', { n: i + 1 })}
              aria-pressed={custom.canvas === c.id}
              onClick={() => set({ canvas: c.id })}
              className={`size-8 rounded-lg border border-ink/20 ${custom.canvas === c.id ? 'ring-2 ring-ring' : ''}`}
              style={{ backgroundColor: c.canvas }}
            />
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-ink-3">{t('theme.colours')}</p>
        <div className="flex flex-wrap gap-2">
          {BLOB_SWATCHES.map((b, i) => (
            <button
              key={b.id}
              type="button"
              aria-label={t('theme.colourN', { n: i + 1 })}
              aria-pressed={custom.blobs.includes(b.id)}
              onClick={() => toggle(b.id)}
              className={`size-7 rounded-full ${custom.blobs.includes(b.id) ? 'ring-2 ring-ring' : ''}`}
              style={{ backgroundColor: b.hex }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function Appearance() {
  const { state, dispatch, t } = useDemo()
  const theme = state.theme
  return (
    <div className="space-y-3">
      <div data-tour="theme-presets" className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {PRESET_IDS.filter((p) => p !== 'custom').map((p) => (
          <button
            key={p}
            type="button"
            aria-pressed={theme.preset === p}
            onClick={() => dispatch({ type: 'setTheme', theme: { preset: p } })}
            className={`h-12 rounded-xl border px-3 text-left text-sm font-medium text-ink-1 transition-colors ${theme.preset === p ? 'border-ring bg-ink/10' : 'border-ink/10 bg-ink/5 hover:bg-ink/10'}`}
          >
            {t(`theme.${p}`)}
          </button>
        ))}
      </div>
      <button
        type="button"
        data-tour="theme-custom"
        aria-pressed={theme.preset === 'custom'}
        onClick={() => dispatch({ type: 'setTheme', theme: { preset: 'custom', custom: DEFAULT_CUSTOM } })}
        className={`h-12 w-full rounded-xl border px-3 text-left text-sm font-medium text-ink-1 transition-colors ${theme.preset === 'custom' ? 'border-ring bg-ink/10' : 'border-ink/10 bg-ink/5 hover:bg-ink/10'}`}
      >
        {t('theme.custom')}
      </button>
      {theme.preset === 'custom' && <CustomPanel custom={theme.custom} />}
    </div>
  )
}

function Language() {
  const { state, dispatch, locale, t } = useDemo()
  return (
    <div className="space-y-2 sm:max-w-sm">
      <div data-tour="language-select">
        <Field label={t('settings.language')}>
          <Select value={state.language ?? locale} onChange={(e) => dispatch({ type: 'setLanguage', language: e.target.value as 'en' | 'bs' })}>
            <option value="en">English</option>
            <option value="bs">Bosanski</option>
          </Select>
        </Field>
      </div>
      <p className="text-xs text-ink-3">{t('settings.languageNote')}</p>
    </div>
  )
}

export function SettingsView() {
  const { state, dispatch, t } = useDemo()
  return (
    <Page title={t('settings.title')} subtitle={t('settings.subtitle')}>
      <div className="flex gap-1 rounded-lg bg-ink/5 p-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            data-tour={`settings-tab-${tab}`}
            aria-pressed={state.settingsTab === tab}
            onClick={() => dispatch({ type: 'setSettingsTab', tab })}
            className={`h-9 flex-1 rounded-md px-2 text-sm font-medium transition-colors ${state.settingsTab === tab ? 'bg-surface text-ink-1 shadow-sm' : 'text-ink-3 hover:text-ink-1'}`}
          >
            {t(`settings.tab.${tab}`)}
          </button>
        ))}
      </div>
      {state.settingsTab === 'security' ? <Security /> : state.settingsTab === 'appearance' ? <Appearance /> : <Language />}
    </Page>
  )
}
