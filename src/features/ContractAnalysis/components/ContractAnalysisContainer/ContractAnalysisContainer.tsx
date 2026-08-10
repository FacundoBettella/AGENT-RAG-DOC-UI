import type { ReactNode } from 'react'
import { useContractAnalysis } from '../../../../hooks/useContractAnalysis'
import { ContractAnalysisContext } from '../../context'
import { PAGE_TITLE, PAGE_SUBTITLE } from '../../ContractAnalysis.constants'

export interface ContractAnalysisContainerProps {
  children: ReactNode
}

export const ContractAnalysisContainer = ({ children }: ContractAnalysisContainerProps) => {
  const contractAnalysis = useContractAnalysis()

  return (
    <ContractAnalysisContext.Provider value={contractAnalysis}>
      <div className="flex flex-1 flex-col overflow-hidden p-8">
        <h1 className="font-serif text-2xl text-on-surface">{PAGE_TITLE}</h1>
        <p className="mt-1 text-on-surface-variant">{PAGE_SUBTITLE}</p>
        <div className="mt-6 flex flex-1 gap-6 overflow-hidden">{children}</div>
      </div>
    </ContractAnalysisContext.Provider>
  )
}

export default ContractAnalysisContainer
