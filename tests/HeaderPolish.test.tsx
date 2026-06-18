import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
import AppShell from '../src/components/AppShell/AppShell'

function LocationDisplay() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn() },
}))

function renderShell(initialPath = '/') {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <AppShell>
        <div data-testid="child" />
      </AppShell>
    </MemoryRouter>
  )
}

describe('Header Polish', () => {
  // @s1 — título y subtítulo inline en una sola línea
  it('muestra "Mercurial", el separador "—" y "Consultas de RR.HH." en el header', () => {
    renderShell()
    expect(screen.getByText('Mercurial')).toBeInTheDocument()
    expect(screen.getByText(/Consultas de RR\.HH\./)).toBeInTheDocument()
    expect(screen.getByText(/—/)).toBeInTheDocument()
  })

  // @s2 — el título es un enlace a "/"
  it('existe un enlace con href "/" que contiene el texto "Mercurial"', () => {
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/')
    expect(link).toHaveTextContent('Mercurial')
  })

  // @s3 — aria-label accesible
  it('el enlace del header tiene aria-label "Ir al chat"', () => {
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toHaveAttribute('aria-label', 'Ir al chat')
  })

  // @s4 — navegación desde "/rag"
  it('desde "/rag" hacer clic en el enlace del header cambia la ruta activa a "/"', async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/rag']}>
        <AppShell>
          <div data-testid="child" />
        </AppShell>
        <LocationDisplay />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /ir al chat/i })
    await userEvent.click(link)
    expect(getByTestId('location')).toHaveTextContent('/')
  })

  // @s5 — navegación desde "/faq"
  it('desde "/faq" hacer clic en el enlace del header cambia la ruta activa a "/"', async () => {
    const { getByTestId } = render(
      <MemoryRouter initialEntries={['/faq']}>
        <AppShell>
          <div data-testid="child" />
        </AppShell>
        <LocationDisplay />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /ir al chat/i })
    await userEvent.click(link)
    expect(getByTestId('location')).toHaveTextContent('/')
  })

  // @s6 — clic en "/" no produce error
  it('desde "/" el enlace del header sigue apuntando a "/"', () => {
    renderShell('/')
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toHaveAttribute('href', '/')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  // @s7 — sin text-decoration
  it('el enlace del header tiene text-decoration: none en su estilo', () => {
    const sheet = new ServerStyleSheet()
    renderToStaticMarkup(
      sheet.collectStyles(
        <MemoryRouter>
          <AppShell>
            <div />
          </AppShell>
        </MemoryRouter>
      )
    )
    const css = sheet.getStyleTags()
    sheet.seal()
    expect(css).toMatch(/text-decoration\s*:\s*none/)
  })

  // @s8 — el caduceo forma parte del enlace
  it('el símbolo ⚕ está contenido dentro del enlace', () => {
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toHaveTextContent('⚕')
  })

  // @s9 — GearButton fuera del enlace
  it('el botón de configuración ⚙ existe y NO está dentro del enlace', () => {
    renderShell()
    const gearBtn = screen.getByRole('button', { name: /configuración/i })
    expect(gearBtn).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).not.toContainElement(gearBtn)
  })

  // @s10 — viewport 320px
  it('en viewport de 320px el enlace del header sigue presente y no hay desbordamiento', () => {
    Object.defineProperty(window, 'innerWidth', {
      value: 320,
      writable: true,
      configurable: true,
    })
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toBeInTheDocument()
    expect(link).toBeVisible()
    const header = document.querySelector('header')
    expect(header?.scrollWidth).toBeLessThanOrEqual(320)
  })
})
