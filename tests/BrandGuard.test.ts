import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect } from 'vitest'

// brand-restyle @s6 — guardia anti-marca. Los terminos prohibidos viven en
// base64 y se decodifican en runtime: este archivo no los contiene en claro.

const FORBIDDEN_WORD_B64 = 'RVk='
const FORBIDDEN_SUBSTRING_B64 = 'SW50ZXJzdGF0ZQ=='

const decode = (encoded: string): string => atob(encoded)

const buildWordPattern = (): RegExp => new RegExp(`\\b${decode(FORBIDDEN_WORD_B64)}\\b`, 'i')

const containsWord = (content: string): boolean => buildWordPattern().test(content)

const containsSubstring = (content: string): boolean =>
  content.toLowerCase().includes(decode(FORBIDDEN_SUBSTRING_B64).toLowerCase())

// Vite excluye del glob al propio importador, por eso el guardia se lee aparte.
const SELF_PATH = 'tests/BrandGuard.test.ts'

const SCANNED = import.meta.glob(['/src/**/*', '/tests/**/*', '/index.html', '/package.json'], {
  query: '?raw',
  import: 'default',
  eager: true,
}) as Record<string, string>

const findOffenders = (matches: (content: string) => boolean): string[] =>
  Object.entries(SCANNED)
    .filter(([, content]) => matches(content))
    .map(([path]) => path)

describe('brand-restyle @s6 — ningun archivo nombra la marca de referencia', () => {
  it('recorre src/, tests/, index.html y package.json', () => {
    const paths = Object.keys(SCANNED)
    expect(paths).toContain('/index.html')
    expect(paths).toContain('/package.json')
    expect(paths.some((p) => p.startsWith('/src/'))).toBe(true)
    expect(paths.some((p) => p.startsWith('/tests/'))).toBe(true)
  })

  it('el primer termino no aparece como palabra completa (sin distinguir mayusculas)', () => {
    expect(findOffenders(containsWord)).toEqual([])
  })

  it('el segundo termino no aparece ni como substring (sin distinguir mayusculas)', () => {
    expect(findOffenders(containsSubstring)).toEqual([])
  })

  it('los detectores muerden: encuentran los terminos en un texto de prueba', () => {
    const word = decode(FORBIDDEN_WORD_B64)
    expect(containsWord(`marca ${word.toLowerCase()} aqui`)).toBe(true)
    expect(containsWord(`${word.toUpperCase()}.`)).toBe(true)
    expect(containsWord(`${word}x`)).toBe(false)
    expect(containsWord(`x${word}`)).toBe(false)
    const sub = decode(FORBIDDEN_SUBSTRING_B64)
    expect(containsSubstring(`xx${sub.toUpperCase()}yy`)).toBe(true)
    expect(containsSubstring('texto neutro')).toBe(false)
  })

  it('este archivo no contiene los terminos en texto plano', () => {
    const self = readFileSync(resolve(process.cwd(), SELF_PATH), 'utf-8')
    expect(containsWord(self)).toBe(false)
    expect(containsSubstring(self)).toBe(false)
  })
})
