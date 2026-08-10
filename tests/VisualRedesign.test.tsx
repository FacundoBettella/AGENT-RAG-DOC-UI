import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'

// NOTA: design-system-shell (decisión 17) retiró el menú de engranaje —
// el theme toggle ya no vive detrás de un dropdown, sino directo en el pie
// del sidebar. Los escenarios @s1, @s2 y @s4 de esta suite testeaban ese
// menú (abrir/cerrar, enlace a /rag dentro del menú) y quedaron sin objeto:
// /rag ahora es un item de navegación de primer nivel del sidebar (cubierto
// por features/design-system-shell.feature @s1) y no hay menú que abrir o
// cerrar. Los escenarios de persistencia/restauración de tema (@s5-@s9) y
// de ruteo (@s10-@s12) siguen vigentes, adaptados a la nueva ubicación del
// control.

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

function renderApp(initialRoute = '/') {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <App />
    </MemoryRouter>
  )
}

describe('VisualRedesign — @s3 El sidebar contiene un control de tema', () => {
  it('el pie del sidebar contiene un control con rol switch', () => {
    renderApp()
    expect(screen.getByRole('switch')).toBeInTheDocument()
  })
})

describe('VisualRedesign — @s5 Activar tema light aplica data-theme="light"', () => {
  beforeEach(() => {
    localStorage.setItem(THEME_KEY, 'dark')
    document.documentElement.setAttribute('data-theme', 'dark')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('aplica data-theme="light" al activar el tema claro', () => {
    renderApp()
    const themeSwitch = screen.getByRole('switch')
    // Current theme is dark — clicking switch should activate light
    fireEvent.click(themeSwitch)
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

describe('VisualRedesign — @s6 Activar tema dark aplica data-theme="dark"', () => {
  beforeEach(() => {
    localStorage.setItem(THEME_KEY, 'light')
    document.documentElement.setAttribute('data-theme', 'light')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('aplica data-theme="dark" al activar el tema oscuro', () => {
    renderApp()
    const themeSwitch = screen.getByRole('switch')
    // Current theme is light — clicking switch should activate dark
    fireEvent.click(themeSwitch)
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

describe('VisualRedesign — @s7 Cambiar tema persiste en localStorage', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('localStorage contiene la clave de tema con valor "light" tras activar tema claro', () => {
    renderApp()
    const themeSwitch = screen.getByRole('switch')
    // Default is dark, click to go light
    fireEvent.click(themeSwitch)
    expect(localStorage.getItem(THEME_KEY)).toBe('light')
  })
})

describe('VisualRedesign — @s8 Tema se restaura desde localStorage', () => {
  beforeEach(() => {
    localStorage.setItem(THEME_KEY, 'light')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('el atributo data-theme es "light" al montar si localStorage tiene "light"', () => {
    renderApp()
    expect(document.documentElement.getAttribute('data-theme')).toBe('light')
  })
})

describe('VisualRedesign — @s9 Tema por defecto es "dark"', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })
  afterEach(() => {
    localStorage.clear()
    document.documentElement.removeAttribute('data-theme')
  })

  it('el atributo data-theme es "dark" cuando localStorage está vacío', () => {
    renderApp()
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark')
  })
})

describe('VisualRedesign — @s10 Caduceo visible en el sidebar', () => {
  it('existe un elemento con aria-label "Caduceo de Hermes" dentro del sidebar', () => {
    renderApp()
    const caduceo = screen.getByLabelText('Caduceo de Hermes')
    expect(caduceo).toBeInTheDocument()
    const sidebar = screen.getByRole('navigation', { name: /navegación principal/i })
    expect(sidebar).toContainElement(caduceo)
  })
})

describe('VisualRedesign — @s11 Ruta "/" renderiza HrChat', () => {
  it('la ruta "/" muestra el componente de chat de Recursos Humanos', () => {
    renderApp('/')
    expect(screen.getByTestId('hr-chat')).toBeInTheDocument()
  })
})

describe('VisualRedesign — @s12 Ruta "/rag" renderiza RagPage', () => {
  it('la ruta "/rag" muestra la pantalla RAG', () => {
    renderApp('/rag')
    expect(screen.getByRole('heading', { name: /carga de conocimiento rag/i })).toBeInTheDocument()
  })
})
