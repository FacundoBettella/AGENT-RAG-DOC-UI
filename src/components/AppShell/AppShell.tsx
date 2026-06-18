import { useState } from 'react'
import { Link } from 'react-router-dom'
import GlobalStyles from './GlobalStyles'
import {
  Wrapper,
  Header,
  HeaderLink,
  HeaderTitle,
  HeaderSeparator,
  HeaderSubtitle,
  CaduceoSymbol,
  GearButton,
  DropdownMenu,
  ThemeSwitchRow,
  SwitchButton,
  RagLink,
  Main,
} from './AppShell.styles'
import { useTheme } from '../../hooks/useTheme'
import Footer from '../Footer/Footer'

type Props = { children: React.ReactNode }

function AppShell({ children }: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const { theme, setTheme } = useTheme()

  function toggleMenu() {
    setMenuOpen((prev) => !prev)
  }

  function handleThemeToggle() {
    setTheme(theme === 'dark' ? 'light' : 'dark')
  }

  return (
    <>
      <GlobalStyles />
      <Wrapper data-testid="app-shell-root">
        <Header>
          <HeaderLink to="/" aria-label="Ir al chat">
            <CaduceoSymbol aria-label="Caduceo de Hermes" role="img">⚕</CaduceoSymbol>
            <HeaderTitle>Mercurial</HeaderTitle>
            <HeaderSeparator>—</HeaderSeparator>
            <HeaderSubtitle>Consultas de RR.HH.</HeaderSubtitle>
          </HeaderLink>
          <GearButton
            type="button"
            aria-label="Configuración"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            onClick={toggleMenu}
          >
            ⚙
          </GearButton>
          {menuOpen && (
            <DropdownMenu role="menu">
              <ThemeSwitchRow>
                <span>Tema</span>
                <SwitchButton
                  role="switch"
                  type="button"
                  aria-checked={theme === 'light'}
                  aria-label="Cambiar tema"
                  onClick={handleThemeToggle}
                />
              </ThemeSwitchRow>
              <RagLink as={Link} to="/rag" href="/rag">
                RAG — Carga de conocimiento
              </RagLink>
            </DropdownMenu>
          )}
        </Header>
        <Main>{children}</Main>
        <Footer />
      </Wrapper>
    </>
  )
}

export default AppShell
