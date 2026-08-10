import { useHrChatContext } from '../../context'
import { SUGGESTIONS, NO_SOURCES_INITIAL_TEXT, NO_SOURCES_EMPTY_TEXT } from '../../HrChat.constants'
import SourceCard from '../SourceCard'

export const ContextPanel = () => {
  const { handleSuggestionClick, hasExchanges, lastChunks } = useHrChatContext()

  return (
    <aside className="flex w-80 shrink-0 flex-col overflow-y-auto border-l border-outline-variant bg-surface-container-low px-5 py-6">
      <div>
        <h2 className="font-serif text-lg text-on-surface">Contexto</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Sugerencias y fuentes que respaldan la conversación.
        </p>
      </div>

      <section className="mt-6">
        <h3 className="text-sm font-semibold text-on-surface-variant">Consultas sugeridas</h3>
        <div className="mt-3 space-y-2">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              type="button"
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex w-full items-center gap-2 rounded-lg border border-outline-variant px-3 py-2 text-left text-sm text-on-surface hover:bg-surface-container"
            >
              <span
                className="material-symbols-outlined text-[18px] text-primary"
                aria-hidden="true"
              >
                {suggestion.icon}
              </span>
              {suggestion.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h3 className="text-sm font-semibold text-on-surface-variant">Fuentes de la respuesta</h3>
        <div className="mt-3 space-y-3">
          {!hasExchanges && (
            <p className="text-sm text-on-surface-variant">{NO_SOURCES_INITIAL_TEXT}</p>
          )}

          {hasExchanges && lastChunks.length === 0 && (
            <p className="text-sm text-on-surface-variant">{NO_SOURCES_EMPTY_TEXT}</p>
          )}

          {hasExchanges &&
            lastChunks.map((chunk, index) => (
              <SourceCard
                key={index}
                title={chunk.source}
                content={chunk.content}
                similarity={chunk.similarity}
              />
            ))}
        </div>
      </section>
    </aside>
  )
}

export default ContextPanel
