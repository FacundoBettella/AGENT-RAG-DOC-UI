import axios from 'axios'
import { extractBackendError } from './httpError'
import { API_ROUTES } from '../constants/apiRoutes'

export interface ContractAnalysis {
  sectionsChanged: string[]
  topicsTouched: string[]
  summary: string
}

interface ContractAnalysisPayload {
  sections_changed?: unknown
  topics_touched?: unknown
  summary_of_the_change?: unknown
}

const ANALYSIS_TIMEOUT_MS = 180_000
const GENERIC_ERROR_MESSAGE = 'No se pudieron analizar los documentos. Intentá de nuevo.'

function extractNonEmptyStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((entry): entry is string => typeof entry === 'string' && entry.trim() !== '')
}

function parseContractAnalysis(payload: ContractAnalysisPayload): ContractAnalysis {
  const sectionsChanged = extractNonEmptyStrings(payload.sections_changed)
  const topicsTouched = extractNonEmptyStrings(payload.topics_touched)
  const summary = payload.summary_of_the_change

  if (
    sectionsChanged.length === 0 ||
    topicsTouched.length === 0 ||
    typeof summary !== 'string' ||
    summary.trim() === ''
  ) {
    throw new Error('La respuesta del servidor no tiene el formato esperado.')
  }

  return { sectionsChanged, topicsTouched, summary }
}

export const docAgentService = {
  async analyze(original: File, amendment: File): Promise<ContractAnalysis> {
    const BASE_URL = import.meta.env.VITE_DOC_AGENT_API_BASE_URL ?? 'http://localhost:8000'
    const formData = new FormData()
    formData.append('original_image', original)
    formData.append('amendment_image', amendment)

    let response
    try {
      response = await axios.post(`${BASE_URL}${API_ROUTES.ANALYSIS}`, formData, {
        timeout: ANALYSIS_TIMEOUT_MS,
      })
    } catch (err) {
      const backendMessage = extractBackendError(err)
      throw new Error(backendMessage ?? GENERIC_ERROR_MESSAGE)
    }

    return parseContractAnalysis(response.data as ContractAnalysisPayload)
  },
}
