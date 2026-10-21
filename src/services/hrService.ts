import axios from 'axios'
import { extractBackendError } from './httpError'
import { API_ROUTES } from '../constants/apiRoutes'
import { getRagBaseUrl } from './ragBaseUrl'

export interface HrChunk {
  content: string
  source: string
  similarity: number
}

export interface HrAnswer {
  answer: string
  chunks: HrChunk[]
  traceId: string | null
}

interface QueryResultPayload {
  system_answer?: unknown
  chunks_related?: unknown
  trace_id?: unknown
}

const FEEDBACK_TIMEOUT_MS = 15_000

const FEEDBACK_ERROR_MESSAGE = 'No se pudo registrar tu voto. Intentá de nuevo.'

const TRACE_ID_PATTERN = /^[0-9a-f]{32}$/

const normalizeTraceId = (value: unknown): string | null =>
  typeof value === 'string' && TRACE_ID_PATTERN.test(value) ? value : null

export const hrService = {
  async query(question: string): Promise<HrAnswer> {
    const BASE_URL = getRagBaseUrl()
    try {
      const response = await axios.post(`${BASE_URL}${API_ROUTES.QUERY}`, { question })
      const queryResult = (response.data?.query_result ?? {}) as QueryResultPayload
      const answer = queryResult.system_answer

      if (typeof answer !== 'string' || answer.trim() === '') {
        throw new Error('La respuesta del servidor no tiene el formato esperado.')
      }

      const chunks = Array.isArray(queryResult.chunks_related)
        ? (queryResult.chunks_related as HrChunk[])
        : []

      return { answer, chunks, traceId: normalizeTraceId(queryResult.trace_id) }
    } catch (err) {
      const backendMessage = extractBackendError(err)
      if (backendMessage) {
        throw new Error(backendMessage)
      }
      if (err instanceof Error) {
        throw err
      }
      throw new Error('Error desconocido al consultar el asistente.')
    }
  },
  async sendFeedback(traceId: string, helpful: boolean): Promise<void> {
    const BASE_URL = getRagBaseUrl()
    try {
      await axios.post(
        `${BASE_URL}${API_ROUTES.FEEDBACK}`,
        { trace_id: traceId, helpful },
        { timeout: FEEDBACK_TIMEOUT_MS }
      )
    } catch {
      throw new Error(FEEDBACK_ERROR_MESSAGE)
    }
  },
}
