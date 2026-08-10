import { memo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, MouseEvent } from 'react'
import { formatFileSize } from '../../../../utils/formatFileSize'
import { DROPZONE_INSTRUCTIONS, DROPZONE_HINT, FILE_INPUT_ACCEPT } from '../../ContractAnalysis.constants'
import type { FileDropzoneProps } from './FileDropzone.types'

const EMPTY_STATE_CLASSES =
  'flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed ' +
  'border-outline-variant p-8 text-center transition-colors data-[dragging=true]:border-primary'

const FILE_STATE_CLASSES =
  'flex cursor-pointer items-center justify-between gap-3 rounded-lg bg-surface p-3 ' +
  'transition-colors data-[dragging=true]:ring-2 data-[dragging=true]:ring-primary'

// El <input> queda siempre montado en la misma posición del árbol (último hijo del
// <label>), independientemente del estado vacío/con-archivo: así el usuario puede
// intentar reemplazar un archivo ya cargado sin pasar primero por "Quitar" (@s5), y el
// nodo sigue siendo localizable con getByLabelText en cualquier estado.
export const FileDropzone = memo(
  ({ inputId, ariaLabel, file, errorMessage, onSelectFile, onRemoveFile }: FileDropzoneProps) => {
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
      const selected = event.target.files?.[0]
      if (selected) {
        onSelectFile(selected)
      }
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }

    const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(true)
    }

    const handleDragLeave = () => {
      setIsDragging(false)
    }

    const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      setIsDragging(false)
      const dropped = event.dataTransfer.files?.[0]
      if (dropped) {
        onSelectFile(dropped)
      }
    }

    const handleRemoveClick = (event: MouseEvent<HTMLButtonElement>) => {
      event.preventDefault()
      event.stopPropagation()
      onRemoveFile()
    }

    return (
      <div>
        <label
          htmlFor={inputId}
          data-dragging={isDragging ? 'true' : undefined}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={file === null ? EMPTY_STATE_CLASSES : FILE_STATE_CLASSES}
        >
          {file === null ? (
            <>
              <span
                className="material-symbols-outlined text-4xl text-outline-variant"
                aria-hidden="true"
              >
                upload_file
              </span>
              <p className="text-on-surface-variant">{DROPZONE_INSTRUCTIONS}</p>
              <p className="text-xs text-outline">{DROPZONE_HINT}</p>
            </>
          ) : (
            <>
              <span className="flex min-w-0 items-center gap-3">
                <span className="material-symbols-outlined shrink-0 text-primary" aria-hidden="true">
                  image
                </span>
                <span className="truncate text-on-surface">{file.name}</span>
                <span className="shrink-0 text-xs text-on-surface-variant">
                  {formatFileSize(file.size)}
                </span>
              </span>
              <button
                type="button"
                aria-label={`Quitar ${file.name}`}
                onClick={handleRemoveClick}
                className="shrink-0 rounded-full p-2 text-on-surface-variant transition-colors hover:bg-error-container hover:text-on-error-container"
              >
                <span className="material-symbols-outlined text-[20px]" aria-hidden="true">
                  close
                </span>
              </button>
            </>
          )}

          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept={FILE_INPUT_ACCEPT}
            aria-label={ariaLabel}
            className="sr-only"
            onChange={handleChange}
          />
        </label>

        {errorMessage !== null && (
          <p role="alert" className="mt-2 text-sm text-error">
            {errorMessage}
          </p>
        )}
      </div>
    )
  }
)

FileDropzone.displayName = 'FileDropzone'

export default FileDropzone
