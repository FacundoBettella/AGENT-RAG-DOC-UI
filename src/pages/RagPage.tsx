import { useRef, useState } from 'react'
import { useRagForm, formatFileSize } from '../hooks/useRagForm'
import Loading from '../components/Loading/Loading'
import {
  PageWrapper,
  PageTitle,
  ExplanatoryText,
  FormArea,
  DropZone,
  DropZoneIcon,
  DropZoneText,
  HiddenFileInput,
  FileList,
  FileItem,
  FileName,
  FileSize,
  RemoveButton,
  FileSummary,
  ValidationErrorMessage,
  SubmitButton,
  RetryButton,
  SuccessMessage,
  ErrorMessage,
} from './RagPage.styles'

function RagPage() {
  const {
    files,
    validationError,
    isLoading,
    status,
    apiError,
    addFiles,
    removeFile,
    submit,
    retry,
  } = useRagForm()

  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const hasFiles = files.length > 0
  const canSubmit = hasFiles && validationError === null && !isLoading

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
    <PageWrapper>
      <PageTitle>Carga de conocimiento RAG</PageTitle>
      <ExplanatoryText>
        Los archivos seleccionados serán divididos en fragmentos (chunks) e
        indexados para búsqueda semántica en el sistema RAG.
      </ExplanatoryText>

      <FormArea>
        <DropZone
          role="region"
          aria-label="Zona de carga de archivos"
          data-dragging={isDragging ? 'true' : undefined}
          data-loading={isLoading ? 'true' : undefined}
          onClick={handleZoneClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <DropZoneIcon role="img" aria-label="ícono de carga">&#128194;</DropZoneIcon>
          <DropZoneText>
            Arrastrá tus archivos <code>.txt</code> aquí o hacé clic para seleccionar
          </DropZoneText>
          <HiddenFileInput
            ref={inputRef}
            type="file"
            multiple
            accept=".txt"
            aria-label="Seleccionar archivos"
            disabled={isLoading}
            onChange={handleChange}
          />
        </DropZone>

        {hasFiles && (
          <>
            <FileList>
              {files.map((file) => (
                <FileItem key={file.name}>
                  <FileName>{file.name}</FileName>
                  <FileSize>{formatFileSize(file.size)}</FileSize>
                  <RemoveButton
                    type="button"
                    aria-label={`Eliminar ${file.name}`}
                    disabled={isLoading}
                    onClick={() => removeFile(file.name)}
                  >
                    ×
                  </RemoveButton>
                </FileItem>
              ))}
            </FileList>
            <FileSummary>
              {files.length} archivos · {formatFileSize(totalSize)}
            </FileSummary>
          </>
        )}

        {validationError !== null && (
          <ValidationErrorMessage role="alert">
            {validationError}
          </ValidationErrorMessage>
        )}

        <SubmitButton
          type="button"
          disabled={!canSubmit}
          onClick={submit}
        >
          Subir archivos
        </SubmitButton>

        {isLoading && <Loading />}

        {status === 'success' && (
          <SuccessMessage>
            Los archivos fueron indexados correctamente.
          </SuccessMessage>
        )}

        {status === 'error' && apiError !== null && (
          <>
            <ErrorMessage>{apiError}</ErrorMessage>
            <RetryButton type="button" onClick={retry}>
              Reintentar
            </RetryButton>
          </>
        )}
      </FormArea>
    </PageWrapper>
  )
}

export default RagPage
