import axios from 'axios'
import { extractBackendError } from './httpError'

export const ragService = {
  async upload(files: FileList | File[]): Promise<void> {
    const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
    const fileArray = Array.from(files)
    if (fileArray.length === 0) {
      throw new Error('No se seleccionaron archivos para cargar.')
    }
    const documents = await Promise.all(fileArray.map((f) => f.text()))

    try {
      await axios.post(`${BASE_URL}/api/ingest`, { documents })
    } catch (err) {
      const backendMessage = extractBackendError(err)
      if (backendMessage) {
        throw new Error(backendMessage)
      }
      throw err
    }
  },
}
