const DEFAULT_DOC_AGENT_BASE_URL = 'http://localhost:8000'

// La lectura de import.meta.env queda dentro de la función (no en scope de módulo) para que
// los stubs de entorno de los tests (vi.stubEnv) sigan surtiendo efecto import a import.
export function getDocAgentBaseUrl(): string {
  return import.meta.env.VITE_DOC_AGENT_API_BASE_URL ?? DEFAULT_DOC_AGENT_BASE_URL
}
