import { useCallback, useMemo, useRef } from 'react'
import { useHrChat } from '../../hooks/useHrChat'
import { analyticsService } from '../../services/analyticsService'
import { HrChatContext } from './context'
import type { HrChatContextValue } from './context'
import type { Suggestion } from './HrChat.types'
import ChatColumn from './components/ChatColumn'
import ContextPanel from './components/ContextPanel'

function HrChat() {
  const {
    exchanges,
    isLoading,
    error,
    pendingQuestion,
    inputValue,
    setInputValue,
    submitQuestion,
    handleRetry,
  } = useHrChat()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const pendingAskedAtRef = useRef<number | null>(null)
  const greetingAskedAtRef = useRef<number>(Date.now())

  const handleSubmit = useCallback(
    (question: string) => {
      if (question.trim() !== '') {
        pendingAskedAtRef.current = Date.now()
      }
      submitQuestion(question)
    },
    [submitQuestion]
  )

  const handleSuggestionClick = useCallback(
    (suggestion: Suggestion) => {
      setInputValue(suggestion.text)
      textareaRef.current?.focus()
      analyticsService.trackEvent('chat_suggestion_clicked', { suggestion: suggestion.text })
    },
    [setInputValue]
  )

  const lastChunks = useMemo(() => exchanges[exchanges.length - 1]?.chunks ?? [], [exchanges])

  const value = useMemo<HrChatContextValue>(
    () => ({
      exchanges,
      isLoading,
      error,
      pendingQuestion,
      inputValue,
      setInputValue,
      submitQuestion: handleSubmit,
      handleRetry,
      handleSuggestionClick,
      textareaRef,
      bottomRef,
      pendingAskedAtRef,
      greetingAskedAt: greetingAskedAtRef.current,
      hasExchanges: exchanges.length > 0,
      lastChunks,
    }),
    [
      exchanges,
      isLoading,
      error,
      pendingQuestion,
      inputValue,
      setInputValue,
      handleSubmit,
      handleRetry,
      handleSuggestionClick,
      lastChunks,
    ]
  )

  return (
    <HrChatContext.Provider value={value}>
      <div data-testid="hr-chat" className="flex flex-1 overflow-hidden">
        <ChatColumn />
        <ContextPanel />
      </div>
    </HrChatContext.Provider>
  )
}

export default HrChat
