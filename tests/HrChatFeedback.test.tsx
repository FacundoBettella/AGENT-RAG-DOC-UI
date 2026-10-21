import { act, render, renderHook, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { UserEvent } from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import HrChat from '../src/features/HrChat/HrChat'
import { useHrChat } from '../src/hooks/useHrChat'

vi.mock('react-ga4', () => ({
  default: { initialize: vi.fn(), event: vi.fn() },
}))

vi.mock('../src/services/analyticsService', () => ({
  analyticsService: { trackEvent: vi.fn() },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn(), sendFeedback: vi.fn() },
}))

import { hrService } from '../src/services/hrService'
import { analyticsService } from '../src/services/analyticsService'

const mockedQuery = vi.mocked(hrService.query)
const mockedSendFeedback = vi.mocked(hrService.sendFeedback)
const mockedTrackEvent = vi.mocked(analyticsService.trackEvent)

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736'
const OTHER_TRACE_ID = 'a1b2c3d4e5f60718293a4b5c6d7e8f90'

const GROUP_NAME = '¿Te sirvió esta respuesta?'
const HELPFUL_NAME = 'Respuesta útil'
const NOT_HELPFUL_NAME = 'Respuesta no útil'
const VOTE_ERROR_TEXT = 'No se pudo registrar tu voto. Intentá de nuevo.'

const TEXTBOX_NAME = 'Escribe tu pregunta'

const answerWith = (answer: string, traceId: string | null) => ({ answer, chunks: [], traceId })

const ask = async (user: UserEvent, question: string) => {
  await user.type(screen.getByRole('textbox', { name: TEXTBOX_NAME }), question)
  await user.keyboard('{Enter}')
}

const askAndWaitForAnswer = async (user: UserEvent, question: string, answer: string) => {
  await ask(user, question)
  await waitFor(() => expect(screen.getByText(answer)).toBeInTheDocument())
}

const deferred = <T,>() => {
  let resolve!: (value: T) => void
  let reject!: (reason: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

const helpfulButton = () => screen.getByRole('button', { name: HELPFUL_NAME })
const notHelpfulButton = () => screen.getByRole('button', { name: NOT_HELPFUL_NAME })

beforeEach(() => {
  vi.clearAllMocks()
  mockedSendFeedback.mockResolvedValue(undefined)
})

// ──────────────────────────────────────────────
// @s5 — Visibilidad: respuesta con trace_id
// ──────────────────────────────────────────────

describe('hr-chat-feedback @s5 — una respuesta con trace_id muestra el par de botones agrupado y accesible', () => {
  it('muestra el grupo con nombre accesible y los dos botones sin voto marcado', async () => {
    mockedQuery.mockResolvedValue(answerWith('Respuesta con trace', TRACE_ID))
    const user = userEvent.setup()
    render(<HrChat />)

    await askAndWaitForAnswer(user, 'pregunta', 'Respuesta con trace')

    const group = screen.getByRole('group', { name: GROUP_NAME })
    const helpful = within(group).getByRole('button', { name: HELPFUL_NAME })
    const notHelpful = within(group).getByRole('button', { name: NOT_HELPFUL_NAME })

    expect(helpful).toHaveAttribute('title', HELPFUL_NAME)
    expect(notHelpful).toHaveAttribute('title', NOT_HELPFUL_NAME)
    expect(helpful).toHaveAttribute('aria-pressed', 'false')
    expect(notHelpful).toHaveAttribute('aria-pressed', 'false')
    expect(helpful).toBeEnabled()
    expect(notHelpful).toBeEnabled()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// @s6 y @s7 — Visibilidad: sin trace_id y saludo inicial
// ──────────────────────────────────────────────

describe('hr-chat-feedback @s6 — una respuesta con traceId null no muestra botones de voto', () => {
  it('muestra la respuesta pero ningún grupo ni botones de voto', async () => {
    mockedQuery.mockResolvedValue(answerWith('Respuesta sin trace', null))
    const user = userEvent.setup()
    render(<HrChat />)

    await askAndWaitForAnswer(user, 'pregunta', 'Respuesta sin trace')

    expect(screen.queryByRole('group', { name: GROUP_NAME })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: HELPFUL_NAME })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: NOT_HELPFUL_NAME })).not.toBeInTheDocument()
  })
})

describe('hr-chat-feedback @s7 — el saludo inicial no muestra botones de voto', () => {
  it('sin intercambios previos no hay grupo ni botones de voto', () => {
    render(<HrChat />)

    expect(screen.queryByRole('group', { name: GROUP_NAME })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: HELPFUL_NAME })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: NOT_HELPFUL_NAME })).not.toBeInTheDocument()
  })
})

// ──────────────────────────────────────────────
// @s8 a @s11 — Votar, confirmar, repetir y cambiar de opinión
// ──────────────────────────────────────────────

