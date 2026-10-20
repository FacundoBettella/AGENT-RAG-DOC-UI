import { describe, it, expect } from 'vitest'
import { contrastRatio, readDarkTokens, readLightTokens, type TokenMap } from './brandTokens'

// brand-restyle @s2 — pares texto/fondo del spec, WCAG AA (>= 4.5:1) en ambos temas.

const MIN_RATIO = 4.5

const ALL_SURFACES = [
  'background',
  'surface',
  'surface-container-low',
  'surface-container',
  'surface-container-high',
  'surface-container-highest',
]

const PAIRS: Array<{ text: string; backgrounds: string[] }> = [
  { text: 'on-surface', backgrounds: ALL_SURFACES },
  { text: 'on-surface-variant', backgrounds: ALL_SURFACES },
  { text: 'primary', backgrounds: ALL_SURFACES },
  {
    text: 'error',
    backgrounds: ['background', 'surface', 'surface-container-low', 'surface-container'],
  },
  { text: 'outline', backgrounds: ['background', 'surface-container-low'] },
  { text: 'on-accent', backgrounds: ['accent'] },
  { text: 'on-primary-container', backgrounds: ['primary-container'] },
  { text: 'on-secondary-container', backgrounds: ['secondary-container'] },
  { text: 'on-error-container', backgrounds: ['error-container'] },
]

const failingPairs = (tokens: TokenMap): string[] =>
  PAIRS.flatMap(({ text, backgrounds }) =>
    backgrounds.flatMap((bg) => {
      expect(tokens[text], `token ${text}`).toBeDefined()
      expect(tokens[bg], `token ${bg}`).toBeDefined()
      const ratio = contrastRatio(tokens[text], tokens[bg])
      return ratio >= MIN_RATIO ? [] : [`${text} sobre ${bg}: ${ratio.toFixed(2)}`]
    }),
  )

describe('brand-restyle @s2 — contraste WCAG AA', () => {
  it('calcula ratios conocidos (negro/blanco 21:1, amarillo/blanco < 1.5:1)', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0)
    expect(contrastRatio('#ffe600', '#ffffff')).toBeLessThan(1.5)
  })

  it('todos los pares cumplen >= 4.5:1 en light', () => {
    expect(failingPairs(readLightTokens())).toEqual([])
  })

  it('todos los pares cumplen >= 4.5:1 en dark', () => {
    expect(failingPairs(readDarkTokens())).toEqual([])
  })

  it('detecta una regresion: amarillo como primary en light falla', () => {
    const regressed = { ...readLightTokens(), primary: '#ffe600' }
    expect(failingPairs(regressed).length).toBeGreaterThan(0)
  })
})
