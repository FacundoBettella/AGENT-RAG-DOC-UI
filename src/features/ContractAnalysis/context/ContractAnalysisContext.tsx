import { createContext, useContext } from 'react'
import type { ContractAnalysisContextValue } from './ContractAnalysisContext.types'

export const ContractAnalysisContext = createContext<ContractAnalysisContextValue | undefined>(
  undefined
)

export const useContractAnalysisContext = (): ContractAnalysisContextValue => {
  const context = useContext(ContractAnalysisContext)

  if (!context) {
    throw new Error(
      'useContractAnalysisContext debe usarse dentro de <ContractAnalysisContext.Provider>'
    )
  }

  return context
}
