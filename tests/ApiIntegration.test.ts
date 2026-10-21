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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        query_result: { system_answer: 'Tenés 21 días de vacaciones.', chunks_related: [] },
      },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result).toEqual({ answer: 'Tenés 21 días de vacaciones.', chunks: [], traceId: null })
    expect(typeof result).not.toBe('string')
  })

  it('el array chunks se lee de query_result.chunks_related', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'Respuesta sin fuentes.' } },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result.chunks).toEqual([])
  })

  it('lanza Error si system_answer está ausente', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow(Error)
  })

  it('lanza Error si system_answer es un string vacío', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: '', chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.query('cualquier pregunta')).rejects.toThrow(Error)
  })

  it('lanza Error si el payload no trae query_result', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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

describe('hrService — @s6: lee VITE_RAG_API_BASE_URL para construir la URL base', () => {
  it('usa VITE_RAG_API_BASE_URL para construir la URL del request', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
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

describe('ragService — @s7: envía POST /api/ingest con el body { domain, documents }', () => {
  it('llama a axios.post con la URL correcta y el body { domain, documents }', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: 2, chunks_indexed: 10 } },
    })

    const fileA = new File(['Texto A'], 'a.txt', { type: 'text/plain' })
    const fileB = new File(['Texto B'], 'b.txt', { type: 'text/plain' })

    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([fileA, fileB], 'tech')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/ingest',
      { domain: 'tech', documents: ['Texto A', 'Texto B'] }
    )
  })
})

// ──────────────────────────────────────────────
// ragService — @s8
// ──────────────────────────────────────────────

describe('ragService — @s8: construye el array leyendo cada archivo', () => {
  it('el array documents contiene el texto plano del archivo como primer elemento', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: 1, chunks_indexed: 5 } },
    })

    const content = 'Política de licencias\n...'
    const file = new File([content], 'licencias.txt', { type: 'text/plain' })

    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([file], 'hr')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.any(String),
      { domain: 'hr', documents: ['Política de licencias\n...'] }
    )
  })
})

// ──────────────────────────────────────────────
// ragService — @s9
// ──────────────────────────────────────────────

describe('ragService — @s9: ya no resuelve (void): resuelve con el IngestResult traducido', () => {
  it('la promesa resuelve con un objeto (no void) con los campos de la ingesta', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: 2, chunks_indexed: 10, total_in_store: 50 } },
    })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    const result = await ragService.upload([file], 'hr')

    expect(result).not.toBeUndefined()
    expect(typeof result).toBe('object')
    expect(result).toEqual({
      domain: 'hr',
      documentsReceived: 2,
      chunksIndexed: 10,
      totalInStore: 50,
    })
  })
})

// ──────────────────────────────────────────────
// ragService — @s10
// ──────────────────────────────────────────────

describe('ragService — @s10: lanza Error si la respuesta no trae un ingest_result válido', () => {
  it('rechaza con un Error cuando la respuesta HTTP 200 no trae ingest_result', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: { message: 'ok' } })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file], 'hr')).rejects.toThrow(Error)
  })

  it('rechaza con un Error cuando la respuesta HTTP 204 no trae body', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ data: null, status: 204 })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file], 'hr')).rejects.toThrow(Error)
  })
})

// ──────────────────────────────────────────────
// ragService — @s11
// ──────────────────────────────────────────────

describe('ragService — @s11: lanza Error con el mensaje del backend ante respuesta 4xx', () => {
  it('rechaza con un Error cuyo mensaje es el campo error del backend', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 422, data: { error: 'Formato de documento inválido.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file], 'hr')).rejects.toThrow('Formato de documento inválido.')
  })
})

// ──────────────────────────────────────────────
// ragService — @s12
// ──────────────────────────────────────────────

