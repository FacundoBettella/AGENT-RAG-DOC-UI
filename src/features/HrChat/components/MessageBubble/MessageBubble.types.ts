export type MessageBubbleVariant = 'user' | 'assistant'

export interface MessageBubbleProps {
  variant: MessageBubbleVariant
  authorName: string
  text: string
  time: string
}
