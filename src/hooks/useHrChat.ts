import { useState, useCallback } from 'react'
import { hrService, type HrChunk } from '../services/hrService'
import { analyticsService } from '../services/analyticsService'

export interface Exchange {
  question: string
  answer: string
  chunks: HrChunk[]
  askedAt: number
  answeredAt: number
}

export interface UseHrChatReturn {
  exchanges: Exchange[]
  isLoading: boolean
  error: string | null
  lastQuestion: string
  pendingQuestion: string | null
  inputValue: string
  setInputValue: (value: string) => void
  submitQuestion: (question: string) => Promise<void>
  handleRetry: () => void
}

export function useHrChat(): UseHrChatReturn {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastQuestion, setLastQuestion] = useState('')
  const [pendingQuestion, setPendingQuestion] = useState<string | null>(null)
  const [inputValue, setInputValue] = useState('')

  const submitQuestion = useCallback(async (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return

    const askedAt = Date.now()
    setLastQuestion(trimmed)
    setPendingQuestion(trimmed)
    setInputValue('')
    setError(null)
    setIsLoading(true)
    analyticsService.trackEvent('chat_message_sent', { question_length: trimmed.length })

    try {
      const { answer, chunks } = await hrService.query(trimmed)
      setExchanges((prev) => [
        ...prev,
        { question: trimmed, answer, chunks, askedAt, answeredAt: Date.now() },
      ])
      setPendingQuestion(null)
    } catch {
      setError('No se pudo obtener respuesta. Intentá de nuevo.')
      setPendingQuestion(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const handleRetry = useCallback(() => {
    setError(null)
    analyticsService.trackEvent('chat_retry_clicked', { question_length: lastQuestion.length })
    submitQuestion(lastQuestion)
  }, [lastQuestion, submitQuestion])

  return {
    exchanges,
    isLoading,
    error,
    lastQuestion,
    pendingQuestion,
    inputValue,
    setInputValue,
    submitQuestion,
    handleRetry,
  }
}
