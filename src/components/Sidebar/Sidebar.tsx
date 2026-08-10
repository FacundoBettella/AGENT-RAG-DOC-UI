import { Link, NavLink } from 'react-router-dom'
import { useTheme } from '../../hooks/useTheme'
import { ROUTES } from '../../constants'
import { NAV_ITEMS } from './Sidebar.constants'

const LINK_BASE_CLASSES =
  'flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
const LINK_ACTIVE_CLASSES = 'bg-primary text-on-primary'
const LINK_INACTIVE_CLASSES = 'text-on-surface-variant hover:bg-surface-container'

export const Sidebar = () => {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  const handleThemeToggle = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed left-0 top-0 flex h-full w-72 flex-col bg-surface-container-low"
    >
      <Link
        to={ROUTES.CHAT}
        aria-label="Ir al chat"
        className="flex items-center gap-2 px-6 py-8 no-underline"
      >
        <span role="img" aria-label="Caduceo de Hermes" className="font-serif text-2xl text-primary">
          ⚕
        </span>
        <span className="font-serif text-xl text-primary">Mercurial</span>
      </Link>

      <ul className="flex-1 space-y-2 px-4">
        {NAV_ITEMS.map((item) => (
          <li key={item.path}>
            <NavLink
              to={item.path}
              end
              className={({ isActive }) =>
                `${LINK_BASE_CLASSES} ${isActive ? LINK_ACTIVE_CLASSES : LINK_INACTIVE_CLASSES}`
              }
            >
              <span className="material-symbols-outlined text-[22px]" aria-hidden="true">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-3 border-t border-outline-variant px-6 py-6">
        <span className="material-symbols-outlined text-on-surface-variant" aria-hidden="true">
          {isDark ? 'dark_mode' : 'light_mode'}
        </span>
        <span className="flex-1 text-sm text-on-surface-variant">
          Tema {isDark ? 'oscuro' : 'claro'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={isDark}
          aria-label="Cambiar tema"
          onClick={handleThemeToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            isDark ? 'bg-primary' : 'bg-surface-container-high'
          } focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
        >
          <span
            aria-hidden="true"
            className={`inline-block h-4 w-4 rounded-full bg-surface transition-transform ${
              isDark ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </nav>
  )
}

export default Sidebar