describe('ragService — @s12: lanza Error con el mensaje del backend ante respuesta 5xx', () => {
  it('rechaza con un Error cuyo mensaje es el campo error del backend', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 503, data: { error: 'Servicio temporalmente no disponible.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file], 'hr')).rejects.toThrow('Servicio temporalmente no disponible.')
  })
})

// ──────────────────────────────────────────────
// ragService — @s13
// ──────────────────────────────────────────────

describe('ragService — @s13: relanza como Error tipado, no como AxiosError expuesto', () => {
  it('el rechazo es una instancia de Error nativo sin isAxiosError', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 400, data: { error: 'Algún error.' } },
    })
    mockedAxiosPost.mockRejectedValue(axiosError)

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    const error = await ragService.upload([file], 'hr').catch((e: unknown) => e)
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
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')

    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([], 'hr')).rejects.toThrow()
    expect(mockedAxiosPost).not.toHaveBeenCalled()
  })
})

// ──────────────────────────────────────────────
// ragService — @s15
// ──────────────────────────────────────────────

describe('ragService — @s15: lee VITE_RAG_API_BASE_URL para construir la URL base', () => {
  it('usa VITE_RAG_API_BASE_URL para construir la URL del request a /api/ingest', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: 1, chunks_indexed: 5 } },
    })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([file], 'hr')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/ingest',
      expect.any(Object)
    )
  })
})

// ──────────────────────────────────────────────
// rag-domain-metadata (feature 14) — ragService.upload(files, domain)
// ──────────────────────────────────────────────

describe('rag-domain-metadata @s1: arma el body { domain, documents }, pega a /api/ingest y traduce la respuesta a camelCase', () => {
  it('envía el body con el dominio pasado como parámetro y resuelve el IngestResult traducido', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        ingest_result: {
          domain: 'hr',
          documents_received: 2,
          chunks_indexed: 40,
        },
      },
    })

    const fileA = new File(['Política de licencias'], 'a.txt', { type: 'text/plain' })
    const fileB = new File(['Manual de accesos'], 'b.txt', { type: 'text/plain' })

    const { ragService } = await import('../src/services/ragService')
    const result = await ragService.upload([fileA, fileB], 'tech')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      expect.stringMatching(/\/api\/ingest$/),
      { domain: 'tech', documents: ['Política de licencias', 'Manual de accesos'] }
    )
    // domain se toma del que se envió ("tech"), no del que vuelve en la respuesta ("hr").
    // total_in_store ausente en la respuesta → 0.
    expect(result).toEqual({
      domain: 'tech',
      documentsReceived: 2,
      chunksIndexed: 40,
      totalInStore: 0,
    })
  })
})

describe('rag-domain-metadata @s2: lanza Error si el payload de respuesta no cumple el contrato mínimo', () => {
  it('rechaza con Error cuando chunks_indexed no es numérico', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: 2, chunks_indexed: 'cuarenta' } },
    })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file], 'hr')).rejects.toThrow(Error)
  })

  it('rechaza con Error cuando documents_received es negativo', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: -1, chunks_indexed: 40 } },
    })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')

    await expect(ragService.upload([file], 'hr')).rejects.toThrow(Error)
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

// ──────────────────────────────────────────────
// fix-rag-fallback-port (feature 15) — getRagBaseUrl y su fallback
// ──────────────────────────────────────────────

describe('fix-rag-fallback-port @s1: getRagBaseUrl usa el valor de la variable de entorno cuando está definida', () => {
  it('hrService.query pega a la URL definida en VITE_RAG_API_BASE_URL, no al fallback', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://custom-rag.example.com')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'ok', chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')
    await hrService.query('pregunta')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://custom-rag.example.com/api/query',
      { question: 'pregunta' }
    )
  })
})

