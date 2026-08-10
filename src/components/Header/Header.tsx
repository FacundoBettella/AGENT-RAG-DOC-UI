import { useNavigate } from 'react-router-dom'
import { ROUTES } from '../../constants'

export const Header = () => {
  const navigate = useNavigate()

  const handleHelpClick = () => {
    navigate(ROUTES.FAQ)
  }

  return (
    <header className="sticky top-0 z-10 flex items-center justify-end border-b border-outline-variant bg-surface px-8 py-4">
      <button
        type="button"
        onClick={handleHelpClick}
        className="flex items-center gap-2 font-medium text-on-surface transition-colors hover:text-primary"
      >
        <span>Ayuda</span>
        <span className="material-symbols-outlined text-xl" aria-hidden="true">
          help_outline
        </span>
      </button>
    </header>
  )
}

export default Header
