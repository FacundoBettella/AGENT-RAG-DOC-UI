import { memo } from 'react'
import type { ChangeEvent } from 'react'
import { getAgentLabel, getAgentDescription } from '../../PromptsConfig.constants'
import {
  UNSAVED_BADGE_LABEL,
  DISCARD_LABEL,
  SAVE_LABEL,
  SAVING_LABEL,
  EMPTY_DRAFT_MESSAGE,
  SAVED_MESSAGE,
} from '../../PromptsConfig.constants'
import type { PromptCardProps } from './PromptCard.types'

export const PromptCard = memo(
  ({ editor, onChangeDraft, onDiscard, onRequestSave }: PromptCardProps) => {
    const { agentName, draft, isDirty, canSave, status, error } = editor
    const label = getAgentLabel(agentName)
    const description = getAgentDescription(agentName)
    const isBlank = draft.trim() === ''
    const isSaving = status === 'saving'
    const headingId = `prompt-heading-${agentName}`
    const textareaId = `prompt-textarea-${agentName}`
    const counterId = `prompt-counter-${agentName}`

    const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
      onChangeDraft(agentName, event.target.value)
    }

    return (
      <section aria-labelledby={headingId} className="rounded-xl bg-surface-container p-6 shadow-sm">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <h2 id={headingId} className="font-serif text-lg text-on-surface">
            {label}
          </h2>
          <span className="font-mono text-xs text-on-surface-variant">{agentName}</span>
          {isDirty && (
            <span className="rounded-full bg-secondary-container px-2 py-0.5 text-xs text-on-secondary-container">
              {UNSAVED_BADGE_LABEL}
            </span>
          )}
        </div>

        {description && <p className="mb-4 text-sm text-on-surface-variant">{description}</p>}

        <label htmlFor={textareaId} className="sr-only">
          {`System prompt de ${label}`}
        </label>
        <textarea
          id={textareaId}
          rows={14}
          value={draft}
          readOnly={isSaving}
          aria-describedby={counterId}
          onChange={handleChange}
          className="w-full resize-y rounded-lg border border-outline-variant bg-surface p-3 font-mono text-sm text-on-surface"
        />
        <p id={counterId} className="mt-1 text-xs text-on-surface-variant">
          {`${draft.length} caracteres`}
        </p>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <div aria-live="polite" className="min-h-6 text-sm">
            {isBlank && <p className="text-error">{EMPTY_DRAFT_MESSAGE}</p>}
            {!isBlank && status === 'saved' && (
              <p className="flex items-center gap-1 text-primary">
                <span className="material-symbols-outlined text-base" aria-hidden="true">
                  check_circle
                </span>
                {SAVED_MESSAGE}
              </p>
            )}
            {!isBlank && status === 'error' && error !== null && (
              <p className="rounded-md bg-error-container px-3 py-2 text-on-error-container">
                {error}
              </p>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {isDirty && (
              <button
                type="button"
                onClick={() => onDiscard(agentName)}
                className="rounded-md border border-outline px-4 py-2 text-sm font-medium text-on-surface"
              >
                {DISCARD_LABEL}
              </button>
            )}
            <button
              type="button"
              disabled={!canSave}
              onClick={() => onRequestSave(agentName)}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? SAVING_LABEL : SAVE_LABEL}
            </button>
          </div>
        </div>
      </section>
    )
  }
)

PromptCard.displayName = 'PromptCard'

export default PromptCard
