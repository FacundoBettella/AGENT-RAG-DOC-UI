import { useState, useCallback } from 'react'
import { hrService, type HrChunk } from '../services/hrService'
import { analyticsService } from '../services/analyticsService'

export interface ExchangeFeedback {
  vote: boolean | null
  confirmedVote: boolean | null
  isSending: boolean
  hasError: boolean
}

export interface Exchange {
  question: string
  answer: string
  chunks: HrChunk[]
  askedAt: number
  answeredAt: number
  traceId: string | null
  feedback: ExchangeFeedback
}

const INITIAL_FEEDBACK: ExchangeFeedback = {
  vote: null,
  confirmedVote: null,
  isSending: false,
  hasError: false,
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
  sendFeedback: (index: number, helpful: boolean) => Promise<void>
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
      const { answer, chunks, traceId } = await hrService.query(trimmed)
      setExchanges((prev) => [
        ...prev,
        {
          question: trimmed,
          answer,
          chunks,
          askedAt,
          answeredAt: Date.now(),
          traceId,
          feedback: INITIAL_FEEDBACK,
        },
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

  const updateFeedback = useCallback((index: number, patch: Partial<ExchangeFeedback>) => {
    setExchanges((prev) =>
      prev.map((exchange, i) =>
        i === index ? { ...exchange, feedback: { ...exchange.feedback, ...patch } } : exchange
      )
    )
  }, [])

  const sendFeedback = useCallback(
    async (index: number, helpful: boolean) => {
      const exchange = exchanges[index]
      if (!exchange || exchange.traceId === null) return
      if (exchange.feedback.isSending || exchange.feedback.vote === helpful) return

      updateFeedback(index, { vote: helpful, isSending: true })
      try {
        await hrService.sendFeedback(exchange.traceId, helpful)
        updateFeedback(index, { confirmedVote: helpful, isSending: false, hasError: false })
      } catch {
        updateFeedback(index, {
          vote: exchange.feedback.confirmedVote,
          isSending: false,
          hasError: true,
        })
      }
    },
    [exchanges, updateFeedback]
  )

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
    sendFeedback,
  }
}