describe('fix-rag-fallback-port @s2: getRagBaseUrl usa http://localhost:8080 como fallback cuando la variable no está definida', () => {
  it('sin VITE_RAG_API_BASE_URL definida, tanto hrService como ragService pegan al puerto 8080 (el default es compartido por el módulo, no una coincidencia de cada service)', async () => {
    // .env.local (gitignoreado) define VITE_RAG_API_BASE_URL=http://localhost:8080 para el
    // entorno real, y ese valor también llega a import.meta.env en el proceso de test. Para
    // ejercitar de verdad la rama del fallback (DEFAULT_RAG_BASE_URL) hay que desestubearla
    // explícitamente a undefined, no alcanza con "no llamar a vi.stubEnv".
    vi.stubEnv('VITE_RAG_API_BASE_URL', undefined)
    mockedAxiosPost.mockResolvedValue({
      data: {
        query_result: { system_answer: 'ok', chunks_related: [] },
        ingest_result: { documents_received: 1, chunks_indexed: 1 },
      },
    })

    const { hrService } = await import('../src/services/hrService')
    await hrService.query('pregunta')

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([file], 'hr')

    const [hrUrl] = mockedAxiosPost.mock.calls[0]
    const [ragUrl] = mockedAxiosPost.mock.calls[1]
    expect(hrUrl).toBe('http://localhost:8080/api/query')
    expect(ragUrl).toBe('http://localhost:8080/api/ingest')
  })
})

describe('fix-rag-fallback-port @s3: hrService.query pega contra el puerto correcto sin la variable de entorno', () => {
  it('realiza un POST a http://localhost:8080/api/query', async () => {
    // Ver comentario del test @s2: hay que forzar la variable a undefined para ejercitar el
    // fallback, porque .env.local ya la define con un valor real en el proceso de test.
    vi.stubEnv('VITE_RAG_API_BASE_URL', undefined)
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'ok', chunks_related: [] } },
    })

    const { hrService } = await import('../src/services/hrService')
    await hrService.query('¿Cuántos días de vacaciones tengo?')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8080/api/query',
      { question: '¿Cuántos días de vacaciones tengo?' }
    )
  })
})

describe('fix-rag-fallback-port @s4: ragService.upload pega contra el puerto correcto sin la variable de entorno', () => {
  it('realiza un POST a http://localhost:8080/api/ingest', async () => {
    // Ver comentario del test @s2: hay que forzar la variable a undefined para ejercitar el
    // fallback, porque .env.local ya la define con un valor real en el proceso de test.
    vi.stubEnv('VITE_RAG_API_BASE_URL', undefined)
    mockedAxiosPost.mockResolvedValue({
      data: { ingest_result: { documents_received: 1, chunks_indexed: 5 } },
    })

    const file = new File(['contenido'], 'doc.txt', { type: 'text/plain' })
    const { ragService } = await import('../src/services/ragService')
    await ragService.upload([file], 'hr')

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://localhost:8080/api/ingest',
      { domain: 'hr', documents: ['contenido'] }
    )
  })
})

// ──────────────────────────────────────────────
// hr-chat-feedback — hrService.query (trace_id) — @s1, @s2
// ──────────────────────────────────────────────

const VALID_TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736'

describe('hrService — hr-chat-feedback @s1: devuelve el trace_id válido tal cual llega', () => {
  it('resuelve con traceId igual al trace_id del backend y answer intacto', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: {
        query_result: {
          system_answer: 'Tenés 21 días de vacaciones.',
          chunks_related: [],
          trace_id: VALID_TRACE_ID,
        },
      },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result.traceId).toBe(VALID_TRACE_ID)
    expect(result.answer).toBe('Tenés 21 días de vacaciones.')
  })
})

