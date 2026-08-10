import type { MessageBubbleProps } from './MessageBubble.types'

const USER_BUBBLE_CLASSES = 'bg-primary text-on-primary rounded-2xl rounded-tr-sm'
const ASSISTANT_BUBBLE_CLASSES =
  'bg-surface-container-low text-on-surface rounded-2xl rounded-tl-sm border border-outline-variant/10'

const USER_AVATAR_CLASSES = 'bg-secondary-container text-on-secondary-container'
const ASSISTANT_AVATAR_CLASSES = 'bg-primary text-on-primary'

export const MessageBubble = ({ variant, authorName, text, time }: MessageBubbleProps) => {
  const isUser = variant === 'user'

  return (
    <div className={`flex items-start gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
      <span
        aria-hidden="true"
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser ? USER_AVATAR_CLASSES : ASSISTANT_AVATAR_CLASSES
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          {isUser ? 'person' : 'smart_toy'}
        </span>
      </span>

      <div className={`flex max-w-[72%] flex-col gap-1 ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="text-xs text-on-surface-variant">
          {authorName} · {time}
        </span>
        <div
          className={`whitespace-pre-wrap break-words px-4 py-3 ${
            isUser ? USER_BUBBLE_CLASSES : ASSISTANT_BUBBLE_CLASSES
          }`}
        >
          {text}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble
