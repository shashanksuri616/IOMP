import { createContext, useContext, useEffect, useMemo, useState } from 'react'

type Theme = 'light' | 'dark'
type Background = 'none' | 'waves' | 'terminal'

type ThemeCtx = {
  theme: Theme
  setTheme: (t: Theme) => void
  bg: Background
  setBg: (b: Background) => void
}
const Ctx = createContext<ThemeCtx | null>(null)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [bg, setBgState] = useState<Background>('waves')

  useEffect(() => {
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) setThemeState(saved)
  const rawBg = localStorage.getItem('bg') as string | null
    // Migrate old key 'dotgrid' to 'terminal'
    const migrated = rawBg === 'dotgrid' ? 'terminal' : rawBg
    if (migrated && (['none','waves','terminal'] as const).includes(migrated as any)) {
      setBgState(migrated as Background)
    }
  }, [])

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', theme)
    if (theme === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  // Couple background to theme automatically: both use waves; dark variant uses dark colors
  useEffect(() => {
    setBgState('waves')
  }, [theme])

  useEffect(() => {
    localStorage.setItem('bg', bg)
  }, [bg])

  const setTheme = (t: Theme) => setThemeState(t)
  const setBg = (b: Background) => setBgState(b)
  const value = useMemo(() => ({ theme, setTheme, bg, setBg }), [theme, bg])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useTheme() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
