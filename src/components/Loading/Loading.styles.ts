import styled, { keyframes } from 'styled-components'

export const pulse = keyframes`
  0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
`

export const LoadingWrapper = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
`

export const LoadingDot = styled.span`
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
