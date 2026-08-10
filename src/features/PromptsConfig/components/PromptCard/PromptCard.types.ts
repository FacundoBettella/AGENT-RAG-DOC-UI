import type { PromptEditor } from '../../PromptsConfig.types'

export interface PromptCardProps {
  editor: PromptEditor
  onChangeDraft: (agentName: string, value: string) => void
  onDiscard: (agentName: string) => void
  onRequestSave: (agentName: string) => void
}
