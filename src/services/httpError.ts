interface BackendErrorResponse {
  data?: {
    error?: string
    detail?: unknown
  }
}

export function extractBackendError(err: unknown): string | null {
  if (err instanceof Error && 'response' in err) {
    const response = (err as { response?: BackendErrorResponse }).response
    if (response?.data?.error) {
      return response.data.error
    }
    if (typeof response?.data?.detail === 'string' && response.data.detail !== '') {
      return response.data.detail
    }
  }
  return null
}
