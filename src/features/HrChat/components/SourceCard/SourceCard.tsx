import { DEFAULT_SOURCE_LABEL } from '../../HrChat.constants'
import { toSimilarityPercent } from '../../HrChat.utils'
import type { SourceCardProps } from './SourceCard.types'

export const SourceCard = ({ title, content, similarity }: SourceCardProps) => {
  const displayTitle = title.trim() !== '' ? title : DEFAULT_SOURCE_LABEL
  const percent = toSimilarityPercent(similarity)

  return (
    <article className="rounded-lg border border-outline-variant bg-surface p-3">
      <h4 className="truncate text-sm font-medium text-on-surface">{displayTitle}</h4>
      <p className="mt-1 line-clamp-3 text-sm text-on-surface-variant">{content}</p>
      <p className="mt-2 text-xs font-medium text-primary">{percent}% de coincidencia</p>
    </article>
  )
}

export default SourceCard
