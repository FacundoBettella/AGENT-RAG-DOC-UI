export const API_ROUTES = {
  QUERY: '/api/query',
  FEEDBACK: '/api/feedback',
  INGEST: '/api/ingest',
  ANALYSIS: '/analysis',
  PROMPTS: '/prompts',
} as const

export type ApiRoute = (typeof API_ROUTES)[keyof typeof API_ROUTES]
