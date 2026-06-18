import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { useTheme } from '../src/hooks/useTheme'

const THEME_KEY = 'mercurial-theme'

describe('useTheme', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  // @s9 — default "dark" when localStorage empty
  it('establece data-theme="dark" por defecto cuando localStorage está vacío', () => {
    renderHook(() => useTheme())
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  // @s8 — restores from localStorage
  it('restaura el tema desde localStorage al inicializar', () => {
    localStorage.setItem(THEME_KEY, 'light')
    renderHook(() => useTheme())
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  // @s5 — activar light aplica data-theme="light"
  it('aplica data-theme="light" al activar el tema claro', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })

  // @s6 — activar dark aplica data-theme="dark"
  it('aplica data-theme="dark" al activar el tema oscuro', () => {
    localStorage.setItem(THEME_KEY, 'light')
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('dark')
    })
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })

  // @s7 — persiste en localStorage
  it('persiste el tema en localStorage al cambiarlo', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })

  // expone theme actual correctamente
  it('expone el valor de theme actual', () => {
    const { result } = renderHook(() => useTheme())
    expect(result.current.theme).toBe('dark')
  })

  it('actualiza el valor de theme tras setTheme', () => {
    const { result } = renderHook(() => useTheme())
    act(() => {
      result.current.setTheme('light')
    })
    expect(result.current.theme).toBe('light')
  })
})
