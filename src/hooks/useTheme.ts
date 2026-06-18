import { useState, useEffect } from 'react'
import { getItem, setItem } from '../utils/storage'

export type Theme = 'dark' | 'light'

const THEME_KEY = 'mercurial-theme'
const DEFAULT_THEME: Theme = 'dark'

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = getItem(THEME_KEY)
    return (stored === 'light' || stored === 'dark') ? stored : DEFAULT_THEME
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    setItem(THEME_KEY, theme)
  }, [theme])

  function setTheme(newTheme: Theme) {
    setThemeState(newTheme)
  }

  return { theme, setTheme }
}
