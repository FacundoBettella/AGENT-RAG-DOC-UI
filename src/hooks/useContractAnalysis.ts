import { useCallback, useState } from 'react'
import { docAgentService, type ContractAnalysis } from '../services/docAgentService'
import { analyticsService } from '../services/analyticsService'

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024
export const VALID_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.docx']

export const UNSUPPORTED_FORMAT_MESSAGE =
  'Formato no soportado. Subí un archivo .png, .jpg, .jpeg o .docx.'
export const FILE_TOO_LARGE_MESSAGE = 'El archivo supera el límite de 10 MB.'

export type ContractAnalysisStatus = 'idle' | 'loading' | 'success' | 'error'

export interface UseContractAnalysisReturn {
  originalFile: File | null
  amendmentFile: File | null
  originalError: string | null
  amendmentError: string | null
  status: ContractAnalysisStatus
  result: ContractAnalysis | null
  error: string | null
  canSubmit: boolean
  selectOriginal: (file: File) => void
  selectAmendment: (file: File) => void
  removeOriginal: () => void
  removeAmendment: () => void
  submit: () => void
  retry: () => void
}

function validateFile(file: File): string | null {
  const lowerName = file.name.toLowerCase()
  const hasValidExtension = VALID_EXTENSIONS.some((ext) => lowerName.endsWith(ext))
  if (!hasValidExtension) {
    return UNSUPPORTED_FORMAT_MESSAGE
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return FILE_TOO_LARGE_MESSAGE
  }
  return null
}

export function useContractAnalysis(): UseContractAnalysisReturn {
  const [originalFile, setOriginalFile] = useState<File | null>(null)
  const [amendmentFile, setAmendmentFile] = useState<File | null>(null)
  const [originalError, setOriginalError] = useState<string | null>(null)
  const [amendmentError, setAmendmentError] = useState<string | null>(null)
  const [status, setStatus] = useState<ContractAnalysisStatus>('idle')
  const [result, setResult] = useState<ContractAnalysis | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectOriginal = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setOriginalError(validationError)
      return
    }
    setOriginalError(null)
    setOriginalFile(file)
  }, [])

  const selectAmendment = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setAmendmentError(validationError)
      return
    }
    setAmendmentError(null)
    setAmendmentFile(file)
  }, [])

  const removeOriginal = useCallback(() => {
    setOriginalFile(null)
  }, [])

  const removeAmendment = useCallback(() => {
    setAmendmentFile(null)
  }, [])

  const canSubmit = originalFile !== null && amendmentFile !== null && status !== 'loading'

  const runAnalysis = useCallback(async (original: File, amendment: File) => {
    setStatus('loading')
    setResult(null)
    setError(null)
    try {
      const analysis = await docAgentService.analyze(original, amendment)
      setResult(analysis)
      setStatus('success')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el análisis.')
      setStatus('error')
    }
  }, [])

  const submit = useCallback(() => {
    if (!canSubmit || originalFile === null || amendmentFile === null) return
    analyticsService.trackEvent('contract_analysis_submitted', {
      originalSizeBytes: originalFile.size,
      amendmentSizeBytes: amendmentFile.size,
    })
    void runAnalysis(originalFile, amendmentFile)
  }, [canSubmit, originalFile, amendmentFile, runAnalysis])

  const retry = useCallback(() => {
    if (originalFile === null || amendmentFile === null) return
    void runAnalysis(originalFile, amendmentFile)
  }, [originalFile, amendmentFile, runAnalysis])

  return {
    originalFile,
    amendmentFile,
    originalError,
    amendmentError,
    status,
    result,
    error,
    canSubmit,
    selectOriginal,
    selectAmendment,
    removeOriginal,
    removeAmendment,
    submit,
    retry,
  }
}
