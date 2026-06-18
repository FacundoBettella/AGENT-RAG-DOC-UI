import { useLocation } from 'react-router-dom'
import { FooterWrapper, FooterLink } from './Footer.styles'

function Footer() {
  const location = useLocation()
  const isActive = location.pathname === '/faq'

  return (
    <FooterWrapper>
      <FooterLink
        to="/faq"
        aria-current={isActive ? 'page' : undefined}
      >
        Preguntas frecuentes
      </FooterLink>
    </FooterWrapper>
  )
}

export default Footer
