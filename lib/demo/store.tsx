'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react'
import { createSeed, reducer, type Action, type DemoState } from './engine'
import { translate, type DemoLocale } from './strings'

const STORAGE_KEY = 'navitecs-demo-v2'

type Toast = { id: number; text: string; tone: 'success' | 'error' | 'info' }

type DemoContext = {
  state: DemoState
  dispatch: (action: Action) => void
  /** Back to a fresh sample company, optionally prepared for a tour. */
  reset: (prepare?: (seed: DemoState) => DemoState) => void
  toast: (text: string, tone?: Toast['tone']) => void
  toasts: Toast[]
  locale: DemoLocale
  t: (key: string, params?: Record<string, string | number>) => string
}

const Context = createContext<DemoContext | null>(null)

/** sessionStorage can throw in private windows, or hold state from a previous month. */
function loadInitial(persist: boolean): DemoState {
  const seed = createSeed(new Date())
  if (!persist) return seed
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    if (raw) {
      const saved = JSON.parse(raw) as DemoState
      if (saved.today === seed.today) return saved
    }
  } catch { /* fall through to the seed */ }
  return seed
}

export function DemoProvider({ children, locale: siteLocale, persist = true }: { children: ReactNode; locale: DemoLocale; persist?: boolean }) {
  const [state, dispatch] = useReducer(reducer, persist, loadInitial)
  // The Language setting changes the app in the frame, not the site around it.
  const locale = state.language ?? siteLocale
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  useEffect(() => {
    if (!persist) return
    try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state)) } catch { /* the demo works without it */ }
  }, [state, persist])

  const toast = useCallback((text: string, tone: Toast['tone'] = 'success') => {
    const id = ++toastId.current
    setToasts((list) => [...list, { id, text, tone }])
    setTimeout(() => setToasts((list) => list.filter((x) => x.id !== id)), 3600)
  }, [])

  const reset = useCallback((prepare?: (seed: DemoState) => DemoState) => {
    const seed = createSeed(new Date())
    dispatch({ type: 'reset', state: prepare ? prepare(seed) : seed })
  }, [])
  const t = useCallback((key: string, params?: Record<string, string | number>) => translate(locale, key, params), [locale])

  const value = useMemo(
    () => ({ state, dispatch, reset, toast, toasts, locale, t }),
    [state, reset, toast, toasts, locale, t],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useDemo() {
  const value = useContext(Context)
  if (!value) throw new Error('useDemo must be used inside DemoProvider')
  return value
}
