import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const FooterWrapper = styled.footer`
  background: var(--color-surface);
  border-top: 1px solid var(--color-border);
  padding: 0.5rem 1.25rem;
  display: flex;
  justify-content: center;
  align-items: center;
`

export const FooterLink = styled(Link)`
  color: var(--color-text-muted);
  font-size: 0.75rem;
  text-decoration: none;

  &:hover {
    color: var(--color-gold);
  }
`
