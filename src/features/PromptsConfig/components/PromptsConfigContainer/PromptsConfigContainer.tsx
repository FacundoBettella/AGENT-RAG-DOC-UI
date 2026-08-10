import type { ReactNode } from 'react'
import { usePromptsConfig } from '../../../../hooks/usePromptsConfig'
import { PromptsConfigContext } from '../../context'
import { PAGE_TITLE, PAGE_SUBTITLE, PAGE_FOOTNOTE } from '../../PromptsConfig.constants'

export interface PromptsConfigContainerProps {
  children: ReactNode
}

export const PromptsConfigContainer = ({ children }: PromptsConfigContainerProps) => {
  const promptsConfig = usePromptsConfig()

  return (
    <PromptsConfigContext.Provider value={promptsConfig}>
      <div className="flex flex-1 flex-col overflow-y-auto p-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
          <header>
            <h1 className="font-serif text-2xl text-on-surface">{PAGE_TITLE}</h1>
            <p className="mt-1 text-on-surface-variant">{PAGE_SUBTITLE}</p>
            <p className="mt-2 text-xs text-on-surface-variant">{PAGE_FOOTNOTE}</p>
          </header>
          {children}
        </div>
      </div>
    </PromptsConfigContext.Provider>
  )
}

export default PromptsConfigContainer
