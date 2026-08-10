import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
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

import { hrService } from '../src/services/hrService'
import { analyticsService } from '../src/services/analyticsService'

const mockedQuery = vi.mocked(hrService.query)
const mockedTrackEvent = vi.mocked(analyticsService.trackEvent)

const GREETING_TEXT =
  '¡Hola! Soy el asistente de Mercurial. Puedo responder consultas sobre RR.HH., ' +
  'tecnología y finanzas a partir de la base de conocimiento cargada. ¿En qué te ayudo?'

beforeEach(() => {
  vi.clearAllMocks()
})

// ──────────────────────────────────────────────
// Escenarios preservados de la versión anterior (mock adaptado a { answer, chunks })
// ──────────────────────────────────────────────

describe('HrChat — foco automático en el textarea al cargar', () => {
  it('el textarea tiene el foco activo al cargar', () => {
    render(<HrChat />)
    expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' })).toHaveFocus()
  })
})

describe('HrChat — Enter envía la pregunta', () => {
  it('muestra el bubble con la pregunta al presionar Enter', async () => {
    mockedQuery.mockResolvedValue({ answer: 'Respuesta OK', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await user.type(textarea, '¿Cuántos días de vacaciones tengo?')
    await user.keyboard('{Enter}')
    expect(screen.getByText('¿Cuántos días de vacaciones tengo?')).toBeInTheDocument()
  })
})

describe('HrChat — input se limpia y deshabilita al enviar', () => {
  it('el textarea queda vacío y deshabilitado después de enviar', async () => {
    mockedQuery.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await user.type(textarea, 'Una pregunta cualquiera')
    await user.keyboard('{Enter}')
    expect(textarea).toHaveValue('')
    expect(textarea).toBeDisabled()
  })
})

describe('HrChat — indicador de pensando mientras la API responde', () => {
  it('muestra "Mercurial está procesando tu consulta" mientras carga', async () => {
    mockedQuery.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Pregunta')
    await user.keyboard('{Enter}')
    expect(screen.getByText('Mercurial está procesando tu consulta')).toBeInTheDocument()
  })
})

describe('HrChat — la respuesta aparece como bubble; indicador desaparece', () => {
  it('muestra la respuesta y el indicador desaparece', async () => {
    mockedQuery.mockResolvedValue({ answer: 'Tenés 15 días hábiles', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.getByText('Tenés 15 días hábiles')).toBeInTheDocument()
    )
    expect(screen.queryByText('Mercurial está procesando tu consulta')).not.toBeInTheDocument()
  })
})

describe('HrChat — input se rehabilita y recupera foco tras respuesta', () => {
  it('el textarea está habilitado y con foco tras recibir respuesta', async () => {
    mockedQuery.mockResolvedValue({ answer: 'Respuesta OK', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Pregunta')
    await user.keyboard('{Enter}')
    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await waitFor(() => expect(textarea).not.toBeDisabled())
    expect(textarea).toHaveFocus()
  })
})

describe('HrChat — Shift+Enter inserta salto de línea, no envía', () => {
  it('agrega salto de línea y no llama a hrService.query', async () => {
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await user.type(textarea, 'Primera línea')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(textarea).toHaveValue('Primera línea\n')
    expect(mockedQuery).not.toHaveBeenCalled()
  })
})

describe('HrChat — no envía si el textarea está vacío', () => {
  it('no llama a hrService.query si el textarea está vacío', async () => {
    const user = userEvent.setup()
    render(<HrChat />)
    await user.keyboard('{Enter}')
    expect(mockedQuery).not.toHaveBeenCalled()
  })
})

describe('HrChat — no envía si el textarea tiene solo espacios', () => {
  it('no llama a hrService.query si el textarea tiene solo espacios', async () => {
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), '   ')
    await user.keyboard('{Enter}')
    expect(mockedQuery).not.toHaveBeenCalled()
  })
})

describe('HrChat — error de API: bubble de error + botón Reintentar', () => {
  it('muestra bubble de error y botón Reintentar tras fallo de la API', async () => {
    mockedQuery.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Pregunta con error')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo obtener respuesta. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    expect(screen.queryByText('Mercurial está procesando tu consulta')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('HrChat — input habilitado tras error', () => {
  it('el textarea está habilitado después de un error de API', async () => {
    mockedQuery.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Pregunta con error')
    await user.keyboard('{Enter}')
    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await waitFor(() => expect(textarea).not.toBeDisabled())
  })
})

describe('HrChat — scroll automático al último mensaje', () => {
  it('llama a scrollIntoView tras recibir respuesta', async () => {
    mockedQuery.mockResolvedValue({ answer: 'Respuesta OK', chunks: [] })
    const scrollMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollMock
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Pregunta para scroll')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(scrollMock).toHaveBeenCalled())
  })
})

describe('HrChat — doble envío imposible mientras carga', () => {
  it('no llama query dos veces si ya hay carga en progreso', async () => {
    mockedQuery.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'Primera pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('textbox', { name: 'Escribe tu pregunta' })).toBeDisabled())
    await user.keyboard('{Enter}')
    expect(mockedQuery).toHaveBeenCalledTimes(1)
  })
})

describe('HrChat — pregunta de 501 caracteres se envía completa', () => {
  it('envía y muestra correctamente una pregunta de 501 caracteres', async () => {
    const longQuestion = 'B'.repeat(501)
    mockedQuery.mockResolvedValue({ answer: 'Respuesta OK', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    fireEvent.change(textarea, { target: { value: longQuestion } })
    await user.keyboard('{Enter}')
    expect(screen.getByText(longQuestion)).toBeInTheDocument()
    await waitFor(() => expect(mockedQuery).toHaveBeenCalledWith(longQuestion))
  })
})

// ──────────────────────────────────────────────
// hr-chat-redesign — contrato de hrService.query — @s1, @s2, @s3
// (blindado además, a nivel de integración con el componente, en HrChat)
// ──────────────────────────────────────────────

describe('HrChat — @s1 el saludo persistente muestra la respuesta traducida de hrService', () => {
  it('renderiza la respuesta de hrService.query cuando resuelve { answer, chunks }', async () => {
    mockedQuery.mockResolvedValue({
      answer: 'Tenés 21 días de vacaciones.',
      chunks: [{ content: 'Política de licencias...', source: 'manual-rrhh.pdf', similarity: 0.87 }],
    })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.getByText('Tenés 21 días de vacaciones.')).toBeInTheDocument()
    )
  })
})

// ──────────────────────────────────────────────
// @s4 — Saludo persistente
// ──────────────────────────────────────────────

describe('HrChat — @s4 el saludo del asistente permanece visible tras enviar una pregunta', () => {
  it('el saludo sigue presente antes y después de enviar la pregunta', async () => {
    mockedQuery.mockResolvedValue({ answer: 'Respuesta OK', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)

    expect(screen.getByText(GREETING_TEXT)).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('Respuesta OK')).toBeInTheDocument())
    expect(screen.getByText(GREETING_TEXT)).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// @s5 — Hora de cada burbuja, 24h es-AR
// ──────────────────────────────────────────────

describe('HrChat — @s5 cada burbuja muestra la hora de creación en formato 24h es-AR', () => {
  it('la burbuja de la pregunta y la de la respuesta muestran la hora "09:05"', async () => {
    const user = userEvent.setup()
    render(<HrChat />)

    // El saludo ya capturó su hora real al montar; recién ahora fijamos el reloj
    // para que la pregunta y la respuesta del intercambio tomen "09:05".
    const fixedDate = new Date('2026-08-09T09:05:00')
    const realDateNow = Date.now.bind(Date)
    vi.spyOn(Date, 'now').mockReturnValue(fixedDate.getTime())

    mockedQuery.mockResolvedValue({ answer: 'Respuesta con hora', chunks: [] })

    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('Respuesta con hora')).toBeInTheDocument())

    expect(screen.getByText('Tú · 09:05')).toBeInTheDocument()
    expect(screen.getByText('Asistente Mercurial · 09:05')).toBeInTheDocument()

    vi.spyOn(Date, 'now').mockImplementation(realDateNow)
  })
})

// ──────────────────────────────────────────────
// @s6 y @s7 — Error y reintento
// ──────────────────────────────────────────────

describe('HrChat — @s6 un error de la API muestra el bubble de error con Reintentar', () => {
  it('muestra el texto de error y el botón Reintentar', async () => {
    mockedQuery.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo obtener respuesta. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
  })
})

describe('HrChat — @s7 Reintentar reenvía la última pregunta que falló', () => {
  it('llama a hrService.query con la última pregunta al hacer clic en Reintentar', async () => {
    mockedQuery
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce({ answer: 'Respuesta en el reintento', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(
      screen.getByRole('textbox', { name: 'Escribe tu pregunta' }),
      '¿Cuántos días de vacaciones tengo?'
    )
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(mockedQuery).toHaveBeenCalledWith('¿Cuántos días de vacaciones tengo?')
    expect(mockedQuery).toHaveBeenCalledTimes(2)
  })
})

// ──────────────────────────────────────────────
// @s8, @s9 — Panel «Fuentes de la respuesta»: tarjetas y clamp de similarity
// ──────────────────────────────────────────────

describe('HrChat — @s8 el panel muestra una tarjeta por cada chunk, con la fuente tal cual llega', () => {
  it('muestra tarjetas con título "manual-rrhh.pdf", "api" y "Base de conocimiento"', async () => {
    mockedQuery.mockResolvedValue({
      answer: 'Respuesta con fuentes',
      chunks: [
        { content: 'contenido 1', source: 'manual-rrhh.pdf', similarity: 0.5 },
        { content: 'contenido 2', source: 'api', similarity: 0.5 },
        { content: 'contenido 3', source: '', similarity: 0.5 },
      ],
    })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('manual-rrhh.pdf')).toBeInTheDocument())
    expect(screen.getByText('api')).toBeInTheDocument()
    expect(screen.getByText('Base de conocimiento')).toBeInTheDocument()
  })
})

describe('HrChat — @s9 el porcentaje de coincidencia se clampea a [0, 100]', () => {
  it('muestra "100% de coincidencia" y "0% de coincidencia" para valores fuera de rango', async () => {
    mockedQuery.mockResolvedValue({
      answer: 'Respuesta con fuentes',
      chunks: [
        { content: 'contenido alto', source: 'doc-a', similarity: 1.2 },
        { content: 'contenido bajo', source: 'doc-b', similarity: -0.3 },
      ],
    })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('100% de coincidencia')).toBeInTheDocument())
    expect(screen.getByText('0% de coincidencia')).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// @s10, @s11, @s12 — Estados del panel de fuentes
// ──────────────────────────────────────────────

describe('HrChat — @s10 antes de la primera respuesta, el panel muestra su estado inicial', () => {
  it('muestra "Los fragmentos que respalden la respuesta aparecerán acá."', () => {
    render(<HrChat />)
    expect(
      screen.getByText('Los fragmentos que respalden la respuesta aparecerán acá.')
    ).toBeInTheDocument()
  })
})

describe('HrChat — @s11 cuando la última respuesta no citó fragmentos, el panel muestra su estado sin fuentes', () => {
  it('muestra "Esta respuesta no citó fragmentos de la base de conocimiento."', async () => {
    mockedQuery.mockResolvedValue({ answer: 'Respuesta sin fuentes', chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')

    await waitFor(() =>
      expect(
        screen.getByText('Esta respuesta no citó fragmentos de la base de conocimiento.')
      ).toBeInTheDocument()
    )
  })
})

describe('HrChat — @s12 durante la carga de una nueva pregunta, el panel conserva las fuentes del intercambio anterior', () => {
  it('sigue mostrando las tarjetas de fuentes del intercambio anterior mientras carga la nueva', async () => {
    mockedQuery.mockResolvedValueOnce({
      answer: 'Primera respuesta',
      chunks: [{ content: 'contenido previo', source: 'doc-previo.pdf', similarity: 0.6 }],
    })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'primera pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByText('doc-previo.pdf')).toBeInTheDocument())

    mockedQuery.mockReturnValueOnce(new Promise(() => undefined))
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'segunda pregunta')
    await user.keyboard('{Enter}')

    expect(screen.getByText('doc-previo.pdf')).toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// @s13, @s14 — Panel «Consultas sugeridas»
// ──────────────────────────────────────────────

describe('HrChat — @s13 al hacer clic en una sugerencia, el texto se carga en el input y recibe foco sin enviarse', () => {
  it('carga el texto de la sugerencia "Política de vacaciones" en el textarea, foco y sin llamar a query', async () => {
    const user = userEvent.setup()
    render(<HrChat />)

    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await user.click(screen.getByRole('button', { name: 'Política de vacaciones' }))

    expect(textarea).toHaveValue('¿Cómo funciona la política de vacaciones?')
    expect(textarea).toHaveFocus()
    expect(mockedQuery).not.toHaveBeenCalled()
  })
})

describe('HrChat — @s14 al hacer clic en una sugerencia se registra el evento chat_suggestion_clicked', () => {
  it('llama a analyticsService.trackEvent con el payload correcto', async () => {
    const user = userEvent.setup()
    render(<HrChat />)

    await user.click(screen.getByRole('button', { name: 'Soporte técnico' }))

    expect(mockedTrackEvent).toHaveBeenCalledWith('chat_suggestion_clicked', {
      suggestion: '¿Cómo pido soporte técnico o un equipo nuevo?',
    })
  })
})

// ──────────────────────────────────────────────
// Reescritura de @s16 (SSR/ServerStyleSheet ya no aplica sin styled-components)
// ──────────────────────────────────────────────

describe('HrChat — respuesta larga no desborda el bubble', () => {
  it('la burbuja de mensaje usa whitespace-pre-wrap y break-words', async () => {
    mockedQuery.mockResolvedValue({ answer: 'a'.repeat(1000), chunks: [] })
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox', { name: 'Escribe tu pregunta' }), 'pregunta')
    await user.keyboard('{Enter}')

    await waitFor(() => expect(screen.getByText('a'.repeat(1000))).toBeInTheDocument())
    const bubble = screen.getByText('a'.repeat(1000))
    expect(bubble.className).toContain('whitespace-pre-wrap')
    expect(bubble.className).toContain('break-words')
  })
})

// ──────────────────────────────────────────────
// Bubble de pregunta en vuelo durante la carga
// ──────────────────────────────────────────────

describe('HrChat — bubble de pregunta visible durante la carga', () => {
  it('el texto de la pregunta aparece como bubble mientras la API responde', async () => {
    const user = userEvent.setup()
    mockedQuery.mockReturnValueOnce(new Promise(() => {}))

    render(<HrChat />)

    const textarea = screen.getByRole('textbox', { name: 'Escribe tu pregunta' })
    await user.type(textarea, '¿Cuántos días de vacaciones tengo?')
    await user.keyboard('{Enter}')

    expect(screen.getByText('¿Cuántos días de vacaciones tengo?')).toBeInTheDocument()
    expect(textarea).toBeDisabled()
  })
})
