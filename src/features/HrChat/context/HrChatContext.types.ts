import type { MutableRefObject, RefObject } from 'react'
import type { Exchange } from '../../../hooks/useHrChat'
import type { HrChunk } from '../../../services/hrService'
import type { Suggestion } from '../HrChat.types'

export interface HrChatContextValue {
  exchanges: Exchange[]
  isLoading: boolean
  error: string | null
  pendingQuestion: string | null
  inputValue: string
  setInputValue: (value: string) => void
  submitQuestion: (question: string) => void
  handleRetry: () => void
  handleSuggestionClick: (suggestion: Suggestion) => void
  textareaRef: RefObject<HTMLTextAreaElement>
  bottomRef: RefObject<HTMLDivElement>
  pendingAskedAtRef: MutableRefObject<number | null>
  greetingAskedAt: number
  hasExchanges: boolean
  lastChunks: HrChunk[]
}
