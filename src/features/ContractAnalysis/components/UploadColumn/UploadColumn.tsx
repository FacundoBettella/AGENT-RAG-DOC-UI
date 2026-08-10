import { useContractAnalysisContext } from '../../context'
import FileDropzone from '../FileDropzone'
import {
  ORIGINAL_CARD_TITLE,
  AMENDMENT_CARD_TITLE,
  REQUIRED_BADGE_LABEL,
  SUBMIT_LABEL,
  SUBMIT_LOADING_LABEL,
} from '../../ContractAnalysis.constants'

export const UploadColumn = () => {
  const {
    originalFile,
    amendmentFile,
    originalError,
    amendmentError,
    selectOriginal,
    selectAmendment,
    removeOriginal,
    removeAmendment,
    canSubmit,
    status,
    submit,
  } = useContractAnalysisContext()

  const isLoading = status === 'loading'

  return (
    <div className="flex w-1/2 flex-col gap-6 overflow-y-auto pr-2">
      <section className="rounded-xl bg-surface-container p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-container">
              <span
                className="material-symbols-outlined text-on-primary-container"
                aria-hidden="true"
              >
                description
              </span>
            </span>
            <h3 className="font-serif text-lg text-on-surface">{ORIGINAL_CARD_TITLE}</h3>
          </div>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {REQUIRED_BADGE_LABEL}
          </span>
        </div>
        <FileDropzone
          inputId="contract-analysis-original-input"
          ariaLabel={ORIGINAL_CARD_TITLE}
          file={originalFile}
          errorMessage={originalError}
          onSelectFile={selectOriginal}
          onRemoveFile={removeOriginal}
        />
      </section>

      <section className="rounded-xl bg-surface-container p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-container">
              <span
                className="material-symbols-outlined text-on-secondary-container"
                aria-hidden="true"
              >
                compare_arrows
              </span>
            </span>
            <h3 className="font-serif text-lg text-on-surface">{AMENDMENT_CARD_TITLE}</h3>
          </div>
          <span className="rounded-full bg-surface-container-high px-3 py-1 text-xs font-semibold uppercase tracking-wider text-on-surface-variant">
            {REQUIRED_BADGE_LABEL}
          </span>
        </div>
        <FileDropzone
          inputId="contract-analysis-amendment-input"
          ariaLabel={AMENDMENT_CARD_TITLE}
          file={amendmentFile}
          errorMessage={amendmentError}
          onSelectFile={selectAmendment}
          onRemoveFile={removeAmendment}
        />
      </section>

      <button
        type="button"
        disabled={!canSubmit}
        onClick={submit}
        className="flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 font-serif text-lg text-on-primary shadow-md transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="material-symbols-outlined" aria-hidden="true">
          auto_awesome
        </span>
        {isLoading ? SUBMIT_LOADING_LABEL : SUBMIT_LABEL}
      </button>
    </div>
  )
}

export default UploadColumn
