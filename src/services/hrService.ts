import axios from 'axios'
import { extractBackendError } from './httpError'

export const hrService = {
  async query(question: string): Promise<string> {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
    try {
      const response = await axios.post(`${BASE_URL}/api/query`, { question })
      return response.data.result as string
    } catch (err) {
      const backendMessage = extractBackendError(err)
      if (backendMessage) {
        throw new Error(backendMessage)
      }
      throw err
    }
  },
}
