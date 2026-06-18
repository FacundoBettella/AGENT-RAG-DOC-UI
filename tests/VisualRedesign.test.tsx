import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../src/App'
import AppShell from '../src/components/AppShell/AppShell'

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

describe('VisualRedesign — @s1 Engranaje abre el menú desplegable', () => {
  it('el menú desplegable es visible tras hacer clic en el ícono de engranaje', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
    await user.click(gear)
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })
})

describe('VisualRedesign — @s2 Engranaje cierra el menú desplegable', () => {
  it('el menú desplegable desaparece al hacer clic de nuevo en el engranaje', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    await user.click(gear)
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(gear)
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('VisualRedesign — @s3 El menú contiene un control de tema', () => {
  it('el menú contiene un control con rol switch o botón de tema', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    await user.click(gear)
    const menu = screen.getByRole('menu')
    const switchEl = within(menu).queryByRole('switch')
    const themeBtn = within(menu).queryByRole('button', { name: /tema/i })
    expect(switchEl ?? themeBtn).toBeTruthy()
  })
})

describe('VisualRedesign — @s4 El menú contiene enlace a /rag', () => {
  it('el menú contiene un enlace con destino "/rag"', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    await user.click(gear)
    const link = screen.getByRole('link', { name: /rag/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/rag')
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

  it('aplica data-theme="light" al activar el tema claro', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    await user.click(gear)
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

  it('aplica data-theme="dark" al activar el tema oscuro', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    await user.click(gear)
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

  it('localStorage contiene la clave de tema con valor "light" tras activar tema claro', async () => {
    const user = userEvent.setup()
    renderApp()
    const gear = screen.getByRole('button', { name: /configuración/i })
    await user.click(gear)
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

describe('VisualRedesign — @s10 Caduceo visible en el header', () => {
  it('existe un elemento con aria-label "Caduceo de Hermes" en el header', () => {
    renderApp()
    const caduceo = screen.getByLabelText('Caduceo de Hermes')
    expect(caduceo).toBeInTheDocument()
    const header = screen.getByRole('banner')
    expect(header).toContainElement(caduceo)
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
