import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { STRINGS, translate } from '@/lib/demo/strings'

const demoDir = join(__dirname, '..', 'components', 'demo')
const source = readdirSync(demoDir).map((f) => readFileSync(join(demoDir, f), 'utf8')).join('\n')
  + readFileSync(join(__dirname, '..', 'lib', 'demo', 'engine.ts'), 'utf8')

describe('demo strings', () => {
  it('has both languages for every string', () => {
    for (const [key, [en, bs]] of Object.entries(STRINGS)) {
      expect(en, key).toBeTruthy()
      expect(bs, key).toBeTruthy()
    }
  })

  it('uses the same placeholders in both languages', () => {
    const names = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort()
    for (const [key, [en, bs]] of Object.entries(STRINGS)) expect(names(bs), key).toEqual(names(en))
  })

  it('defines every literal key the demo uses', () => {
    const used = [...source.matchAll(/\bt\('([\w.]+)'/g)].map((m) => m[1])
    expect(used.length).toBeGreaterThan(100)
    expect(used.filter((k) => !STRINGS[k])).toEqual([])
  })

  it('defines every error and notification the engine can produce', () => {
    const errors = [...source.matchAll(/'(error\.\w+)'/g)].map((m) => m[1])
    expect(errors.filter((k) => !STRINGS[k])).toEqual([])
    const engine = readFileSync(join(__dirname, '..', 'lib', 'demo', 'engine.ts'), 'utf8')
    const notifications = [...engine.matchAll(/'(?:hr|worker)', (?:a\.approve \? )?'(\w+)'(?: : '(\w+)')?/g)]
      .flatMap((m) => [m[1], m[2]]).filter(Boolean)
    expect(notifications.length).toBeGreaterThan(10)
    expect(notifications.filter((k) => !STRINGS[`notif.${k}`])).toEqual([])
  })

  it('interpolates values', () => {
    expect(translate('en', 'toast.invited', { name: 'Ana' })).toBe('Invite sent to Ana.')
    expect(translate('bs', 'tour.step', { n: 1, total: 5 })).toBe('Korak 1 od 5')
  })
})
