import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const PageWrapper = styled.div`
  padding: 2rem 1.25rem;
  max-width: 700px;
  margin: 0 auto;
  overflow-x: hidden;
`

export const PageTitle = styled.h1`
  color: var(--color-gold);
  margin-bottom: 1rem;
  font-size: 1.5rem;
`

export const BackLink = styled(Link)`
  display: inline-block;
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  margin-bottom: 2rem;

  &:hover {
    color: var(--color-gold);
  }
`

export const FaqList = styled.section`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`

export const FaqItem = styled.article``

export const FaqQuestion = styled.h2`
  color: var(--color-text-primary);
  font-size: 1.05rem;
  margin-bottom: 0.5rem;
`

export const FaqAnswer = styled.p`
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin: 0;
`
