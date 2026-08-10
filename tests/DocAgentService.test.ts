import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

const mockedAxiosPost = vi.mocked(axios.post)

function makeImageFile(name = 'contrato.png', sizeBytes = 100, type = 'image/png'): File {
  const content = new Uint8Array(sizeBytes)
  return new File([content], name, { type })
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ──────────────────────────────────────────────────────────────────
// docAgentService.analyze — @s1
// ──────────────────────────────────────────────────────────────────

describe('docAgentService — @s1: arma el FormData correcto, pega a /analysis sin barra final y traduce a camelCase', () => {
  it('llama a axios.post con la URL sin barra final y config { timeout }, sin Content-Type manual', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        sections_changed: ['Cláusula 4.2 - Plazo'],
        topics_touched: ['Monto'],
        summary_of_the_change: 'El monto se actualizó de $100.000 a $150.000.',
      },
    })

    const { docAgentService } = await import('../src/services/docAgentService')
    await docAgentService.analyze(makeImageFile('contrato.png'), makeImageFile('enmienda.png'))

    expect(mockedAxiosPost).toHaveBeenCalledTimes(1)
    const [url, body, config] = mockedAxiosPost.mock.calls[0]
    expect(url).toBe('http://doc.mercurial.local/analysis')
    expect((url as string).endsWith('/')).toBe(false)
    expect(body).toBeInstanceOf(FormData)
    // Sin Content-Type manual: el config solo trae timeout, axios agrega el boundary solo.
    expect(config).toEqual({ timeout: 180_000 })
  })

  it('el FormData tiene los campos original_image y amendment_image con los archivos recibidos', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        sections_changed: ['Cláusula 4.2'],
        topics_touched: ['Monto'],
        summary_of_the_change: 'Cambio detectado.',
      },
    })

    const { docAgentService } = await import('../src/services/docAgentService')
    const original = makeImageFile('contrato.png')
    const amendment = makeImageFile('enmienda.png')
    await docAgentService.analyze(original, amendment)

    const [, body] = mockedAxiosPost.mock.calls[0]
    const formData = body as FormData
    expect(formData.get('original_image')).toBe(original)
    expect(formData.get('amendment_image')).toBe(amendment)
  })

  it('la promesa resuelve con { sectionsChanged, topicsTouched, summary } en camelCase', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        sections_changed: ['Cláusula 4.2 - Plazo'],
        topics_touched: ['Monto'],
        summary_of_the_change: 'El monto se actualizó de $100.000 a $150.000.',
      },
    })

    const { docAgentService } = await import('../src/services/docAgentService')
    const result = await docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))

    expect(result).toEqual({
      sectionsChanged: ['Cláusula 4.2 - Plazo'],
      topicsTouched: ['Monto'],
      summary: 'El monto se actualizó de $100.000 a $150.000.',
    })
  })
})

// ──────────────────────────────────────────────────────────────────
// docAgentService.analyze — @s2
// ──────────────────────────────────────────────────────────────────

describe('docAgentService — @s2: lanza Error si el payload no cumple el contrato mínimo', () => {
  it('rechaza cuando sections_changed no tiene ningún string no vacío', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { sections_changed: [], topics_touched: ['Monto'], summary_of_the_change: 'Cambio.' },
    })

    const { docAgentService } = await import('../src/services/docAgentService')

    await expect(
      docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))
    ).rejects.toThrow(Error)
  })

  it('rechaza cuando sections_changed solo trae strings vacíos', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { sections_changed: ['   '], topics_touched: ['Monto'], summary_of_the_change: 'Cambio.' },
    })

    const { docAgentService } = await import('../src/services/docAgentService')

    await expect(
      docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))
    ).rejects.toThrow(Error)
  })

  it('rechaza cuando summary_of_the_change está vacío', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { sections_changed: ['Cláusula 1'], topics_touched: ['Monto'], summary_of_the_change: '' },
    })

    const { docAgentService } = await import('../src/services/docAgentService')

    await expect(
      docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))
    ).rejects.toThrow(Error)
  })

  it('rechaza cuando topics_touched no tiene ningún string no vacío', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { sections_changed: ['Cláusula 1'], topics_touched: [], summary_of_the_change: 'Cambio.' },
    })

    const { docAgentService } = await import('../src/services/docAgentService')

    await expect(
      docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))
    ).rejects.toThrow(Error)
  })
})

// ──────────────────────────────────────────────────────────────────
// extractBackendError — @s3
// ──────────────────────────────────────────────────────────────────

describe('extractBackendError — @s3: devuelve response.data.detail cuando es un string no vacío', () => {
  it('retorna el string de detail', async () => {
    const { extractBackendError } = await import('../src/services/httpError')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { detail: 'La imagen no es un formato de archivo soportado.' } },
    })

    expect(extractBackendError(axiosError)).toBe('La imagen no es un formato de archivo soportado.')
  })
})

// ──────────────────────────────────────────────────────────────────
// extractBackendError — @s4
// ──────────────────────────────────────────────────────────────────

describe('extractBackendError — @s4: el 422 de FastAPI con detail array cae al mensaje genérico (null)', () => {
  it('retorna null cuando detail es un array de objetos de validación', async () => {
    const { extractBackendError } = await import('../src/services/httpError')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: {
        status: 422,
        data: {
          detail: [{ loc: ['body', 'original_image'], msg: 'field required', type: 'value_error.missing' }],
        },
      },
    })

    expect(extractBackendError(axiosError)).toBeNull()
  })
})

// ──────────────────────────────────────────────────────────────────
// docAgentService.analyze — errores HTTP y de red (soporte de @s3/@s4)
// ──────────────────────────────────────────────────────────────────

describe('docAgentService — errores HTTP usan extractBackendError, con fallback al mensaje genérico', () => {
  it('rechaza con el mensaje detail del backend ante un error HTTP', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { detail: 'La imagen no es un formato de archivo soportado.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const { docAgentService } = await import('../src/services/docAgentService')

    await expect(
      docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))
    ).rejects.toThrow('La imagen no es un formato de archivo soportado.')
  })

  it('rechaza con el mensaje genérico ante un error de red sin body de backend', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPost.mockRejectedValue(new Error('Network Error'))

    const { docAgentService } = await import('../src/services/docAgentService')

    await expect(
      docAgentService.analyze(makeImageFile('a.png'), makeImageFile('b.png'))
    ).rejects.toThrow('No se pudieron analizar los documentos. Intentá de nuevo.')
  })
})
