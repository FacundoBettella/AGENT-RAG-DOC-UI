import { useState, useCallback } from 'react'
import { ragService } from '../services/ragService'
import { formatFileSize } from '../utils/formatFileSize'

export { formatFileSize }

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

  const isLoading = status === 'loading'

  const addFiles = useCallback((incoming: File[]) => {
    setFiles((current) => {
      const existingNames = new Set(current.map((f) => f.name))

      let accumulated = [...current]
      let newValidationError: string | null = null

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
      }

      setValidationError(newValidationError)
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

  const doSubmit = useCallback(async (filesToSubmit: File[]) => {
    if (filesToSubmit.length === 0) return
    setStatus('loading')
    setApiError(null)
    try {
      await ragService.upload(filesToSubmit)
      setStatus('success')
      setFiles([])
    } catch (err) {
      setStatus('error')
      setApiError(err instanceof Error ? err.message : 'No se pudo subir los archivos.')
    }
  }, [])

  const submit = useCallback(async () => {
    await doSubmit(files)
  }, [files, doSubmit])

  const retry = useCallback(() => {
    setStatus('idle')
    setApiError(null)
    doSubmit(files)
  }, [files, doSubmit])

  return {
    files,
    validationError,
    isLoading,
    status,
    apiError,
    addFiles,
    removeFile,
    submit,
    retry,
  }
}
