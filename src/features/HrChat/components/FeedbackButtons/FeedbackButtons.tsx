import {
  FEEDBACK_ERROR_TEXT,
  FEEDBACK_GROUP_LABEL,
  FEEDBACK_HELPFUL_LABEL,
  FEEDBACK_NOT_HELPFUL_LABEL,
} from '../../HrChat.constants'
import type { FeedbackButtonsProps, VoteButtonProps } from './FeedbackButtons.types'

const VOTE_BUTTON_BASE_CLASSES =
  'flex h-8 w-8 items-center justify-center rounded-full transition-colors ' +
  'hover:bg-surface-container-low disabled:opacity-50 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
const VOTE_SELECTED_CLASSES = 'text-primary'
const VOTE_UNSELECTED_CLASSES = 'text-on-surface-variant'
const FILLED_ICON_STYLE = { fontVariationSettings: "'FILL' 1" } as const

const VoteButton = ({ label, icon, selected, disabled, onClick }: VoteButtonProps) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    aria-pressed={selected}
    disabled={disabled}
    onClick={onClick}
    className={`${VOTE_BUTTON_BASE_CLASSES} ${
      selected ? VOTE_SELECTED_CLASSES : VOTE_UNSELECTED_CLASSES
    }`}
  >
    <span
      className="material-symbols-outlined text-[20px]"
      aria-hidden="true"
      style={selected ? FILLED_ICON_STYLE : undefined}
    >
      {icon}
    </span>
  </button>
)

export const FeedbackButtons = ({ feedback, onVote }: FeedbackButtonsProps) => (
  <div className="flex flex-col items-start gap-1">
    <div
      role="group"
      aria-label={FEEDBACK_GROUP_LABEL}
      aria-busy={feedback.isSending}
      className="flex items-center gap-1"
    >
      <VoteButton
        label={FEEDBACK_HELPFUL_LABEL}
        icon="thumb_up"
        selected={feedback.vote === true}
        disabled={feedback.isSending}
        onClick={() => onVote(true)}
      />
      <VoteButton
        label={FEEDBACK_NOT_HELPFUL_LABEL}
        icon="thumb_down"
        selected={feedback.vote === false}
        disabled={feedback.isSending}
        onClick={() => onVote(false)}
      />
    </div>
    {feedback.hasError && (
      <p role="alert" className="text-xs text-error">
        {FEEDBACK_ERROR_TEXT}
      </p>
    )}
  </div>
)

export default FeedbackButtons
