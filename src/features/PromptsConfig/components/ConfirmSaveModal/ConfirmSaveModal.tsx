import { useEffect, useId, useRef } from 'react'
import type { KeyboardEvent, MouseEvent } from 'react'
import {
  MODAL_TITLE,
  MODAL_CANCEL_LABEL,
  MODAL_CONFIRM_LABEL,
  MODAL_BODY_SUFFIX,
} from '../../PromptsConfig.constants'
import type { ConfirmSaveModalProps } from './ConfirmSaveModal.types'

// El proyecto corre jsdom@29.1.1, donde HTMLDialogElement no implementa showModal()/close():
// el modal es un overlay propio con role="dialog", en vez de <dialog> nativo (Decisión 21 de
// specs/prompts-config/spec.md).
export const ConfirmSaveModal = ({ agentLabel, onConfirm, onCancel }: ConfirmSaveModalProps) => {
  const titleId = useId()
  const bodyId = useId()
  const cancelButtonRef = useRef<HTMLButtonElement>(null)
  const confirmButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null
    cancelButtonRef.current?.focus()

    return () => {
      previouslyFocused?.focus()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') {
      onCancel()
      return
    }

    if (event.key !== 'Tab') return

    const first = cancelButtonRef.current
    const last = confirmButtonRef.current
    if (!first || !last) return

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const handleBackdropClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onCancel()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
        onKeyDown={handleKeyDown}
        className="w-full max-w-md rounded-xl bg-surface-container-low p-6 shadow-lg"
      >
        <h2 id={titleId} className="font-serif text-lg text-on-surface">
          {MODAL_TITLE}
        </h2>
        <p id={bodyId} className="mt-3 text-on-surface-variant">
          Vas a reemplazar el system prompt de <strong>{agentLabel}</strong>. {MODAL_BODY_SUFFIX}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <button
            ref={cancelButtonRef}
            type="button"
            onClick={onCancel}
            className="rounded-md border border-outline px-4 py-2 text-sm font-medium text-on-surface"
          >
            {MODAL_CANCEL_LABEL}
          </button>
          <button
            ref={confirmButtonRef}
            type="button"
            onClick={onConfirm}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary"
          >
            {MODAL_CONFIRM_LABEL}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmSaveModal
