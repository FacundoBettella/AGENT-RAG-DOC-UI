const DEFAULT_RAG_BASE_URL = 'http://localhost:8080'

// La lectura de import.meta.env queda dentro de la función (no en scope de módulo) para que
// los stubs de entorno de los tests (vi.stubEnv) sigan surtiendo efecto import a import.
export function getRagBaseUrl(): string {
  return import.meta.env.VITE_RAG_API_BASE_URL ?? DEFAULT_RAG_BASE_URL
}
