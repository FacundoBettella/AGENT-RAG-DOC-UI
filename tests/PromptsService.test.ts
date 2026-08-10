import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

vi.mock('axios')

const mockedAxiosGet = vi.mocked(axios.get)
const mockedAxiosPut = vi.mocked(axios.put)

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
})

// ──────────────────────────────────────────────────────────────────
// promptsService.list — @s1 (soporte)
// ──────────────────────────────────────────────────────────────────

describe('promptsService.list — pega a /prompts sin barra final, con timeout 15s, y mapea a camelCase', () => {
  it('llama a axios.get con la URL y config correctos', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosGet.mockResolvedValue({
      data: [
        { agent_name: 'extraction_agent', system_prompt: 'Sos un Auditor.' },
        { agent_name: 'contextualization_agent', system_prompt: 'Sos un Analista.' },
      ],
    })

    const { promptsService } = await import('../src/services/promptsService')
    await promptsService.list()

    expect(mockedAxiosGet).toHaveBeenCalledTimes(1)
    const [url, config] = mockedAxiosGet.mock.calls[0]
    expect(url).toBe('http://doc.mercurial.local/prompts')
    expect((url as string).endsWith('/')).toBe(false)
    expect(config).toEqual({ timeout: 15_000 })
  })

  it('respeta el orden del backend y devuelve agentName/systemPrompt en camelCase', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosGet.mockResolvedValue({
      data: [
        { agent_name: 'extraction_agent', system_prompt: 'Sos un Auditor.' },
        { agent_name: 'contextualization_agent', system_prompt: 'Sos un Analista.' },
      ],
    })

    const { promptsService } = await import('../src/services/promptsService')
    const result = await promptsService.list()

    expect(result).toEqual([
      { agentName: 'extraction_agent', systemPrompt: 'Sos un Auditor.' },
      { agentName: 'contextualization_agent', systemPrompt: 'Sos un Analista.' },
    ])
  })
})

describe('promptsService.list — lanza Error si el payload no cumple el contrato mínimo', () => {
  it('rechaza cuando el backend responde un array vacío', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosGet.mockResolvedValue({ data: [] })

    const { promptsService } = await import('../src/services/promptsService')

    await expect(promptsService.list()).rejects.toThrow(
      'La respuesta del servidor no tiene el formato esperado.'
    )
  })

  it('rechaza cuando una entrada tiene agent_name vacío', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosGet.mockResolvedValue({
      data: [{ agent_name: '', system_prompt: 'Sos un Auditor.' }],
    })

    const { promptsService } = await import('../src/services/promptsService')

    await expect(promptsService.list()).rejects.toThrow(
      'La respuesta del servidor no tiene el formato esperado.'
    )
  })

  it('rechaza cuando system_prompt no es un string', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosGet.mockResolvedValue({
      data: [{ agent_name: 'extraction_agent', system_prompt: null }],
    })

    const { promptsService } = await import('../src/services/promptsService')

    await expect(promptsService.list()).rejects.toThrow(
      'La respuesta del servidor no tiene el formato esperado.'
    )
  })

  it('rechaza con el mensaje genérico ante un error de red sin body de backend', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosGet.mockRejectedValue(new Error('Network Error'))

    const { promptsService } = await import('../src/services/promptsService')

    await expect(promptsService.list()).rejects.toThrow(
      'No se pudieron cargar los prompts. Intentá de nuevo.'
    )
  })
})

// ──────────────────────────────────────────────────────────────────
// promptsService.update — @s8 (soporte)
// ──────────────────────────────────────────────────────────────────

describe('promptsService.update — PUT /prompts/{agentName} con { system_prompt }, sin recortar el texto', () => {
  it('arma la URL con el agentName codificado y manda system_prompt tal cual', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPut.mockResolvedValue({
      data: { agent_name: 'extraction_agent', system_prompt: 'Nuevo texto.' },
    })

    const { promptsService } = await import('../src/services/promptsService')
    await promptsService.update('extraction_agent', 'Nuevo texto.')

    expect(mockedAxiosPut).toHaveBeenCalledTimes(1)
    const [url, body, config] = mockedAxiosPut.mock.calls[0]
    expect(url).toBe('http://doc.mercurial.local/prompts/extraction_agent')
    expect(body).toEqual({ system_prompt: 'Nuevo texto.' })
    expect(config).toEqual({ timeout: 15_000 })
  })

  it('codifica caracteres especiales del agentName en la URL', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPut.mockResolvedValue({
      data: { agent_name: 'agente raro', system_prompt: 'x' },
    })

    const { promptsService } = await import('../src/services/promptsService')
    await promptsService.update('agente raro', 'x')

    const [url] = mockedAxiosPut.mock.calls[0]
    expect(url).toBe('http://doc.mercurial.local/prompts/agente%20raro')
  })

  it('la promesa resuelve con { agentName, systemPrompt } de la respuesta del backend', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPut.mockResolvedValue({
      data: { agent_name: 'extraction_agent', system_prompt: 'Nuevo texto.' },
    })

    const { promptsService } = await import('../src/services/promptsService')
    const result = await promptsService.update('extraction_agent', 'Nuevo texto.')

    expect(result).toEqual({ agentName: 'extraction_agent', systemPrompt: 'Nuevo texto.' })
  })

  it('rechaza con el detail del backend ante un error HTTP', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    const axiosError = Object.assign(new Error('Request failed'), {
      isAxiosError: true,
      response: { status: 500, data: { detail: 'No se pudo escribir data/prompts.json' } },
    })
    mockedAxiosPut.mockRejectedValue(axiosError)

    const { promptsService } = await import('../src/services/promptsService')

    await expect(promptsService.update('extraction_agent', 'x')).rejects.toThrow(
      'No se pudo escribir data/prompts.json'
    )
  })

  it('rechaza con el mensaje genérico ante un error de red sin body de backend', async () => {
    vi.stubEnv('VITE_DOC_AGENT_API_BASE_URL', 'http://doc.mercurial.local')
    mockedAxiosPut.mockRejectedValue(new Error('Network Error'))

    const { promptsService } = await import('../src/services/promptsService')

    await expect(promptsService.update('extraction_agent', 'x')).rejects.toThrow(
      'No se pudo guardar el prompt. Intentá de nuevo.'
    )
  })
})

// ──────────────────────────────────────────────────────────────────
// getDocAgentBaseUrl — fallback (soporte de Decisión 3)
// ──────────────────────────────────────────────────────────────────

describe('getDocAgentBaseUrl — usa http://localhost:8000 como fallback', () => {
  it('usa el fallback cuando VITE_DOC_AGENT_API_BASE_URL no está definida', async () => {
    mockedAxiosGet.mockResolvedValue({
      data: [{ agent_name: 'extraction_agent', system_prompt: 'x' }],
    })

    const { promptsService } = await import('../src/services/promptsService')
    await promptsService.list()

    const [url] = mockedAxiosGet.mock.calls[0]
    expect(url).toBe('http://localhost:8000/prompts')
  })
})
