// Utilidades compartidas por los tests de brand-restyle: lectura de los
// tokens de src/index.css y calculo de contraste WCAG.

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const indexCss = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf-8')

export type TokenMap = Record<string, string>

const TOKEN_PATTERN = /--color-([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g

const extractBlock = (css: string, opener: RegExp): string => {
  const match = opener.exec(css)
  if (!match) throw new Error(`Bloque no encontrado: ${opener}`)
  const start = css.indexOf('{', match.index) + 1
  const end = css.indexOf('}', start)
  return css.slice(start, end)
}

const parseTokens = (block: string): TokenMap => {
  const tokens: TokenMap = {}
  for (const [, name, value] of block.matchAll(TOKEN_PATTERN)) {
    tokens[name] = value.toLowerCase()
  }
  return tokens
}

export const readIndexCss = (): string => indexCss

export const readLightTokens = (): TokenMap => parseTokens(extractBlock(indexCss, /@theme\s*\{/))

export const readDarkOverrides = (): TokenMap =>
  parseTokens(extractBlock(indexCss, /\[data-theme='dark'\]\s*\{/))

export const readDarkTokens = (): TokenMap => ({ ...readLightTokens(), ...readDarkOverrides() })

const channelToLinear = (channel: number): number => {
  const c = channel / 255
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
}

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => channelToLinear(parseInt(hex.slice(i, i + 2), 16)))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export const contrastRatio = (foreground: string, background: string): number => {
  const [lighter, darker] = [luminance(foreground), luminance(background)].sort((a, b) => b - a)
  return (lighter + 0.05) / (darker + 0.05)
}
