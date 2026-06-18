import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { ServerStyleSheet } from 'styled-components'
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

const mockedQuery = vi.mocked(hrService.query)

beforeEach(() => {
  vi.clearAllMocks()
})

describe('HrChat — @s1 Estado inicial muestra mensaje de bienvenida', () => {
  it('muestra "¿En qué puedo ayudarte hoy?" cuando el historial está vacío', () => {
    render(<HrChat />)
    expect(
      screen.getByText('¿En qué puedo ayudarte hoy?')
    ).toBeInTheDocument()
  })
})

describe('HrChat — @s2 Foco automático en el textarea al cargar', () => {
  it('el textarea tiene el foco activo al cargar', () => {
    render(<HrChat />)
    expect(screen.getByRole('textbox')).toHaveFocus()
  })
})

describe('HrChat — @s3 Enter envía → bubble de usuario a la derecha', () => {
  it('muestra el bubble con la pregunta al presionar Enter', async () => {
    mockedQuery.mockResolvedValue('Respuesta OK')
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, '¿Cuántos días de vacaciones tengo?')
    await user.keyboard('{Enter}')
    expect(
      screen.getByText('¿Cuántos días de vacaciones tengo?')
    ).toBeInTheDocument()
  })
})

describe('HrChat — @s4 Input se limpia y deshabilita al enviar', () => {
  it('el textarea queda vacío y deshabilitado después de enviar', async () => {
    // Use a never-resolving promise so the disabled state persists during assertions
    mockedQuery.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Una pregunta cualquiera')
    await user.keyboard('{Enter}')
    expect(textarea).toHaveValue('')
    expect(textarea).toBeDisabled()
  })
})

describe('HrChat — @s5 Indicador de pensando mientras la API responde', () => {
  it('muestra "Mercurial está procesando tu consulta" mientras carga', async () => {
    mockedQuery.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Pregunta')
    await user.keyboard('{Enter}')
    expect(
      screen.getByText('Mercurial está procesando tu consulta')
    ).toBeInTheDocument()
  })
})

describe('HrChat — @s6 La respuesta aparece como bubble; indicador desaparece', () => {
  it('muestra la respuesta a la izquierda y el indicador desaparece', async () => {
    mockedQuery.mockResolvedValue('Tenés 15 días hábiles')
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.getByText('Tenés 15 días hábiles')).toBeInTheDocument()
    )
    expect(
      screen.queryByText('Mercurial está procesando tu consulta')
    ).not.toBeInTheDocument()
  })
})

describe('HrChat — @s7 Input se rehabilita y recupera foco tras respuesta', () => {
  it('el textarea está habilitado y con foco tras recibir respuesta', async () => {
    mockedQuery.mockResolvedValue('Respuesta OK')
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Pregunta')
    await user.keyboard('{Enter}')
    const textarea = screen.getByRole('textbox')
    await waitFor(() => expect(textarea).not.toBeDisabled())
    expect(textarea).toHaveFocus()
  })
})

describe('HrChat — @s8 Shift+Enter inserta salto de línea, no envía', () => {
  it('agrega salto de línea y no envía ningún bubble', async () => {
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox')
    await user.type(textarea, 'Primera línea')
    await user.keyboard('{Shift>}{Enter}{/Shift}')
    expect(textarea).toHaveValue('Primera línea\n')
    expect(mockedQuery).not.toHaveBeenCalled()
  })
})

describe('HrChat — @s9 No envía si textarea vacío', () => {
  it('no agrega bubble ni llama a hrService.query si el textarea está vacío', async () => {
    const user = userEvent.setup()
    render(<HrChat />)
    await user.keyboard('{Enter}')
    expect(mockedQuery).not.toHaveBeenCalled()
    expect(
      screen.queryByText('¿En qué puedo ayudarte hoy?')
    ).toBeInTheDocument()
  })
})

describe('HrChat — @s10 No envía si solo espacios', () => {
  it('no agrega bubble ni llama a hrService.query si el textarea tiene solo espacios', async () => {
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), '   ')
    await user.keyboard('{Enter}')
    expect(mockedQuery).not.toHaveBeenCalled()
  })
})

describe('HrChat — @s11 Error de API: bubble de error + botón Reintentar', () => {
  it('muestra bubble de error y botón Reintentar tras fallo de la API', async () => {
    mockedQuery.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Pregunta con error')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(
        screen.getByText('No se pudo obtener respuesta. Intentá de nuevo.')
      ).toBeInTheDocument()
    )
    expect(
      screen.queryByText('Mercurial está procesando tu consulta')
    ).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Reintentar' })
    ).toBeInTheDocument()
  })
})

describe('HrChat — @s12 Input habilitado tras error', () => {
  it('el textarea está habilitado después de un error de API', async () => {
    mockedQuery.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Pregunta con error')
    await user.keyboard('{Enter}')
    const textarea = screen.getByRole('textbox')
    await waitFor(() => expect(textarea).not.toBeDisabled())
  })
})

