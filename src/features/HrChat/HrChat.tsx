import { useEffect, useRef } from 'react'
import { useHrChat } from '../../hooks/useHrChat'
import {
  BubbleWrapper,
  ChatContainer,
  ErrorBubble,
  InputArea,
  InputWrapper,
  MessageBubble,
  MessagesArea,
  RetryButton,
  SendButton,
  StyledTextarea,
  ThinkingDot,
  ThinkingWrapper,
  WelcomeMessage,
} from './HrChat.styles'

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

  // Auto-focus on mount
  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  // Scroll to bottom when exchanges or loading state changes
  useEffect(() => {
    if (bottomRef.current && typeof bottomRef.current.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [exchanges, isLoading])

  // Re-focus after loading ends
  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus()
    }
  }, [isLoading])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!isLoading) {
        submitQuestion(inputValue)
      }
    }
  }

  // isEmpty: no exchanges, not loading, no error, no pending question
  const isEmpty = exchanges.length === 0 && !isLoading && !error && pendingQuestion === null

  return (
    <div data-testid="hr-chat">
      <ChatContainer>
        <MessagesArea>
          {isEmpty && (
            <WelcomeMessage>¿En qué puedo ayudarte hoy?</WelcomeMessage>
          )}

          {exchanges.map((ex, idx) => (
            <div key={idx}>
              <BubbleWrapper $align="right">
                <MessageBubble $variant="user">{ex.question}</MessageBubble>
              </BubbleWrapper>
              <BubbleWrapper $align="left">
                <MessageBubble $variant="assistant">{ex.answer}</MessageBubble>
              </BubbleWrapper>
            </div>
          ))}

          {pendingQuestion !== null && (
            <BubbleWrapper $align="right">
              <MessageBubble $variant="user">{pendingQuestion}</MessageBubble>
            </BubbleWrapper>
          )}

          {isLoading && (
            <BubbleWrapper $align="left">
              <ThinkingWrapper>
                <span>Mercurial está procesando tu consulta</span>
                <ThinkingDot />
                <ThinkingDot />
                <ThinkingDot />
              </ThinkingWrapper>
            </BubbleWrapper>
          )}

          {error !== null && (
            <BubbleWrapper $align="left">
              <ErrorBubble>
                <div>{error}</div>
                <RetryButton type="button" onClick={handleRetry}>
                  Reintentar
                </RetryButton>
              </ErrorBubble>
            </BubbleWrapper>
          )}

          <div ref={bottomRef} />
        </MessagesArea>

        <InputArea>
          <InputWrapper>
            <StyledTextarea
              ref={textareaRef}
              aria-label="Escribe tu pregunta"
              value={inputValue}
              disabled={isLoading}
              rows={1}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <SendButton
              type="button"
              aria-label="Enviar"
              disabled={isLoading}
              onClick={() => submitQuestion(inputValue)}
            >
              ↑
            </SendButton>
          </InputWrapper>
        </InputArea>
      </ChatContainer>
    </div>
  )
}

export default HrChat