const renderWithAnswer = async (traceId: string | null = TRACE_ID) => {
  mockedQuery.mockResolvedValueOnce(answerWith('Respuesta votable', traceId))
  const user = userEvent.setup()
  render(<HrChat />)
  await askAndWaitForAnswer(user, 'pregunta', 'Respuesta votable')
  return user
}

describe('hr-chat-feedback @s8 — votar marca el pulgar de inmediato y deshabilita el par mientras se envía', () => {
  it('llama a sendFeedback, marca "útil", deshabilita ambos botones y pone aria-busy', async () => {
    mockedSendFeedback.mockReturnValue(new Promise(() => undefined))
    const user = await renderWithAnswer()

    await user.click(helpfulButton())

    expect(mockedSendFeedback).toHaveBeenCalledTimes(1)
    expect(mockedSendFeedback).toHaveBeenCalledWith(TRACE_ID, true)
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'true')
    expect(notHelpfulButton()).toHaveAttribute('aria-pressed', 'false')
    expect(helpfulButton()).toBeDisabled()
    expect(notHelpfulButton()).toBeDisabled()
    expect(screen.getByRole('group', { name: GROUP_NAME })).toHaveAttribute('aria-busy', 'true')
  })
})

describe('hr-chat-feedback @s9 — al confirmarse el voto el par se rehabilita y el voto queda marcado', () => {
  it('rehabilita ambos botones, quita aria-busy y deja "útil" marcado sin alert', async () => {
    const pending = deferred<void>()
    mockedSendFeedback.mockReturnValue(pending.promise)
    const user = await renderWithAnswer()
    await user.click(helpfulButton())

    pending.resolve()

    await waitFor(() => expect(helpfulButton()).toBeEnabled())
    expect(notHelpfulButton()).toBeEnabled()
    expect(screen.getByRole('group', { name: GROUP_NAME })).not.toHaveAttribute('aria-busy', 'true')
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'true')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('hr-chat-feedback @s10 — hacer clic en el pulgar ya elegido no hace nada', () => {
  it('no vuelve a llamar a sendFeedback y el voto sigue marcado', async () => {
    const user = await renderWithAnswer()
    await user.click(helpfulButton())
    await waitFor(() => expect(helpfulButton()).toBeEnabled())
    expect(mockedSendFeedback).toHaveBeenCalledTimes(1)

    await user.click(helpfulButton())

    expect(mockedSendFeedback).toHaveBeenCalledTimes(1)
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('hr-chat-feedback @s11 — cambiar de opinión envía un nuevo POST con el mismo trace_id', () => {
  it('llama a sendFeedback con false y mueve la marca al pulgar "no útil"', async () => {
    const user = await renderWithAnswer()
    await user.click(helpfulButton())
    await waitFor(() => expect(helpfulButton()).toBeEnabled())

    await user.click(notHelpfulButton())

    expect(mockedSendFeedback).toHaveBeenLastCalledWith(TRACE_ID, false)
    await waitFor(() => expect(notHelpfulButton()).toBeEnabled())
    expect(notHelpfulButton()).toHaveAttribute('aria-pressed', 'true')
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'false')
  })
})

// ──────────────────────────────────────────────
// @s12 a @s14 — Errores y reintento
// ──────────────────────────────────────────────

describe('hr-chat-feedback @s12 — si el primer voto falla se revierte a sin voto y se muestra el error genérico', () => {
  it('muestra el alert, deja ambos botones sin marcar y habilitados', async () => {
    mockedSendFeedback.mockRejectedValue(new Error(VOTE_ERROR_TEXT))
    const user = await renderWithAnswer()

    await user.click(helpfulButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(VOTE_ERROR_TEXT)
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'false')
    expect(notHelpfulButton()).toHaveAttribute('aria-pressed', 'false')
    expect(helpfulButton()).toBeEnabled()
    expect(notHelpfulButton()).toBeEnabled()
  })
})

describe('hr-chat-feedback @s13 — si un cambio de voto falla se vuelve a ver el último voto confirmado', () => {
  it('"útil" vuelve a estar marcado y aparece el alert', async () => {
    mockedSendFeedback
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error(VOTE_ERROR_TEXT))
    const user = await renderWithAnswer()
    await user.click(helpfulButton())
    await waitFor(() => expect(helpfulButton()).toBeEnabled())

    await user.click(notHelpfulButton())

    expect(await screen.findByRole('alert')).toHaveTextContent(VOTE_ERROR_TEXT)
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'true')
    expect(notHelpfulButton()).toHaveAttribute('aria-pressed', 'false')
  })
})

describe('hr-chat-feedback @s14 — un voto exitoso posterior a un error hace desaparecer el mensaje', () => {
  it('el alert deja de mostrarse y "útil" queda marcado', async () => {
    mockedSendFeedback
      .mockRejectedValueOnce(new Error(VOTE_ERROR_TEXT))
      .mockResolvedValueOnce(undefined)
    const user = await renderWithAnswer()
    await user.click(helpfulButton())
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await user.click(helpfulButton())

    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    expect(helpfulButton()).toHaveAttribute('aria-pressed', 'true')
  })
})

// ──────────────────────────────────────────────
// @s15, @s16 — Independencia entre respuestas y con la consulta
// ──────────────────────────────────────────────

describe('hr-chat-feedback @s15 — el voto de una respuesta no altera el de otra', () => {
  it('votar en la primera respuesta deja la segunda sin marcar y habilitada', async () => {
    mockedQuery
      .mockResolvedValueOnce(answerWith('Primera respuesta', TRACE_ID))
      .mockResolvedValueOnce(answerWith('Segunda respuesta', OTHER_TRACE_ID))
    const user = userEvent.setup()
    render(<HrChat />)
    await askAndWaitForAnswer(user, 'primera', 'Primera respuesta')
    await askAndWaitForAnswer(user, 'segunda', 'Segunda respuesta')
    const [first, second] = screen.getAllByRole('group', { name: GROUP_NAME })

    await user.click(within(first).getByRole('button', { name: HELPFUL_NAME }))

    expect(mockedSendFeedback).toHaveBeenCalledTimes(1)
    expect(mockedSendFeedback).toHaveBeenCalledWith(TRACE_ID, true)
    await waitFor(() =>
      expect(within(first).getByRole('button', { name: HELPFUL_NAME })).toBeEnabled()
    )
    for (const name of [HELPFUL_NAME, NOT_HELPFUL_NAME]) {
      const button = within(second).getByRole('button', { name })
      expect(button).toHaveAttribute('aria-pressed', 'false')
      expect(button).toBeEnabled()
    }
  })
})

describe('hr-chat-feedback @s16 — se puede votar mientras se procesa una nueva pregunta sin afectar la consulta', () => {
  it('el voto sale, la consulta sigue en vuelo y el input conserva su contenido', async () => {
    const user = await renderWithAnswer()
    mockedQuery.mockReturnValueOnce(new Promise(() => undefined))
    await ask(user, 'segunda pregunta en vuelo')
    // Mientras carga el textarea está deshabilitado: el texto llega por una sugerencia.
    await user.click(screen.getByRole('button', { name: 'Política de vacaciones' }))
    const textbox = screen.getByRole('textbox', { name: TEXTBOX_NAME })
    expect(textbox).toHaveValue('¿Cómo funciona la política de vacaciones?')

    await user.click(helpfulButton())

    expect(mockedSendFeedback).toHaveBeenCalledWith(TRACE_ID, true)
    expect(mockedQuery).toHaveBeenCalledTimes(2)
    expect(screen.getByText('Workspace AI está procesando tu consulta')).toBeInTheDocument()
    expect(textbox).toHaveValue('¿Cómo funciona la política de vacaciones?')
  })
})

describe('hr-chat-feedback — votar una respuesta no mueve el scroll del chat', () => {
  it('no vuelve a llamar a scrollIntoView al votar una respuesta anterior', async () => {
    const scrollMock = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollMock
    const user = await renderWithAnswer()
    scrollMock.mockClear()

    await user.click(helpfulButton())
    await waitFor(() => expect(helpfulButton()).toBeEnabled())

    expect(scrollMock).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────
// useHrChat.sendFeedback — guardas del contrato de estado (sin botones que las ejerciten)
// ──────────────────────────────────────────────

describe('hr-chat-feedback — useHrChat.sendFeedback ignora las llamadas que el contrato descarta', () => {
  const setupHook = async (traceId: string | null) => {
    mockedQuery.mockResolvedValueOnce(answerWith('Respuesta', traceId))
    const hook = renderHook(() => useHrChat())
    await act(async () => {
      await hook.result.current.submitQuestion('pregunta')
    })
    return hook
  }

  it('con traceId null no hace request ni cambia el estado', async () => {
    const { result } = await setupHook(null)

    await act(async () => {
      await result.current.sendFeedback(0, true)
    })

    expect(mockedSendFeedback).not.toHaveBeenCalled()
    expect(result.current.exchanges[0].feedback.vote).toBeNull()
  })

  it('con un envío en curso ignora un segundo voto', async () => {
    mockedSendFeedback.mockReturnValue(new Promise(() => undefined))
    const { result } = await setupHook(TRACE_ID)
    await act(async () => {
      void result.current.sendFeedback(0, true)
    })

    await act(async () => {
      await result.current.sendFeedback(0, false)
    })

    expect(mockedSendFeedback).toHaveBeenCalledTimes(1)
    expect(result.current.exchanges[0].feedback.vote).toBe(true)
  })

  it('no emite ningún evento de analytics al votar', async () => {
    const { result } = await setupHook(TRACE_ID)
    mockedTrackEvent.mockClear()

    await act(async () => {
      await result.current.sendFeedback(0, true)
    })

    expect(mockedTrackEvent).not.toHaveBeenCalled()
  })
})
