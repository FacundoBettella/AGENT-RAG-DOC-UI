import styled from 'styled-components'
import { Link } from 'react-router-dom'

export const Wrapper = styled.div`
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
`

export const Header = styled.header`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1.25rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-shadow: 0 1px 8px rgba(0, 0, 0, 0.25);
  position: relative;
  z-index: 10;
`

export const HeaderLink = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  color: inherit;

  &:hover {
    text-decoration: none;
  }
`

export const HeaderTitle = styled.span`
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--color-gold);
`

export const HeaderSeparator = styled.span`
  font-size: 1rem;
  color: var(--color-text-muted);
`

export const HeaderSubtitle = styled.span`
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
  letter-spacing: 0.02em;
`

export const CaduceoSymbol = styled.span`
  font-size: 1.5rem;
  color: var(--color-gold);
  line-height: 1;
`

export const GearButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted);
  font-size: 1.25rem;
  padding: 0.25rem;
  margin-left: auto;
  display: flex;
  align-items: center;
  border-radius: 4px;
  transition: background-color 0.2s ease, color 0.2s ease, transform 0.15s ease;

  &:hover {
    color: var(--color-gold);
    background: var(--color-surface-alt);
  }
`

export const DropdownMenu = styled.div`
  position: absolute;
  top: 100%;
  right: 0.5rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 180px;
  z-index: 100;
`

export const ThemeSwitchRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-primary);
`

export const SwitchButton = styled.button`
  position: relative;
  width: 42px;
  height: 24px;
  border-radius: 12px;
  border: none;
  cursor: pointer;
  background: var(--color-surface-alt);
  transition: background-color 0.25s ease;
  flex-shrink: 0;

  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: 3px;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    background: var(--color-text-muted);
    transition: transform 0.25s ease, background-color 0.25s ease;
  }

  &[aria-checked="true"] {
    background: var(--color-gold);

    &::after {
      transform: translateX(18px);
      background: var(--color-bg);
    }
  }
`

export const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`

export const RagLink = styled.a`
  font-size: 0.875rem;
  color: var(--color-gold);
  text-decoration: none;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  transition: background-color 0.2s ease, transform 0.15s ease;

  &:hover {
    background: var(--color-surface-alt);
  }
`
