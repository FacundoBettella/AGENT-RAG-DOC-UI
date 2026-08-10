import { render, screen, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, useLocation } from 'react-router-dom'
import App from '../src/App'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn() },
}))

vi.mock('../src/services/ragService', () => ({
  ragService: { upload: vi.fn() },
}))

const THEME_KEY = 'mercurial-theme'

function LocationDisplay() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('design-system-shell — @s1 El sidebar ofrece los cuatro destinos en el orden acordado', () => {
  it('muestra, en orden, los enlaces Chatbot IA, Analizador de Contratos, Base de conocimiento y Configuración', () => {
    renderApp()
    const sidebar = screen.getByRole('navigation', { name: /navegación principal/i })
    const links = within(sidebar).getAllByRole('link')
    // El primer enlace del sidebar es la marca ("Ir al chat"); el resto son la navegación.
    const navLinks = links.filter((link) => link.getAttribute('aria-label') !== 'Ir al chat')

    expect(navLinks).toHaveLength(4)

    expect(navLinks[0]).toHaveTextContent('Chatbot IA')
    expect(navLinks[0]).toHaveAttribute('href', '/')

    expect(navLinks[1]).toHaveTextContent('Analizador de Contratos')
    expect(navLinks[1]).toHaveAttribute('href', '/contracts')

    expect(navLinks[2]).toHaveTextContent('Base de conocimiento')
    expect(navLinks[2]).toHaveAttribute('href', '/rag')

    expect(navLinks[3]).toHaveTextContent('Configuración')
    expect(navLinks[3]).toHaveAttribute('href', '/settings')
  })
})

describe('design-system-shell — @s2 Los destinos de las features futuras muestran "Próximamente"', () => {
  it('la ruta "/contracts" muestra el texto "Próximamente"', () => {
    renderApp('/contracts')
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })

  it('la ruta "/settings" muestra el texto "Próximamente"', () => {
    renderApp('/settings')
    expect(screen.getByText('Próximamente')).toBeInTheDocument()
  })
})

describe('design-system-shell — @s3 El item de navegación activo se resalta y el resto no', () => {
  it('el enlace "Base de conocimiento" tiene aria-current="page" y los otros tres no tienen aria-current', () => {
    renderApp('/rag')
    const sidebar = screen.getByRole('navigation', { name: /navegación principal/i })

    const activeLink = within(sidebar).getByRole('link', { name: /base de conocimiento/i })
    expect(activeLink).toHaveAttribute('aria-current', 'page')

    const chatLink = within(sidebar).getByRole('link', { name: /chatbot ia/i })
    const contractsLink = within(sidebar).getByRole('link', { name: /analizador de contratos/i })
    const settingsLink = within(sidebar).getByRole('link', { name: /configuración/i })

    expect(chatLink).not.toHaveAttribute('aria-current')
    expect(contractsLink).not.toHaveAttribute('aria-current')
    expect(settingsLink).not.toHaveAttribute('aria-current')
  })
})

describe('design-system-shell — @s4 El botón "Ayuda" del header navega a /faq', () => {
  it('hacer clic en "Ayuda" cambia la ruta activa a "/faq" sin recargar la página', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
        <LocationDisplay />
      </MemoryRouter>
    )

    // Referencia estable al sidebar: si hubiera una recarga completa de página,
    // el árbol de React se desmontaría y esta referencia dejaría de estar en el documento.
    const sidebarBeforeClick = screen.getByRole('navigation', { name: /navegación principal/i })

    const helpButton = screen.getByRole('button', { name: /ayuda/i })
    await userEvent.click(helpButton)

    expect(screen.getByTestId('location')).toHaveTextContent('/faq')
    expect(document.body.contains(sidebarBeforeClick)).toBe(true)
  })
})

describe('design-system-shell — @s5 El toggle de tema en el pie del sidebar cambia el tema y lo persiste', () => {
  it('activar el switch de tema aplica data-theme="light" y lo persiste en localStorage', () => {
    localStorage.setItem(THEME_KEY, 'dark')
    document.documentElement.setAttribute('data-theme', 'dark')

    renderApp()
    const themeSwitch = screen.getByRole('switch', { name: /cambiar tema/i })
    fireEvent.click(themeSwitch)

    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
    expect(localStorage.getItem(THEME_KEY)).toBe('light')

    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
})

describe('design-system-shell — @s6 La landing muestra el chat y no los elementos excluidos del alcance', () => {
  it('muestra el chat de RR.HH., sin footer, sin "Historial" y sin buscar/notificaciones/título en el header', () => {
    renderApp('/')

    expect(screen.getByTestId('hr-chat')).toBeInTheDocument()
    expect(document.querySelector('footer')).toBeNull()

    const sidebar = screen.getByRole('navigation', { name: /navegación principal/i })
    expect(within(sidebar).queryByRole('link', { name: /historial/i })).toBeNull()

    const header = screen.getByRole('banner')
    expect(within(header).queryByRole('button', { name: /buscar/i })).toBeNull()
    expect(within(header).queryByRole('button', { name: /notificaciones/i })).toBeNull()
    expect(within(header).queryAllByRole('heading')).toHaveLength(0)
  })
})
