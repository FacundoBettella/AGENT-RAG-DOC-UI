import { createContext, useContext } from 'react'
import type { HrChatContextValue } from './HrChatContext.types'

export const HrChatContext = createContext<HrChatContextValue | undefined>(undefined)

export const useHrChatContext = (): HrChatContextValue => {
  const context = useContext(HrChatContext)

  if (!context) {
    throw new Error('useHrChatContext debe usarse dentro de <HrChatContext.Provider>')
  }

  return context
}
