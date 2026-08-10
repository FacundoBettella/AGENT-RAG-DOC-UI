import { useRef, useState } from 'react'
import { useRagForm, formatFileSize } from '../hooks/useRagForm'
import Loading from '../components/Loading/Loading'
import {
  DOMAIN_OPTIONS,
  DOMAIN_FIELDSET_LEGEND,
  DOMAIN_HELP_TEXT,
  DOMAIN_HELP_ID,
  buildSuccessMessage,
} from './RagPage.constants'

export const RagPage = () => {
  const {
    files,
    validationError,
    isLoading,
    status,
    apiError,
    domain,
    setDomain,
    result,
    canSubmit,
    addFiles,
    removeFile,
    submit,
    retry,
  } = useRagForm()

  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const hasFiles = files.length > 0
  const totalSize = files.reduce((acc, f) => acc + f.size, 0)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(Array.from(e.target.files))
    }
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!isLoading) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    if (isLoading) return
    const droppedFiles = Array.from(e.dataTransfer.files)
    addFiles(droppedFiles)
  }

  const handleZoneClick = () => {
    if (!isLoading) {
      inputRef.current?.click()
    }
  }

  return (
    <div className="mx-auto max-w-[600px] p-8">
      <h1 className="mb-4 font-serif text-2xl text-on-surface">Carga de conocimiento RAG</h1>
      <p className="mb-6 text-on-surface-variant">
        Los archivos seleccionados serán divididos en fragmentos (chunks) e
        indexados para búsqueda semántica en el sistema RAG.
      </p>

      <div className="flex flex-col gap-4">
        <fieldset
          disabled={isLoading}
          aria-describedby={DOMAIN_HELP_ID}
          className="flex flex-col gap-3"
        >
          <legend className="font-serif text-lg text-on-surface">
            {DOMAIN_FIELDSET_LEGEND}
          </legend>
          <p id={DOMAIN_HELP_ID} className="text-sm text-on-surface-variant">
            {DOMAIN_HELP_TEXT}
          </p>
          <div className="flex flex-wrap gap-3">
            {DOMAIN_OPTIONS.map((option) => (
              <label key={option.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="rag-domain"
                  value={option.value}
                  checked={domain === option.value}
                  onChange={() => setDomain(option.value)}
                  className="peer sr-only"
                />
                <span
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 ${
                    domain === option.value
                      ? 'border-primary bg-primary text-on-primary'
                      : 'border-outline-variant text-on-surface-variant'
                  }`}
                >
                  <span className="material-symbols-outlined text-base" aria-hidden="true">
                    {option.icon}
                  </span>
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div
          role="region"
          aria-label="Zona de carga de archivos"
          data-dragging={isDragging ? 'true' : undefined}
          data-loading={isLoading ? 'true' : undefined}
          onClick={handleZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed border-outline-variant bg-surface-container-low p-8 text-center transition-colors data-[dragging=true]:border-primary data-[loading=true]:cursor-not-allowed data-[loading=true]:opacity-50"
        >
          <span
            role="img"
            aria-label="ícono de carga"
            className="material-symbols-outlined text-4xl text-on-surface-variant"
          >
            upload_file
          </span>
          <p className="text-sm text-on-surface-variant">
            Arrastrá tus archivos <code>.txt</code> aquí o hacé clic para seleccionar
          </p>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept=".txt"
            aria-label="Seleccionar archivos"
            disabled={isLoading}
            onChange={handleChange}
            className="sr-only"
          />
        </div>

        {hasFiles && (
          <>
            <ul className="flex list-none flex-col gap-2">
              {files.map((file) => (
                <li
                  key={file.name}
                  className="flex items-center gap-3 rounded-lg border border-outline-variant bg-surface-container-low p-3"
                >
                  <span className="flex-1 break-all text-sm text-on-surface">{file.name}</span>
                  <span className="shrink-0 whitespace-nowrap text-xs text-on-surface-variant">
                    {formatFileSize(file.size)}
                  </span>
                  <button
                    type="button"
                    aria-label={`Eliminar ${file.name}`}
                    disabled={isLoading}
                    onClick={() => removeFile(file.name)}
                    className="shrink-0 rounded p-1 text-lg leading-none text-on-surface-variant transition-colors hover:text-error disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <p className="text-xs text-on-surface-variant">
              {files.length} archivos · {formatFileSize(totalSize)}
            </p>
          </>
        )}

        {validationError !== null && (
          <p role="alert" className="rounded-sm bg-error-container px-4 py-3 text-on-error-container">
            {validationError}
          </p>
        )}

        <button
          type="button"
          disabled={!canSubmit}
          onClick={submit}
          className="self-start rounded-lg bg-primary px-6 py-2.5 font-serif text-on-primary shadow-sm transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Subir archivos
        </button>

        {isLoading && <Loading />}

        {status === 'success' && result !== null && (
          <p className="rounded-lg border-l-4 border-primary bg-surface-container-low p-3 text-on-surface">
            {buildSuccessMessage(result)}
          </p>
        )}

        {status === 'error' && apiError !== null && (
          <>
            <p className="rounded-sm bg-error-container px-4 py-3 text-on-error-container">
              {apiError}
            </p>
            <button
              type="button"
              onClick={retry}
              className="mt-2 self-start rounded-md border border-on-error-container px-3 py-1.5 text-sm font-medium text-on-error-container transition-colors hover:bg-error-container"
            >
              Reintentar
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default RagPage
