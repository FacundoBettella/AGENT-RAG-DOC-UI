export const API_ROUTES = {
  QUERY: '/api/query',
  ANALYSIS: '/analysis',
  PROMPTS: '/prompts',
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
