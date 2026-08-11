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
}

interface QueryResultPayload {
  system_answer?: unknown
  chunks_related?: unknown
}

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

      return { answer, chunks }
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
}
