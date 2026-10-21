import type { ExchangeFeedback } from '../../../../hooks/useHrChat'

export interface FeedbackButtonsProps {
  feedback: ExchangeFeedback
  onVote: (helpful: boolean) => void
}

export interface VoteButtonProps {
  label: string
  icon: string
  selected: boolean
  disabled: boolean
  onClick: () => void
}
