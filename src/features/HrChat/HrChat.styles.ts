import styled from 'styled-components'
import { pulse } from '../../components/Loading/Loading.styles'

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  max-width: 820px;
  margin: 0 auto;
  width: 100%;
`

export const MessagesArea = styled.div`
  flex-grow: 1;
  overflow-y: auto;
  padding: 1.5rem 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export const WelcomeMessage = styled.p`
  margin: auto;
  text-align: center;
  color: var(--color-gold);
  font-size: 1.75rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
  opacity: 0.72;
`

export const BubbleWrapper = styled.div<{ $align: 'left' | 'right' }>`
  display: flex;
  flex-direction: row;
  justify-content: ${({ $align }) =>
    $align === 'right' ? 'flex-end' : 'flex-start'};
`

export const MessageBubble = styled.div<{ $variant: 'user' | 'assistant' }>`
  background: ${({ $variant }) =>
    $variant === 'user'
      ? 'var(--color-surface-alt)'
      : 'var(--color-surface)'};
  color: var(--color-text-primary);
  border-radius: ${({ $variant }) =>
    $variant === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px'};
  padding: 0.75rem 1rem;
  max-width: 72%;
  overflow-wrap: break-word;
  overflow-y: auto;
  white-space: pre-wrap;
  font-size: 0.9375rem;
  line-height: 1.55;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
`

export const ThinkingDot = styled.span`
  display: inline-block;
  width: 0.5rem;
  height: 0.5rem;
  margin: 0 0.1rem;
  border-radius: 50%;
  background: var(--color-gold-bright);
  animation: ${pulse} 1.4s infinite ease-in-out;

  &:nth-child(1) { animation-delay: 0s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
`

export const ThinkingWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: var(--color-gold-bright);
  font-style: italic;
  font-size: 0.875rem;
`

export const ErrorBubble = styled.div`
  background: var(--color-error);
  color: var(--color-error-text);
  border-radius: 0.5rem;
  padding: 0.625rem 0.875rem;
  max-width: 75%;
  overflow-wrap: break-word;
`

export const RetryButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: transparent;
  color: var(--color-gold);
  border: 1px solid var(--color-gold);
  border-radius: 0.375rem;
  cursor: pointer;
  font-family: 'Georgia', serif;
  font-size: 0.875rem;

  &:hover {
    background: var(--color-gold);
    color: var(--color-bg);
  }
`

export const InputArea = styled.div`
  padding: 0.875rem 1.25rem 1.125rem;
  position: relative;
  z-index: 1;
`

export const InputWrapper = styled.div`
  display: flex;
  background: var(--color-bg);
  border-radius: 14px;
  box-shadow: var(--shadow-input);
  transition: box-shadow 0.2s ease;

  &:focus-within {
    box-shadow: var(--shadow-input), 0 0 0 3px rgba(201, 168, 76, 0.15);
  }
`

export const StyledTextarea = styled.textarea`
  flex: 1;
  background: transparent;
  color: var(--color-text-primary);
  border: none;
  padding: 0.75rem 1rem;
  resize: none;
  font-size: 0.9375rem;
  line-height: 1.5;
  min-height: 3.25rem;
  max-height: 10rem;
  overflow-y: auto;

  &::placeholder {
    color: var(--color-text-muted);
  }

  &:focus {
    outline: none;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const SendButton = styled.button`
  border: none;
  border-left: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 0 12px 12px 0;
  background: var(--color-gold);
  color: var(--color-bg);
  width: 3.25rem;
  flex-shrink: 0;
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1;
  transition: background-color 0.2s ease, opacity 0.2s ease;

  &:hover:not(:disabled) {
    background: var(--color-gold-bright);
  }

  &:active:not(:disabled) {
    opacity: 0.85;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`
