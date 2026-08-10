import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

const mockedAxiosPost = vi.mocked(axios.post)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ──────────────────────────────────────────────
// hrService — @s1
// ──────────────────────────────────────────────

describe('hrService — @s1: envía POST /api/query con el campo question', () => {
  it('llama a axios.post con la URL correcta y el body { question }', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'ok', chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')
    await hrService.query('¿Cuántos días de vacaciones tengo?')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/query',
      { question: '¿Cuántos días de vacaciones tengo?' }
    )
  })
})

// ──────────────────────────────────────────────
// hrService — @s2
// ──────────────────────────────────────────────

describe('hrService — @s2: resuelve con un objeto { answer, chunks }, no con un string plano', () => {
  it('resuelve con answer leído de query_result.system_answer', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        query_result: { system_answer: 'Tenés 21 días de vacaciones.', chunks_related: [] },
      },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result).toEqual({ answer: 'Tenés 21 días de vacaciones.', chunks: [] })
    expect(typeof result).not.toBe('string')
  })

  it('el array chunks se lee de query_result.chunks_related', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        query_result: {
          system_answer: 'Tenés 21 días de vacaciones.',
          chunks_related: [{ content: 'Política de licencias...', source: 'manual-rrhh.pdf', similarity: 0.87 }],
        },
      },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result.chunks).toEqual([
      { content: 'Política de licencias...', source: 'manual-rrhh.pdf', similarity: 0.87 },
    ])
  })

  it('chunks es un array vacío si el backend no envía chunks_related', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'Respuesta sin fuentes.' } },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result.chunks).toEqual([])
  })

  it('lanza Error si system_answer está ausente', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow(Error)
  })

  it('lanza Error si system_answer es un string vacío', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: '', chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow(Error)
  })

  it('lanza Error si el payload no trae query_result', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: {} })

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow(Error)
  })
})

// ──────────────────────────────────────────────
// hrService — @s3
// ──────────────────────────────────────────────

describe('hrService — @s3: lanza Error con el mensaje del backend ante respuesta 4xx', () => {
  it('rechaza con un Error cuyo mensaje es el campo error del backend', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { error: 'Pregunta inválida.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow('Pregunta inválida.')
  })
})

// ──────────────────────────────────────────────
// hrService — @s4
// ──────────────────────────────────────────────

describe('hrService — @s4: lanza Error con el mensaje del backend ante respuesta 5xx', () => {
  it('rechaza con un Error cuyo mensaje es el campo error del backend', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 500, data: { error: 'Error interno del servidor.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow('Error interno del servidor.')
  })
})

// ──────────────────────────────────────────────
// hrService — @s5
// ──────────────────────────────────────────────

describe('hrService — @s5: relanza como Error tipado, no como AxiosError expuesto', () => {
  it('el rechazo es una instancia de Error nativo', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { error: 'Algún error.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const { hrService } = await import('../src/services/hrService')

    const error = await hrService.query('cualquier pregunta').catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('Algún error.')
    expect((error as Record<string, unknown>).isAxiosError).toBeUndefined()
  })
})

// ──────────────────────────────────────────────
// hrService — @s6
// ──────────────────────────────────────────────

describe('hrService — @s6: lee VITE_API_BASE_URL para construir la URL base', () => {
  it('usa VITE_API_BASE_URL para construir la URL del request', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'ok', chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')
    await hrService.query('pregunta')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/query',
      expect.any(Object)
    )
  })
})

// ──────────────────────────────────────────────
// ragService — @s7
// ──────────────────────────────────────────────

describe('ragService — @s7: envía POST /api/ingest con el array documents', () => {
  it('llama a axios.post con la URL correcta y el body { documents }', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: { message: 'ok' } })

    const fileA = new File(['Texto A'], 'a.txt', { type: 'text/plain' })
    const fileB = new File(['Texto B'], 'b.txt', { type: 'text/plain' })

    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([fileA, fileB])

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/ingest',
      { documents: ['Texto A', 'Texto B'] }
    )
  })
})

// ──────────────────────────────────────────────
// ragService — @s8
// ──────────────────────────────────────────────

describe('ragService — @s8: construye el array leyendo cada archivo', () => {
  it('el array documents contiene el texto plano del archivo como primer elemento', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: { message: 'ok' } })

    const content = 'Política de licencias\n...'
    const file = new File([content], 'licencias.txt', { type: 'text/plain' })

    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([file])

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      { documents: ['Política de licencias\n...'] }
    )
  })
})

// ──────────────────────────────────────────────
// ragService — @s9
// ──────────────────────────────────────────────

describe('ragService — @s9: resuelve sin valor ante respuesta HTTP 200', () => {
  it('la promesa resuelve (void) sin lanzar ningún error', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: { message: 'Documentos indexados.' } })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file])).resolves.toBeUndefined()
  })
})

// ──────────────────────────────────────────────
// ragService — @s10
// ──────────────────────────────────────────────

describe('ragService — @s10: resuelve sin valor ante respuesta HTTP 204 sin body', () => {
  it('la promesa resuelve (void) sin lanzar ningún error', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: null, status: 204 })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file])).resolves.toBeUndefined()
  })
})

// ──────────────────────────────────────────────
// ragService — @s11
// ──────────────────────────────────────────────

describe('ragService — @s11: lanza Error con el mensaje del backend ante respuesta 4xx', () => {
  it('rechaza con un Error cuyo mensaje es el campo error del backend', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 422, data: { error: 'Formato de documento inválido.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file])).rejects.toThrow('Formato de documento inválido.')
  })
})

// ──────────────────────────────────────────────
// ragService — @s12
// ──────────────────────────────────────────────

describe('ragService — @s12: lanza Error con el mensaje del backend ante respuesta 5xx', () => {
  it('rechaza con un Error cuyo mensaje es el campo error del backend', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 503, data: { error: 'Servicio temporalmente no disponible.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file])).rejects.toThrow('Servicio temporalmente no disponible.')
  })
})

// ──────────────────────────────────────────────
// ragService — @s13
// ──────────────────────────────────────────────

describe('ragService — @s13: relanza como Error tipado, no como AxiosError expuesto', () => {
  it('el rechazo es una instancia de Error nativo sin isAxiosError', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { error: 'Algún error.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    const error = await ragService.upload([file]).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe('Algún error.')
    expect((error as Record<string, unknown>).isAxiosError).toBeUndefined()
  })
})

// ──────────────────────────────────────────────
// ragService — @s14
// ──────────────────────────────────────────────

describe('ragService — @s14: lanza Error sin llamar a la API si lista vacía', () => {
  it('rechaza con un Error sin realizar ningún request HTTP', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')

    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([])).rejects.toThrow()
    expect(mockedAxiosPost).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────
// ragService — @s15
// ──────────────────────────────────────────────

describe('ragService — @s15: lee VITE_API_BASE_URL para construir la URL base', () => {
  it('usa VITE_API_BASE_URL para construir la URL del request a /api/ingest', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: { message: 'ok' } })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([file])

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/ingest',
      expect.any(Object)
    )
  })
})

// ──────────────────────────────────────────────
// extractBackendError — guard && vs ||
// ──────────────────────────────────────────────

describe('extractBackendError: objeto plano con response no es instanceof Error', () => {
  it('retorna null cuando el valor tiene response pero NO es instanceof Error', async () => {
    const { extractBackendError } = await import('../src/services/httpError')

    const plainObject = { response: { data: { error: 'debería ignorarse' } } }

    expect(extractBackendError(plainObject)).toBeNull()
  })
})
