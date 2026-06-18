export function extractBackendError(err: unknown): string | null {
  if (err instanceof Error && 'response' in err) {
    const response = (err as { response?: { data?: { error?: string } } }).response
    if (response?.data?.error) {
      return response.data.error
    }
  }
  return null
}
