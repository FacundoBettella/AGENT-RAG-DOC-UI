import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi } from 'vitest'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import AppShell from '../src/components/AppShell/AppShell'
import FaqPage from '../src/pages/FaqPage'

// NOTA: design-system-shell (decisión 11) elimina el Footer global — el
// punto único de navegación a /faq pasa a ser el botón "Ayuda" del header
// nuevo (cubierto por features/design-system-shell.feature @s4). Los
// escenarios que dependían del footer (@s1, @s2, @s3, @s6-footer, @s15,
// @s16, @s17) quedan retirados junto con el componente. El contenido propio
// de FaqPage (preguntas, respuestas, enlace "← Volver al chat") no se tocó
// en esta feature y sigue vigente.

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
  // @s5: ruta /faq renderiza FaqPage con h1
  it('@s5 la ruta "/faq" muestra un h1 con el texto "Preguntas frecuentes"', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByRole('heading', { level: 1, name: /preguntas frecuentes/i })).toBeInTheDocument()
  })

  // @s6 (adaptado): la ruta "/faq" sigue mostrando el shell global (sidebar con "Mercurial")
  it('@s6 la ruta "/faq" muestra el sidebar con "Mercurial"', () => {
    renderAppAtRoute('/faq')
    expect(screen.getByText('Mercurial')).toBeInTheDocument()
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
    const fetchSpy = vi.spyOn(globalThis, 'fetch')
    renderAppAtRoute('/faq')
    expect(fetchSpy).not.toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
