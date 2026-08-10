import axios from 'axios'
import { extractBackendError } from './httpError'
import { API_ROUTES } from '../constants/apiRoutes'
import { getDocAgentBaseUrl } from './docAgentBaseUrl'

export interface AgentPrompt {
  agentName: string
  systemPrompt: string
}

interface AgentPromptPayload {
  agent_name?: unknown
  system_prompt?: unknown
}

const PROMPTS_TIMEOUT_MS = 15_000
const LIST_ERROR_MESSAGE = 'No se pudieron cargar los prompts. Intentá de nuevo.'
const UPDATE_ERROR_MESSAGE = 'No se pudo guardar el prompt. Intentá de nuevo.'
const INVALID_FORMAT_MESSAGE = 'La respuesta del servidor no tiene el formato esperado.'

function parseAgentPrompt(payload: AgentPromptPayload): AgentPrompt {
  const agentName = payload.agent_name
  const systemPrompt = payload.system_prompt

  if (typeof agentName !== 'string' || agentName === '' || typeof systemPrompt !== 'string') {
    throw new Error(INVALID_FORMAT_MESSAGE)
  }

  return { agentName, systemPrompt }
}

export const promptsService = {
  async list(): Promise<AgentPrompt[]> {
    const BASE_URL = getDocAgentBaseUrl()

    let response
    try {
      response = await axios.get(`${BASE_URL}${API_ROUTES.PROMPTS}`, {
        timeout: PROMPTS_TIMEOUT_MS,
      })
    } catch (err) {
      const backendMessage = extractBackendError(err)
      throw new Error(backendMessage ?? LIST_ERROR_MESSAGE)
    }

    const data = response.data
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error(INVALID_FORMAT_MESSAGE)
    }

    return (data as AgentPromptPayload[]).map(parseAgentPrompt)
  },

  async update(agentName: string, systemPrompt: string): Promise<AgentPrompt> {
    const BASE_URL = getDocAgentBaseUrl()

    let response
    try {
      response = await axios.put(
        `${BASE_URL}${API_ROUTES.PROMPTS}/${encodeURIComponent(agentName)}`,
        { system_prompt: systemPrompt },
        { timeout: PROMPTS_TIMEOUT_MS }
      )
    } catch (err) {
      const backendMessage = extractBackendError(err)
      throw new Error(backendMessage ?? UPDATE_ERROR_MESSAGE)
    }

    return parseAgentPrompt(response.data as AgentPromptPayload)
  },
}
