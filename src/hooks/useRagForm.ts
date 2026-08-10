import { useState, useCallback } from 'react'
import { ragService, type RagDomain, type IngestResult } from '../services/ragService'
import { analyticsService } from '../services/analyticsService'
import { formatFileSize } from '../utils/formatFileSize'

export { formatFileSize }
export type { RagDomain, IngestResult }

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024
export const MAX_TOTAL_SIZE_BYTES = 8 * 1024 * 1024
export const MAX_FILE_COUNT = 4

export type RagFormStatus = 'idle' | 'loading' | 'success' | 'error'

export type UseRagFormReturn = {
  files: File[]
  validationError: string | null
  isLoading: boolean
  status: RagFormStatus
  apiError: string | null
  domain: RagDomain | null
  setDomain: (domain: RagDomain) => void
  result: IngestResult | null
  canSubmit: boolean
  addFiles: (incoming: File[]) => void
  removeFile: (name: string) => void
  submit: () => Promise<void>
  retry: () => void
}

function isTxtFile(file: File): boolean {
  return file.name.toLowerCase().endsWith('.txt')
}

export function useRagForm(): UseRagFormReturn {
  const [files, setFiles] = useState<File[]>([])
  const [validationError, setValidationError] = useState<string | null>(null)
  const [status, setStatus] = useState<RagFormStatus>('idle')
  const [apiError, setApiError] = useState<string | null>(null)
  const [domain, setDomain] = useState<RagDomain | null>(null)
  const [result, setResult] = useState<IngestResult | null>(null)

  const isLoading = status === 'loading'
  const canSubmit =
    files.length > 0 && validationError === null && domain !== null && status !== 'loading'

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((current) => {
      const existingNames = new Set(current.map((f) => f.name))

      let accumulated = [...current]
      let newValidationError: string | null = null
      const added: File[] = []

      for (const file of incoming) {
        if (!isTxtFile(file)) continue
        if (existingNames.has(file.name)) continue

        if (file.size > MAX_FILE_SIZE_BYTES) {
          newValidationError = `El archivo supera el límite de 2 MB`
          continue
        }

        const projectedTotal = accumulated.reduce((s, f) => s + f.size, 0) + file.size
        if (projectedTotal > MAX_TOTAL_SIZE_BYTES) {
          newValidationError = `El total superaría los 8 MB`
          continue
        }

        if (accumulated.length >= MAX_FILE_COUNT) {
          newValidationError = `No podés agregar más de 4 archivos`
          continue
        }

        accumulated = [...accumulated, file]
        existingNames.add(file.name)
        added.push(file)
      }

      setValidationError(newValidationError)

      if (added.length > 0) {
        const totalSizeBytes = added.reduce((sum, f) => sum + f.size, 0)
        analyticsService.trackEvent('rag_files_selected', {
          file_count: added.length,
          total_size_bytes: totalSizeBytes,
        })
      }

      return accumulated
    })
  }, [])

  const removeFile = useCallback((name: string) => {
    setFiles((current) => {
      const updated = current.filter((f) => f.name !== name)
      const totalSize = updated.reduce((acc, f) => acc + f.size, 0)
      if (totalSize <= MAX_TOTAL_SIZE_BYTES && updated.length <= MAX_FILE_COUNT) {
        setValidationError(null)
      }
      return updated
    })
  }, [])

  const doSubmit = useCallback(async (filesToSubmit: File[], domainToSubmit: RagDomain) => {
    if (filesToSubmit.length === 0) return
    setStatus('loading')
    setApiError(null)
    try {
      const totalSizeBytes = filesToSubmit.reduce((sum, f) => sum + f.size, 0)
      const ingestResult = await ragService.upload(filesToSubmit, domainToSubmit)
      setStatus('success')
      setResult(ingestResult)
      setFiles([])
      analyticsService.trackEvent('rag_form_submitted', {
        file_count: filesToSubmit.length,
        total_size_bytes: totalSizeBytes,
        domain: domainToSubmit,
      })
    } catch (err) {
      setStatus('error')
      setApiError(err instanceof Error ? err.message : 'No se pudo subir los archivos.')
    }
  }, [])

  const submit = useCallback(async () => {
    if (!canSubmit || domain === null) return
    await doSubmit(files, domain)
  }, [files, domain, canSubmit, doSubmit])

  const retry = useCallback(() => {
    if (domain === null) return
    setStatus('idle')
    setApiError(null)
    doSubmit(files, domain)
  }, [files, domain, doSubmit])

  return {
    files,
    validationError,
    isLoading,
    status,
    apiError,
    domain,
    setDomain,
    result,
    canSubmit,
    addFiles,
    removeFile,
    submit,
    retry,
  }
}