describe('hrService — hr-chat-feedback @s2: normaliza a null un trace_id ausente, null o mal formado', () => {
  const MALFORMED: Array<[string, Record<string, unknown>]> = [
    ['ausente', {}],
    ['null', { trace_id: null }],
    ['vacío', { trace_id: '' }],
    ['en mayúsculas', { trace_id: VALID_TRACE_ID.toUpperCase() }],
    ['más corto de 32 caracteres', { trace_id: VALID_TRACE_ID.slice(0, 31) }],
    ['más largo de 32 caracteres', { trace_id: `${VALID_TRACE_ID}a` }],
    ['con caracteres no hex', { trace_id: `${VALID_TRACE_ID.slice(0, 31)}z` }],
    ['no string', { trace_id: 12345 }],
  ]

  it.each(MALFORMED)('trace_id %s: traceId es null y la respuesta se entrega igual', async (_label, extra) => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      data: { query_result: { system_answer: 'Respuesta válida.', chunks_related: [], ...extra } },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.query('cualquier pregunta')

    expect(result.traceId).toBeNull()
    expect(result.answer).toBe('Respuesta válida.')
  })
})

// ──────────────────────────────────────────────
// hr-chat-feedback — hrService.sendFeedback — @s3, @s4
// ──────────────────────────────────────────────

describe('hrService — hr-chat-feedback @s3: sendFeedback envía el voto a /api/feedback y resuelve ante un 2xx', () => {
  it('hace POST a {base}/api/feedback con { trace_id, helpful } y timeout de 15000 ms', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({
      status: 200,
      data: { feedback_result: { trace_id: VALID_TRACE_ID, helpful: true } },
    })

    const { hrService } = await import('../src/services/hrService')
    const result = await hrService.sendFeedback(VALID_TRACE_ID, true)

    expect(mockedAxiosPost).toHaveBeenCalledWith(
      'http://api.mercurial.local/api/feedback',
      { trace_id: VALID_TRACE_ID, helpful: true },
      { timeout: 15000 }
    )
    expect(result).toBeUndefined()
  })

  it('resuelve ante un 2xx sin validar el body de respuesta', async () => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockResolvedValue({ status: 204, data: '' })

    const { hrService } = await import('../src/services/hrService')

    await expect(hrService.sendFeedback(VALID_TRACE_ID, false)).resolves.toBeUndefined()
  })
})

describe('hrService — hr-chat-feedback @s4: sendFeedback lanza siempre el mismo error genérico', () => {
  const GENERIC_MESSAGE = 'No se pudo registrar tu voto. Intentá de nuevo.'

  const httpFailure = (status: number, error: string) =>
    Object.assign(new Error(`Request failed with status code ${status}`), {
      isAxiosError: true,
      response: { status, data: { error } },
    })

  const FAILURES: Array<[string, Error, string]> = [
    ['HTTP 422', httpFailure(422, 'detalle técnico'), 'detalle técnico'],
    ['HTTP 503', httpFailure(503, 'Tracing deshabilitado'), 'Tracing deshabilitado'],
    ['HTTP 500', httpFailure(500, 'falló Langfuse'), 'falló Langfuse'],
    ['un error de red', Object.assign(new Error('Network Error'), { isAxiosError: true }), 'Network Error'],
    [
      'un timeout',
      Object.assign(new Error('timeout of 15000ms exceeded'), {
        isAxiosError: true,
        code: 'ECONNABORTED',
      }),
      'timeout of 15000ms exceeded',
    ],
  ]

  it.each(FAILURES)('%s: rechaza con el mensaje genérico, sin el texto del backend', async (_label, failure, leaked) => {
    vi.stubEnv('VITE_RAG_API_BASE_URL', 'http://api.mercurial.local')
    mockedAxiosPost.mockRejectedValue(failure)

    const { hrService } = await import('../src/services/hrService')
    const rejection = hrService.sendFeedback(VALID_TRACE_ID, false)

    await expect(rejection).rejects.toBeInstanceOf(Error)
    await expect(rejection).rejects.toThrow(GENERIC_MESSAGE)
    await expect(rejection).rejects.toHaveProperty('message', GENERIC_MESSAGE)
    await expect(rejection).rejects.not.toHaveProperty('message', expect.stringContaining(leaked))
  })
})
