export const API_ROUTES = {
  QUERY: '/api/query',
  ANALYSIS: '/analysis',
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
