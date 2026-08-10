export interface FileDropzoneProps {
  inputId: string
  ariaLabel: string
  file: File | null
  errorMessage: string | null
  onSelectFile: (file: File) => void
  onRemoveFile: () => void
}