describe('HrChat — @s13 Reintentar reenvía la última pregunta', () => {
  it('llama a hrService.query con la última pregunta al hacer clic en Reintentar', async () => {
    mockedQuery
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('Respuesta en el reintento')
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(
      screen.getByRole('textbox'),
      '¿Cuántos días de vacaciones tengo?'
    )
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Reintentar' })
      ).toBeInTheDocument()
    )
    await user.click(screen.getByRole('button', { name: 'Reintentar' }))
    expect(mockedQuery).toHaveBeenCalledWith(
      '¿Cuántos días de vacaciones tengo?'
    )
    expect(mockedQuery).toHaveBeenCalledTimes(2)
  })
})

describe('HrChat — @s14 Scroll automático al último mensaje', () => {
  it('llama a scrollIntoView en el último elemento tras recibir respuesta', async () => {
    mockedQuery.mockResolvedValue('Respuesta OK')
    const scrollMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollMock
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Pregunta para scroll')
    await user.keyboard('{Enter}')
    await waitFor(() => expect(scrollMock).toHaveBeenCalled())
  })
})

describe('HrChat — @s15 Doble envío imposible mientras carga', () => {
  it('no agrega segundo bubble ni llama query dos veces si ya hay carga en progreso', async () => {
    mockedQuery.mockReturnValue(new Promise(() => undefined))
    const user = userEvent.setup()
    render(<HrChat />)
    await user.type(screen.getByRole('textbox'), 'Primera pregunta')
    await user.keyboard('{Enter}')
    await waitFor(() =>
      expect(screen.getByRole('textbox')).toBeDisabled()
    )
    // The textarea is disabled, so Enter does nothing — query called only once
    await user.keyboard('{Enter}')
    expect(mockedQuery).toHaveBeenCalledTimes(1)
  })
})

describe('HrChat — @s16 Respuesta larga no desborda el bubble — overflow-wrap configurado', () => {
  it('el bubble de MessageBubble tiene overflow-wrap:break-word en su CSS generado', async () => {
    // Importamos MessageBubble directamente para forzar su renderizado en SSR
    // y verificar que el CSS contiene overflow-wrap:break-word
    const { MessageBubble } = await import('../src/features/HrChat/HrChat.styles')
    const sheet = new ServerStyleSheet()
    renderToStaticMarkup(
      sheet.collectStyles(
        <MessageBubble $variant="assistant">{'a'.repeat(1000)}</MessageBubble>
      )
    )
    const styleTags = sheet.getStyleTags()
    sheet.seal()
    expect(styleTags).toMatch(/overflow-wrap\s*:\s*break-word/)
  })
})

describe('HrChat — @s17 Pregunta de 501 chars se envía completa', () => {
  it('envía y muestra correctamente una pregunta de 501 caracteres', async () => {
    const longQuestion = 'B'.repeat(501)
    mockedQuery.mockResolvedValue('Respuesta OK')
    const user = userEvent.setup()
    render(<HrChat />)
    const textarea = screen.getByRole('textbox')
    // Use fireEvent.change to avoid the ~50s delay of typing 501 chars one by one
    fireEvent.change(textarea, { target: { value: longQuestion } })
    await user.keyboard('{Enter}')
    expect(screen.getByText(longQuestion)).toBeInTheDocument()
    await waitFor(() =>
      expect(mockedQuery).toHaveBeenCalledWith(longQuestion)
    )
  })
})

describe('HrChat — @s18 WelcomeMessage desaparece al enviar una pregunta', () => {
  it('el mensaje de bienvenida desaparece cuando se envía una pregunta', async () => {
    const user = userEvent.setup()

    // Hacer que la promesa quede pendiente para observar estado intermedio
    let resolveFn!: (val: string) => void
    mockedQuery.mockReturnValueOnce(new Promise(resolve => { resolveFn = resolve }))

    render(<HrChat />)

    // Inicialmente visible
    expect(screen.getByText('¿En qué puedo ayudarte hoy?')).toBeInTheDocument()

    // Enviar pregunta
    await user.type(screen.getByRole('textbox', { name: /escribe tu pregunta/i }), 'pregunta')
    await user.keyboard('{Enter}')

    // Inmediatamente después de enviar: NO debe estar visible
    expect(screen.queryByText('¿En qué puedo ayudarte hoy?')).not.toBeInTheDocument()

    // Resolver la promesa para limpiar el estado asíncrono
    await act(async () => { resolveFn('respuesta') })

    // Tras recibir respuesta: sigue sin verse el WelcomeMessage
    expect(screen.queryByText('¿En qué puedo ayudarte hoy?')).not.toBeInTheDocument()
  })
})

describe('HrChat — @s19 Bubble de pregunta visible durante la carga', () => {
  it('el texto de la pregunta aparece como bubble mientras la API responde', async () => {
    const user = userEvent.setup()
    // Promesa que nunca resuelve: mantiene isLoading=true y pendingQuestion durante toda la aserción
    mockedQuery.mockReturnValueOnce(new Promise(() => {}))

    render(<HrChat />)

    const textarea = screen.getByRole('textbox', { name: /escribe tu pregunta/i })
    await user.type(textarea, '¿Cuántos días de vacaciones tengo?')
    await user.keyboard('{Enter}')

    // Durante la carga: el bubble de pendingQuestion debe estar en el DOM
    expect(
      screen.getByText('¿Cuántos días de vacaciones tengo?')
    ).toBeInTheDocument()

    // Confirma que sigue en estado de carga (input deshabilitado)
    expect(textarea).toBeDisabled()
  })
})
