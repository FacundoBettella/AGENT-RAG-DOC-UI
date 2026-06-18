import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
import { MemoryRouter } from 'react-router-dom'
import AppShell from '../src/components/AppShell/AppShell'
import HrChat from '../src/features/HrChat/HrChat'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn() },
}))

function renderShellWithRouter() {
  return render(
    <MemoryRouter>
      <AppShell><HrChat /></AppShell>
    </MemoryRouter>
  )
}

describe('AppShell', () => {
  // @s1
  it('muestra el texto "Mercurial" en el header', () => {
    renderShellWithRouter()
    expect(screen.getByText('Mercurial')).toBeInTheDocument()
  })

  // @s2 — subtítulo ahora inline como "Consultas de RR.HH."
  it('muestra el subtítulo "Consultas de RR.HH." inline', () => {
    renderShellWithRouter()
    expect(screen.getByText(/Consultas de RR\.HH\./)).toBeInTheDocument()
  })

  // @s3 — verifica min-height:100dvh vía ServerStyleSheet
  it('el contenedor raíz tiene min-height con "100dvh"', () => {
    const sheet = new ServerStyleSheet()
    renderToStaticMarkup(
      sheet.collectStyles(
        <MemoryRouter>
          <AppShell><HrChat /></AppShell>
        </MemoryRouter>
      )
    )
    const styleTags = sheet.getStyleTags()
    sheet.seal()
    expect(styleTags).toMatch(/min-height\s*:\s*100dvh/)
  })

  // @s3b — verifica flex-direction:column vía ServerStyleSheet
  it('el wrapper usa flex-direction column', () => {
    const sheet = new ServerStyleSheet()
    renderToStaticMarkup(
      sheet.collectStyles(
        <MemoryRouter>
          <AppShell><HrChat /></AppShell>
        </MemoryRouter>
      )
    )
    const styleTags = sheet.getStyleTags()
    sheet.seal()
    expect(styleTags).toMatch(/flex-direction\s*:\s*column/)
  })

  // @s4 — query por rol accesible
  it('existe un elemento <header> visible en el documento', () => {
    renderShellWithRouter()
    const header = screen.getByRole('banner')
    expect(header).toBeInTheDocument()
    expect(header).toBeVisible()
  })

  // @s5 — query por rol accesible; children pasados como prop
  it('el elemento <main> contiene el componente HrChat', () => {
    renderShellWithRouter()
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
    const hrChat = screen.getByTestId('hr-chat')
    expect(main).toContainElement(hrChat)
  })

  // @s6
  // styled-components v6 usa constructable stylesheets en el browser; en jsdom no inyecta
  // <style> tags vía DOM. Usamos ServerStyleSheet + renderToStaticMarkup para capturar
  // el CSS generado y verificar que los tokens están presentes.
  it('el documento contiene las variables CSS --color-bg y --color-gold', () => {
    const sheet = new ServerStyleSheet()
    renderToStaticMarkup(
      sheet.collectStyles(
        <MemoryRouter>
          <AppShell><HrChat /></AppShell>
        </MemoryRouter>
      )
    )
    const styleTags = sheet.getStyleTags()
    sheet.seal()
    expect(styleTags).toContain('--color-bg')
    expect(styleTags).toContain('--color-gold')
  })

  // @s7
  it('header y main siguen accesibles con viewport de 300px', () => {
    Object.defineProperty(window, 'innerWidth', { value: 300, writable: true, configurable: true })
    renderShellWithRouter()
    const header = screen.getByRole('banner')
    const main = screen.getByRole('main')
    expect(header).toBeInTheDocument()
    expect(header).toBeVisible()
    expect(main).toBeInTheDocument()
    expect(main).toBeVisible()
  })
})
