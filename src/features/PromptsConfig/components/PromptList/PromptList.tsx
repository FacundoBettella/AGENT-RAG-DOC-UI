import { usePromptsConfigContext } from '../../context'
import { PromptCard } from '../PromptCard'
import { ConfirmSaveModal } from '../ConfirmSaveModal'
import { getAgentLabel, LOADING_MESSAGE, LOAD_ERROR_MESSAGE, RETRY_LABEL } from '../../PromptsConfig.constants'

export const PromptList = () => {
  const {
    loadStatus,
    loadError,
    editors,
    confirmingAgent,
    changeDraft,
    discardDraft,
    requestSave,
    confirmSave,
    cancelSave,
    reload,
  } = usePromptsConfigContext()

  if (loadStatus === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl bg-surface-container p-8 text-center">
        <span
          className="material-symbols-outlined animate-spin text-3xl text-primary"
          aria-hidden="true"
        >
          progress_activity
        </span>
        <p className="text-on-surface-variant">{LOADING_MESSAGE}</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="rounded-xl bg-error-container p-6 text-on-error-container">
        <p>{loadError ?? LOAD_ERROR_MESSAGE}</p>
        <button
          type="button"
          onClick={reload}
          className="mt-4 rounded-md border border-on-error-container px-4 py-2 text-sm font-medium"
        >
          {RETRY_LABEL}
        </button>
      </div>
    )
  }

  const confirmingEditor = editors.find((editor) => editor.agentName === confirmingAgent) ?? null

  return (
    <div className="flex flex-col gap-6">
      {editors.map((editor) => (
        <PromptCard
          key={editor.agentName}
          editor={editor}
          onChangeDraft={changeDraft}
          onDiscard={discardDraft}
          onRequestSave={requestSave}
        />
      ))}
      {confirmingEditor && (
        <ConfirmSaveModal
          agentLabel={getAgentLabel(confirmingEditor.agentName)}
          onConfirm={confirmSave}
          onCancel={cancelSave}
        />
      )}
    </div>
  )
}

export default PromptList
