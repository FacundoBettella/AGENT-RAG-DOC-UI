import ReactGA from 'react-ga4'

export type EventName =
  | 'chat_message_sent'
  | 'chat_retry_clicked'
  | 'rag_form_submitted'
  | 'rag_files_selected'

const gaId = import.meta.env.VITE_GA_ID as string | undefined
if (gaId) {
  ReactGA.initialize(gaId)
}

export const analyticsService = {
  trackEvent(name: EventName, payload?: Record<string, unknown>): void {
    try {
      if (gaId) {
        ReactGA.event(name, payload)
        return
      }
      if (payload !== undefined) {
        const json = JSON.stringify(payload)
        console.info(`[analytics] ${name} ${json}`)
      } else {
        console.info(`[analytics] ${name}`)
      }
    } catch {
      // never propagate
    }
  },
}
