import axios from 'axios'
import { extractBackendError } from './httpError'
import { API_ROUTES } from '../constants/apiRoutes'

export type RagDomain = 'hr' | 'tech' | 'finance'

export interface IngestResult {
  domain: RagDomain
  documentsReceived: number
  chunksIndexed: number
  totalInStore: number
}

interface IngestResultPayload {
  documents_received?: unknown
  chunks_indexed?: unknown
  total_in_store?: unknown
}

function isFiniteNonNegative(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0
}

function parseIngestResult(domain: RagDomain, payload: IngestResultPayload | undefined): IngestResult {
  const chunksIndexed = payload?.chunks_indexed
  const documentsReceived = payload?.documents_received

  if (!isFiniteNonNegative(chunksIndexed) || !isFiniteNonNegative(documentsReceived)) {
    throw new Error('La respuesta del servidor no tiene el formato esperado.')
  }

  const totalInStore = isFiniteNonNegative(payload?.total_in_store) ? payload.total_in_store : 0

  return {
    domain,
    documentsReceived,
    chunksIndexed,
    totalInStore,
  }
}

export const ragService = {
  async upload(files: File[], domain: RagDomain): Promise<IngestResult> {
    const BASE_URL = import.meta.env.VITE_RAG_API_BASE_URL ?? 'http://localhost:8000'
    if (files.length === 0) {
      throw new Error('No se seleccionaron archivos para cargar.')
    }
    const documents = await Promise.all(files.map((f) => f.text()))

    try {
      const response = await axios.post(`${BASE_URL}${API_ROUTES.INGEST}`, { domain, documents })
      const payload = response.data?.ingest_result as IngestResultPayload | undefined
      return parseIngestResult(domain, payload)
    } catch (err) {
      const backendMessage = extractBackendError(err)
      if (backendMessage) {
        throw new Error(backendMessage)
      }
      if (err instanceof Error) {
        throw err
      }
      throw new Error('No se pudieron subir los archivos. Intentá de nuevo.')
    }
  },
}
