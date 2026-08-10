import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import AppShell from '../src/components/AppShell/AppShell'

// NOTA: el subtítulo inline, el separador "—" y el botón de engranaje que esta
// suite testeaba originalmente fueron retirados por design-system-shell
// (decisión 17: el theme toggle se muda al pie del sidebar, sin menú de
// engranaje). Lo que sigue vigente de header-polish es el enlace de marca
// ("Mercurial" + caduceo, con aria-label "Ir al chat") que ahora vive en el
// sidebar en lugar del header viejo.

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
  // @s1 — el enlace de marca muestra "Mercurial"
  it('muestra "Mercurial" en el enlace de marca', () => {
    renderShell()
    expect(screen.getByText('Mercurial')).toBeInTheDocument()
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
  it('el enlace de marca tiene aria-label "Ir al chat"', () => {
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toHaveAttribute('aria-label', 'Ir al chat')
  })

  // @s4 — navegación desde "/rag"
  it('desde "/rag" hacer clic en el enlace de marca cambia la ruta activa a "/"', async () => {
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
  it('desde "/faq" hacer clic en el enlace de marca cambia la ruta activa a "/"', async () => {
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
  it('desde "/" el enlace de marca sigue apuntando a "/"', () => {
    renderShell('/')
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toHaveAttribute('href', '/')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  // @s7 — sin subrayado (adaptado a Tailwind: clase utilitaria no-underline)
  it('el enlace de marca tiene la clase utilitaria "no-underline"', () => {
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link.className).toContain('no-underline')
  })

  // @s8 — el caduceo forma parte del enlace
  it('el símbolo ⚕ está contenido dentro del enlace', () => {
    renderShell()
    const link = screen.getByRole('link', { name: /ir al chat/i })
    expect(link).toHaveTextContent('⚕')
  })
})
