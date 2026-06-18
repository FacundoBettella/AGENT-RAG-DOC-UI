import { useState, useCallback } from 'react'
import { ragService } from '../services/ragService'
import { analyticsService } from '../services/analyticsService'

export type UploadStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseRagUploadReturn {
  files: File[] | null
  isLoading: boolean
  status: UploadStatus
  error: string | null
  setFiles: (files: File[]) => void
  submit: () => Promise<void>
  retry: () => void
}

export function useRagUpload(): UseRagUploadReturn {
  const [files, setFilesState] = useState<File[] | null>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const isLoading = status === 'loading'

  const setFiles = useCallback((newFiles: File[]) => {
    setFilesState(newFiles)
    setStatus('idle')
    setError(null)
    const totalSizeBytes = newFiles.reduce((sum, f) => sum + f.size, 0)
    analyticsService.trackEvent('rag_files_selected', {
      file_count: newFiles.length,
      total_size_bytes: totalSizeBytes,
    })
  }, [])

  const submit = useCallback(async () => {
    if (!files || files.length === 0) return

    setStatus('loading')
    setError(null)

    try {
      const totalSizeBytes = files.reduce((sum, f) => sum + f.size, 0)
      await ragService.upload(files)
      setStatus('success')
      analyticsService.trackEvent('rag_form_submitted', {
        file_count: files.length,
        total_size_bytes: totalSizeBytes,
      })
    } catch {
      setStatus('error')
      setError('No se pudo subir los archivos. Intentá de nuevo.')
    }
  }, [files])

  const retry = useCallback(() => {
    setStatus('idle')
    setError(null)
    submit()
  }, [submit])

  return {
    files,
    isLoading,
    status,
    error,
    setFiles,
    submit,
    retry,
  }
}
