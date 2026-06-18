import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

// Mock react-ga4 so it resolves without the package installed
vi.mock('react-ga4', () => ({
  default: {
    initialize: vi.fn(),
    event: vi.fn(),
  },
}))

// Mock analyticsService before importing hooks
vi.mock('../src/services/analyticsService', () => ({
  analyticsService: {
    trackEvent: vi.fn(),
  },
}))

vi.mock('../src/services/hrService', () => ({
  hrService: { query: vi.fn() },
}))

vi.mock('../src/services/ragService', () => ({
  ragService: { upload: vi.fn() },
}))

import { analyticsService } from '../src/services/analyticsService'
import { hrService } from '../src/services/hrService'
import { ragService } from '../src/services/ragService'

const mockedTrackEvent = vi.mocked(analyticsService.trackEvent)
const mockedQuery = vi.mocked(hrService.query)
const mockedUpload = vi.mocked(ragService.upload)

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ──────────────────────────────────────────────
// @s1 — chat_message_sent al enviar pregunta (via hook)
// ──────────────────────────────────────────────
describe('useHrChat — @s1: chat_message_sent al enviar pregunta', () => {
  it('trackEvent es llamado con "chat_message_sent" y question_length al enviar', async () => {
    mockedQuery.mockResolvedValue('Respuesta OK')
    const { useHrChat } = await import('../src/hooks/useHrChat')
    const { result } = renderHook(() => useHrChat())

    const question = 'A'.repeat(42)
    await act(async () => {
      await result.current.submitQuestion(question)
    })

    expect(mockedTrackEvent).toHaveBeenCalledWith('chat_message_sent', { question_length: 42 })
  })
})

// ──────────────────────────────────────────────
// @s2 — chat_message_sent no incluye el texto de la pregunta
// ──────────────────────────────────────────────
describe('useHrChat — @s2: el payload no contiene el texto de la pregunta', () => {
  it('trackEvent es llamado con question_length pero sin el texto de la pregunta', async () => {
    mockedQuery.mockResolvedValue('Respuesta OK')
    const { useHrChat } = await import('../src/hooks/useHrChat')
    const { result } = renderHook(() => useHrChat())

    const question = '¿Cuántos días de vacaciones tengo?'
    await act(async () => {
      await result.current.submitQuestion(question)
    })

    expect(mockedTrackEvent).toHaveBeenCalledWith(
      'chat_message_sent',
      expect.objectContaining({ question_length: question.length })
    )
    const callArgs = mockedTrackEvent.mock.calls[0]
    expect(JSON.stringify(callArgs)).not.toContain(question)
  })
})

// ──────────────────────────────────────────────
// @s3 — chat_retry_clicked al hacer retry
// ──────────────────────────────────────────────
describe('useHrChat — @s3: chat_retry_clicked al hacer click en Reintentar', () => {
  it('trackEvent es llamado con "chat_retry_clicked" y question_length=20 al reintentar', async () => {
    mockedQuery
      .mockRejectedValueOnce(new Error('Network error'))
      .mockResolvedValueOnce('ok')

    const { useHrChat } = await import('../src/hooks/useHrChat')
    const { result } = renderHook(() => useHrChat())

    const question = 'A'.repeat(20)

    // Enviar pregunta (falla)
    await act(async () => {
      await result.current.submitQuestion(question)
    })

    vi.clearAllMocks()

    // Retry
    await act(async () => {
      result.current.handleRetry()
      await Promise.resolve()
    })

    // Esperar a que el retry termine
    await act(async () => {
      await Promise.resolve()
    })

    expect(mockedTrackEvent).toHaveBeenCalledWith('chat_retry_clicked', { question_length: 20 })
  })
})

// ──────────────────────────────────────────────
// @s4 — rag_files_selected al seleccionar archivos
// ──────────────────────────────────────────────
describe('useRagUpload — @s4: rag_files_selected al seleccionar archivos', () => {
  it('trackEvent es llamado con "rag_files_selected", file_count=3 y total_size_bytes=2048', async () => {
    const { useRagUpload } = await import('../src/hooks/useRagUpload')
    const { result } = renderHook(() => useRagUpload())

    const makeFile = (size: number) => {
      const content = 'x'.repeat(size)
      return new File([content], 'file.txt', { type: 'text/plain' })
    }

    const files = [
      makeFile(512),
      makeFile(512),
      makeFile(1024),
    ]

    act(() => {
      result.current.setFiles(files)
    })

    expect(mockedTrackEvent).toHaveBeenCalledWith('rag_files_selected', {
      file_count: 3,
      total_size_bytes: 2048,
    })
  })
})

// ──────────────────────────────────────────────
// @s5 — rag_form_submitted al completar ingesta exitosamente
// ──────────────────────────────────────────────
describe('useRagUpload — @s5: rag_form_submitted al completar ingesta exitosamente', () => {
  it('trackEvent es llamado con "rag_form_submitted", file_count=2 y total_size_bytes=1024', async () => {
    mockedUpload.mockResolvedValue(undefined)
    const { useRagUpload } = await import('../src/hooks/useRagUpload')
    const { result } = renderHook(() => useRagUpload())

    const makeFile = (size: number) => new File(['x'.repeat(size)], 'file.txt', { type: 'text/plain' })
    const files = [makeFile(512), makeFile(512)]

    act(() => {
      result.current.setFiles(files)
    })

    vi.clearAllMocks()

    await act(async () => {
      await result.current.submit()
    })

    expect(mockedTrackEvent).toHaveBeenCalledWith('rag_form_submitted', {
      file_count: 2,
      total_size_bytes: 1024,
    })
  })
})

// ──────────────────────────────────────────────
// @s10 — chat_message_sent se dispara ANTES del fetch
// ──────────────────────────────────────────────
describe('useHrChat — @s10: chat_message_sent se dispara antes del fetch', () => {
  it('trackEvent es llamado antes de hrService.query', async () => {
    const callOrder: string[] = []
    mockedTrackEvent.mockImplementation(() => { callOrder.push('trackEvent') })
    mockedQuery.mockImplementation(async () => { callOrder.push('query'); return 'ok' })

    const { useHrChat } = await import('../src/hooks/useHrChat')
    const { result } = renderHook(() => useHrChat())

    await act(async () => {
      await result.current.submitQuestion('pregunta')
    })

    const trackIdx = callOrder.indexOf('trackEvent')
    const queryIdx = callOrder.indexOf('query')
    expect(trackIdx).toBeGreaterThanOrEqual(0)
    expect(queryIdx).toBeGreaterThanOrEqual(0)
    expect(trackIdx).toBeLessThan(queryIdx)
  })
})

// ──────────────────────────────────────────────
// @s11 — error de API no duplica ni elimina chat_message_sent
// ──────────────────────────────────────────────
describe('useHrChat — @s11: error de API no duplica el evento chat_message_sent', () => {
  it('trackEvent es llamado exactamente una vez con "chat_message_sent"', async () => {
    mockedQuery.mockRejectedValue(new Error('Network error'))

    const { useHrChat } = await import('../src/hooks/useHrChat')
    const { result } = renderHook(() => useHrChat())

    await act(async () => {
      await result.current.submitQuestion('pregunta con error')
    })

    const chatMessageSentCalls = mockedTrackEvent.mock.calls.filter(
      ([name]) => name === 'chat_message_sent'
    )
    expect(chatMessageSentCalls).toHaveLength(1)
  })
})
