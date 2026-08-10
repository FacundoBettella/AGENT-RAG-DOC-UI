import { useContractAnalysisContext } from '../../context'
import {
  IDLE_TITLE,
  IDLE_SUBTITLE,
  IDLE_STEP_1_TITLE,
  IDLE_STEP_1_TEXT,
  IDLE_STEP_2_TITLE,
  IDLE_STEP_2_TEXT,
  LOADING_TITLE,
  LOADING_NOTE,
  RETRY_LABEL,
  SUCCESS_TITLE,
  SUCCESS_SUMMARY_TITLE,
  SUCCESS_SECTIONS_TITLE,
  SUCCESS_TOPICS_TITLE,
  SUCCESS_FOOTER,
} from '../../ContractAnalysis.constants'

export const ResultPanel = () => {
  const { status, result, error, retry } = useContractAnalysisContext()

  return (
    <div
      role="region"
      aria-live="polite"
      aria-label="Estado del análisis"
      className="flex w-1/2 flex-col overflow-y-auto rounded-2xl bg-surface-container-low p-8"
    >
      {status === 'idle' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined mb-6 text-5xl text-primary" aria-hidden="true">
            neurology
          </span>
          <h2 className="font-serif text-xl text-on-surface">{IDLE_TITLE}</h2>
          <p className="mt-3 max-w-md text-on-surface-variant">{IDLE_SUBTITLE}</p>
          <div className="mt-8 flex w-full flex-col gap-4 text-left">
            <div className="flex items-start gap-4 rounded-xl bg-surface p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-container text-xs text-on-primary-container">
                01
              </span>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">{IDLE_STEP_1_TITLE}</h3>
                <p className="text-sm text-on-surface-variant">{IDLE_STEP_1_TEXT}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-surface p-4 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary-container text-xs text-on-secondary-container">
                02
              </span>
              <div>
                <h3 className="text-sm font-semibold text-on-surface">{IDLE_STEP_2_TITLE}</h3>
                <p className="text-sm text-on-surface-variant">{IDLE_STEP_2_TEXT}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {status === 'loading' && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <span
            className="material-symbols-outlined mb-6 animate-spin text-5xl text-primary"
            aria-hidden="true"
          >
            progress_activity
          </span>
          <h2 className="font-serif text-xl text-on-surface">{LOADING_TITLE}</h2>
          <p className="mt-3 max-w-md text-on-surface-variant">{LOADING_NOTE}</p>
        </div>
      )}

      {status === 'error' && error !== null && (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="w-full max-w-md rounded-xl bg-error-container p-6 text-on-error-container">
            <p>{error}</p>
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-md border border-on-error-container px-4 py-2 text-sm font-medium"
            >
              {RETRY_LABEL}
            </button>
          </div>
        </div>
      )}

      {status === 'success' && result !== null && (
        <div className="flex flex-col gap-6">
          <h2 className="font-serif text-xl text-on-surface">{SUCCESS_TITLE}</h2>

          <section>
            <h3 className="text-sm font-semibold text-on-surface-variant">
              {SUCCESS_SUMMARY_TITLE}
            </h3>
            <p className="mt-2 whitespace-pre-wrap break-words text-on-surface">
              {result.summary}
            </p>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-on-surface-variant">
              {SUCCESS_SECTIONS_TITLE}
            </h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-on-surface">
              {result.sectionsChanged.map((section, index) => (
                <li key={index}>{section}</li>
              ))}
            </ul>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-on-surface-variant">
              {SUCCESS_TOPICS_TITLE}
            </h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {result.topicsTouched.map((topic, index) => (
                <span
                  key={index}
                  className="rounded-full bg-secondary-container px-3 py-1 text-sm text-on-secondary-container"
                >
                  {topic}
                </span>
              ))}
            </div>
          </section>

          <p className="text-xs text-on-surface-variant">{SUCCESS_FOOTER}</p>
        </div>
      )}
    </div>
  )
}

export default ResultPanel
