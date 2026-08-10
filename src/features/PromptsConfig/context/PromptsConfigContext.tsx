import { createContext, useContext } from 'react'
import type { PromptsConfigContextValue } from './PromptsConfigContext.types'

export const PromptsConfigContext = createContext<PromptsConfigContextValue | undefined>(
  undefined
)

export const usePromptsConfigContext = (): PromptsConfigContextValue => {
  const context = useContext(PromptsConfigContext)

  if (!context) {
    throw new Error(
      'usePromptsConfigContext debe usarse dentro de <PromptsConfigContext.Provider>'
    )
  }

  return context
}
