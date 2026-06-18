declare module 'react-ga4' {
  const ReactGA: {
    initialize(trackingId: string): void
    event(name: string, params?: Record<string, unknown>): void
  }
  export default ReactGA
}
