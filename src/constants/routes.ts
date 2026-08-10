export const ROUTES = {
  CHAT: '/',
  CONTRACTS: '/contracts',
  RAG: '/rag',
  SETTINGS: '/settings',
  FAQ: '/faq',
} as const

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES]
