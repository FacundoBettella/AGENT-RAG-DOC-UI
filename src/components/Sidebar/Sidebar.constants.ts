import { ROUTES } from '../../constants'

export interface NavItem {
  readonly label: string
  readonly icon: string
  readonly path: string
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Chatbot IA', icon: 'smart_toy', path: ROUTES.CHAT },
  { label: 'Analizador de Contratos', icon: 'description', path: ROUTES.CONTRACTS },
  { label: 'Base de conocimiento', icon: 'library_books', path: ROUTES.RAG },
  { label: 'Configuración', icon: 'settings', path: ROUTES.SETTINGS },
] as const
