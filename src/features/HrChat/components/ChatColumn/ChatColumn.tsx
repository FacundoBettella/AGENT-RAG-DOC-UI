import { useEffect } from 'react'
import type { KeyboardEvent } from 'react'
import { useHrChatContext } from '../../context'
import {
  ASSISTANT_NAME,
  USER_NAME,
  GREETING_TEXT,
  THINKING_TEXT,
  RETRY_LABEL,
  INPUT_PLACEHOLDER,
  INPUT_DISCLAIMER,
} from '../../HrChat.constants'
import { formatMessageTime } from '../../HrChat.utils'
import MessageBubble from '../MessageBubble'

export const ChatColumn = () => {
  const {
    exchanges,
    isLoading,
    error,
    pendingQuestion,
    inputValue,
    setInputValue,
    submitQuestion,
    handleRetry,
    textareaRef,
    bottomRef,
    pendingAskedAtRef,
    greetingAskedAt,
  } = useHrChatContext()

  useEffect(() => {
    textareaRef.current?.focus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exchanges, isLoading])

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      if (!isLoading) {
        submitQuestion(inputValue)
      }
    }
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-6">
        <MessageBubble
          variant="assistant"
          authorName={ASSISTANT_NAME}
          text={GREETING_TEXT}
          time={formatMessageTime(greetingAskedAt)}
        />

        {exchanges.map((exchange, index) => (
          <div key={index} className="space-y-4">
            <MessageBubble
              variant="user"
              authorName={USER_NAME}
              text={exchange.question}
              time={formatMessageTime(exchange.askedAt)}
            />
            <MessageBubble
              variant="assistant"
              authorName={ASSISTANT_NAME}
              text={exchange.answer}
              time={formatMessageTime(exchange.answeredAt)}
            />
          </div>
        ))}

        {pendingQuestion !== null && (
          <MessageBubble
            variant="user"
            authorName={USER_NAME}
            text={pendingQuestion}
            time={formatMessageTime(pendingAskedAtRef.current ?? Date.now())}
          />
        )}

        {isLoading && (
          <div className="flex items-center gap-2 pl-12 text-sm italic text-on-surface-variant">
            <span>{THINKING_TEXT}</span>
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:0s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-on-surface-variant [animation-delay:0.4s]" />
            </span>
          </div>
        )}

        {error !== null && (
          <div className="ml-12 max-w-[75%] rounded-xl bg-error-container px-4 py-3 text-on-error-container">
            <p>{error}</p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-2 rounded-md border border-on-error-container px-3 py-1 text-sm font-medium"
            >
              {RETRY_LABEL}
            </button>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="border-t border-outline-variant px-6 py-4">
        <div className="flex items-end gap-2 rounded-2xl border border-outline-variant bg-surface-container-low px-3 py-2">
          <textarea
            ref={textareaRef}
            aria-label="Escribe tu pregunta"
            placeholder={INPUT_PLACEHOLDER}
            value={inputValue}
            disabled={isLoading}
            rows={1}
            onChange={(event) => setInputValue(event.target.value)}
            onKeyDown={handleKeyDown}
            className="h-14 flex-1 resize-none overflow-y-auto bg-transparent text-on-surface outline-none placeholder:text-on-surface-variant disabled:opacity-50"
          />
          <button
            type="button"
            aria-label="Enviar"
            disabled={isLoading}
            onClick={() => submitQuestion(inputValue)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary disabled:opacity-40"
          >
            <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
              send
            </span>
          </button>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">{INPUT_DISCLAIMER}</p>
      </div>
    </div>
  )
}

export default ChatColumn
