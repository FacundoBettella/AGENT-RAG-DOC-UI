import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Stable mock instances hoisted so they are available inside the vi.mock factory
const mockReactGA = vi.hoisted(() => ({
  initialize: vi.fn(),
  event: vi.fn(),
}))

// Mock react-ga4 so the module resolves without the package being installed
vi.mock('react-ga4', () => ({
  default: mockReactGA,
}))

// ──────────────────────────────────────────────────────────────
// analyticsService — background: no VITE_GA_ID (dev fallback)
// ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  vi.unstubAllEnvs()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ──────────────────────────────────────────────
// @s1 — chat_message_sent con question_length
// ──────────────────────────────────────────────
describe('analyticsService — @s1: chat_message_sent con question_length', () => {
  it('llama a console.info con "[analytics] chat_message_sent {\"question_length\":42}"', async () => {
    vi.stubEnv('VITE_GA_ID', '')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    const { analyticsService } = await import('../src/services/analyticsService')
    analyticsService.trackEvent('chat_message_sent', { question_length: 42 })

    expect(spy).toHaveBeenCalledWith('[analytics] chat_message_sent {"question_length":42}')
  })
})

// ──────────────────────────────────────────────
// @s2 — chat_message_sent no incluye el texto de la pregunta
// ──────────────────────────────────────────────
describe('analyticsService — @s2: el payload contiene question_length pero no el texto', () => {
  it('console.info contiene "question_length" pero no el texto de la pregunta', async () => {
    vi.stubEnv('VITE_GA_ID', '')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)
    const questionText = '¿Cuántos días de vacaciones tengo?'

    const { analyticsService } = await import('../src/services/analyticsService')
    analyticsService.trackEvent('chat_message_sent', { question_length: questionText.length })

    const calls = spy.mock.calls.flat() as string[]
    expect(calls.some((c) => c.includes('question_length'))).toBe(true)
    expect(calls.some((c) => c.includes(questionText))).toBe(false)
  })
})

// ──────────────────────────────────────────────
// @s6 — trackEvent sin payload emite solo el nombre
// ──────────────────────────────────────────────
describe('analyticsService — @s6: sin payload emite solo el nombre del evento', () => {
  it('console.info es llamado con "[analytics] chat_message_sent" (sin payload)', async () => {
    vi.stubEnv('VITE_GA_ID', '')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    const { analyticsService } = await import('../src/services/analyticsService')
    analyticsService.trackEvent('chat_message_sent')

    expect(spy).toHaveBeenCalledWith('[analytics] chat_message_sent')
    const calls = spy.mock.calls.flat() as string[]
    expect(calls.some((c) => c.includes('undefined'))).toBe(false)
    expect(calls.some((c) => c.includes('{}'))).toBe(false)
  })
})

// ──────────────────────────────────────────────
// @s7 — trackEvent con payload vacío emite nombre y {}
// ──────────────────────────────────────────────
describe('analyticsService — @s7: payload vacío emite el nombre y objeto vacío', () => {
  it('console.info es llamado con "[analytics] chat_message_sent {}"', async () => {
    vi.stubEnv('VITE_GA_ID', '')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    const { analyticsService } = await import('../src/services/analyticsService')
    analyticsService.trackEvent('chat_message_sent', {})

    expect(spy).toHaveBeenCalledWith('[analytics] chat_message_sent {}')
  })
})

// ──────────────────────────────────────────────
// @s8 — no propaga excepciones
// ──────────────────────────────────────────────
describe('analyticsService — @s8: no propaga excepciones internas al llamador', () => {
  it('retorna sin lanzar aunque console.info lance un Error', async () => {
    vi.stubEnv('VITE_GA_ID', '')
    vi.spyOn(console, 'info').mockImplementation(() => { throw new Error('fallo interno') })

    const { analyticsService } = await import('../src/services/analyticsService')
    expect(() => analyticsService.trackEvent('chat_message_sent', { question_length: 10 })).not.toThrow()
  })
})

// ──────────────────────────────────────────────
// @s9 — payload con referencia circular se descarta silenciosamente
// ──────────────────────────────────────────────
describe('analyticsService — @s9: payload circular se descarta sin error', () => {
  it('console.info NO es llamado y la llamada retorna sin lanzar excepción', async () => {
    vi.stubEnv('VITE_GA_ID', '')
    const spy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    const circular: Record<string, unknown> = {}
    circular['self'] = circular

    const { analyticsService } = await import('../src/services/analyticsService')
    expect(() => analyticsService.trackEvent('chat_message_sent', circular)).not.toThrow()
    expect(spy).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────
// @s12 — VITE_GA_ID configurado → ReactGA.event en lugar de console.info
// ──────────────────────────────────────────────
describe('analyticsService — @s12: con VITE_GA_ID llama ReactGA.event', () => {
  it('ReactGA.event es llamado y console.info NO es llamado cuando VITE_GA_ID está presente', async () => {
    vi.stubEnv('VITE_GA_ID', 'G-TEST12345')
    const consoleSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined)

    const { analyticsService } = await import('../src/services/analyticsService')
    analyticsService.trackEvent('chat_message_sent', { question_length: 5 })

    expect(mockReactGA.event).toHaveBeenCalledWith('chat_message_sent', { question_length: 5 })
    expect(consoleSpy).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────
// @s12b — ReactGA.initialize se llama exactamente una vez aunque
//         trackEvent sea invocado múltiples veces
// ──────────────────────────────────────────────
describe('analyticsService — @s12b: ReactGA.initialize se invoca solo una vez', () => {
  it('initialize se llama 1 vez aunque trackEvent se llame 3 veces', async () => {
    vi.stubEnv('VITE_GA_ID', 'G-TEST12345')

    const { analyticsService } = await import('../src/services/analyticsService')
    analyticsService.trackEvent('chat_message_sent', { question_length: 1 })
    analyticsService.trackEvent('chat_retry_clicked')
    analyticsService.trackEvent('rag_form_submitted')

    expect(mockReactGA.initialize).toHaveBeenCalledTimes(1)
    expect(mockReactGA.initialize).toHaveBeenCalledWith('G-TEST12345')
  })
})
