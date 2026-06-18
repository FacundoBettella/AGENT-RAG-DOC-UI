import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
import AppShell from '../src/components/AppShell/AppShell'
import FaqPage from '../src/pages/FaqPage'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn() },
}))

function LocationDisplay() {
  const location = useLocation()
  return <span data-testid="location">{location.pathname}</span>
}

function renderAppAtRoute(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AppShell>
        <Routes>
          <Route path="/" element={<div data-testid="chat-page">Chat</div>} />
          <Route path="/rag" element={<div data-testid="rag-page">RAG</div>} />
          <Route path="/faq" element={<FaqPage />} />
        </Routes>
      </AppShell>
    </MemoryRouter>
  )
}

describe('FaqSection', () => {
  // @s1: footer visible en "/"
  it('@s1 muestra un elemento footer con enlace "Preguntas frecuentes" a "/faq" en la ruta "/"', () => {
    renderAppAtRoute('/')
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /preguntas frecuentes/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/faq')
  })

  // @s2: footer visible en "/rag"
  it('@s2 muestra el footer con enlace "Preguntas frecuentes" a "/faq" en la ruta "/rag"', () => {
    renderAppAtRoute('/rag')
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /preguntas frecuentes/i })
    expect(link).toHaveAttribute('href', '/faq')
  })

  // @s3: footer visible en "/faq"
  it('@s3 muestra el footer con enlace "Preguntas frecuentes" en la ruta "/faq" sin error circular', () => {
    renderAppAtRoute('/faq')
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeInTheDocument()
    const links = screen.getAllByRole('link', { name: /preguntas frecuentes/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
    expect(links[0]).toHaveAttribute('href', '/faq')
  })

  // @s4: navegacion a /faq sin recarga
  it('@s4 hacer clic en "Preguntas frecuentes" cambia la URL a "/faq" sin recarga', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppShell>
          <Routes>
            <Route path="/" element={<div>Chat</div>} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
        </AppShell>
        <LocationDisplay />
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: /preguntas frecuentes/i })
    await userEvent.click(link)
    expect(screen.getByTestId('location')).toHaveTextContent('/faq')
  })

  // @s5: ruta /faq renderiza FaqPage con h1
  it('@s5 la ruta "/faq" muestra un h1 con el texto "Preguntas frecuentes"', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByRole('heading', { level: 1, name: /preguntas frecuentes/i })).toBeInTheDocument()
  })

  // @s6: /faq usa el mismo header y footer
  it('@s6 la ruta "/faq" muestra el header con "Mercurial" y el footer con el enlace', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByText('Mercurial')).toBeInTheDocument()
    expect(screen.getByRole('contentinfo')).toBeInTheDocument()
    const link = screen.getAllByRole('link', { name: /preguntas frecuentes/i })
    expect(link.length).toBeGreaterThanOrEqual(1)
  })

  // @s7: enlace "← Volver al chat" visible en /faq
  it('@s7 la página /faq muestra un enlace "← Volver al chat"', () => {
    renderAppAtRoute('/faq')
    const backLink = screen.getByRole('link', { name: /volver al chat/i })
    expect(backLink).toBeInTheDocument()
  })

  // @s8: "← Volver al chat" navega a /
  it('@s8 hacer clic en "← Volver al chat" cambia la URL a "/"', async () => {
    render(
      <MemoryRouter initialEntries={['/faq']}>
        <AppShell>
          <Routes>
            <Route path="/" element={<div data-testid="chat-page">Chat</div>} />
            <Route path="/faq" element={<FaqPage />} />
          </Routes>
        </AppShell>
        <LocationDisplay />
      </MemoryRouter>
    )
    const backLink = screen.getByRole('link', { name: /volver al chat/i })
    await userEvent.click(backLink)
    expect(screen.getByTestId('location')).toHaveTextContent('/')
  })

  // @s9: las seis preguntas como h2
  it('@s9 la página /faq muestra las seis preguntas como encabezados h2', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByRole('heading', { level: 2, name: /qué tipo de consultas puedo hacer/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /cómo funciona el sistema de búsqueda/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /las respuestas son siempre correctas/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /mis preguntas quedan guardadas/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /quién carga el conocimiento/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /qué pasa si el sistema no sabe la respuesta/i })).toBeInTheDocument()
  })

  // @s10: respuestas visibles sin interacción
  it('@s10 las respuestas a todas las preguntas son visibles sin interacción', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByText(/políticas de licencias/i)).toBeVisible()
    expect(screen.getByText(/RAG \(Retrieval-Augmented Generation\)/i)).toBeVisible()
    expect(screen.getByText(/hace su mejor esfuerzo/i)).toBeVisible()
    expect(screen.getByText(/No se almacena historial en ningún servidor/i)).toBeVisible()
    expect(screen.getByText(/equipo de RR\.HH\. carga documentos/i)).toBeVisible()
    expect(screen.getByText(/no encontró información suficiente/i)).toBeVisible()
  })

  // @s11: respuesta exacta de la pregunta 1
  it('@s11 la respuesta de la pregunta 1 contiene el texto esperado', () => {
    renderAppAtRoute('/faq')
    expect(
      screen.getByText(
        'Podés consultar sobre políticas de licencias, vacaciones, beneficios, ' +
        'procedimientos de incorporación, normativas internas y cualquier duda general de Recursos Humanos.'
      )
    ).toBeInTheDocument()
  })

  // @s12: respuesta de pregunta 2 menciona RAG y lenguaje natural
  it('@s12 la respuesta de la pregunta 2 menciona RAG (Retrieval-Augmented Generation) y lenguaje natural', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByText(/RAG \(Retrieval-Augmented Generation\)/)).toBeInTheDocument()
    expect(screen.getByText(/lenguaje natural/)).toBeInTheDocument()
  })

  // @s13: respuesta de pregunta 4 indica que no hay historial en servidor
  it('@s13 la respuesta de la pregunta 4 indica que no se almacena historial en ningún servidor', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByText(/No se almacena historial en ningún servidor\./)).toBeInTheDocument()
  })

  // @s14: no se llama a fetch
  it('@s14 la página /faq no realiza ninguna llamada de red', () => {
    const fetchSpy = vi.spyOn(global, 'fetch')
    renderAppAtRoute('/faq')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  // @s15: estilos del footer
  it('@s15 el footer tiene los estilos visuales definidos en el spec', () => {
    const sheet = new ServerStyleSheet()
    renderToStaticMarkup(
      sheet.collectStyles(
        <MemoryRouter initialEntries={['/']}>
          <AppShell>
            <div />
          </AppShell>
        </MemoryRouter>
      )
    )
    const css = sheet.getStyleTags()
    sheet.seal()
    expect(css).toMatch(/background\s*:\s*var\(--color-surface\)/)
    expect(css).toMatch(/border-top\s*:\s*1px solid var\(--color-border\)/)
    expect(css).toMatch(/color\s*:\s*var\(--color-text-muted\)/)
    expect(css).toMatch(/font-size\s*:\s*0\.75rem/)
  })

  // @s16: aria-current en el enlace del footer cuando se está en /faq
  it('@s16 el enlace "Preguntas frecuentes" tiene aria-current cuando el usuario está en /faq', () => {
    renderAppAtRoute('/faq')
    const links = screen.getAllByRole('link', { name: /preguntas frecuentes/i })
    // El enlace del footer debe tener aria-current
    const footerLink = links.find(l => l.closest('footer'))
    expect(footerLink).toBeDefined()
    expect(footerLink).toHaveAttribute('aria-current')
  })

  // @s17: layout no rompe en viewport < 320px
  it('@s17 en viewport de 300px el header, contenido FAQ y footer permanecen visibles', () => {
    Object.defineProperty(window, 'innerWidth', { value: 300, writable: true, configurable: true })
    renderAppAtRoute('/faq')
    expect(screen.getByRole('banner')).toBeVisible()
    expect(screen.getByRole('heading', { level: 1 })).toBeVisible()
    const footer = screen.getByRole('contentinfo')
    expect(footer).toBeVisible()
  })
})
