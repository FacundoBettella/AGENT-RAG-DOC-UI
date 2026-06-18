import styled from 'styled-components'

export const PageWrapper = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
`

export const PageTitle = styled.h1`
  color: var(--color-text-primary);
  margin-bottom: 1rem;
`

export const ExplanatoryText = styled.p`
  color: var(--color-text-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
`

export const FormArea = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

export const DropZone = styled.div`
  border: 2px dashed var(--color-border);
  border-radius: 6px;
  padding: 2rem 1.5rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s ease;
  background: var(--color-surface);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  position: relative;

  &[data-dragging='true'] {
    border-color: var(--color-gold-bright);
  }

  &[data-loading='true'] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const DropZoneIcon = styled.span`
  font-size: 2rem;
  line-height: 1;
`

export const DropZoneText = styled.p`
  color: var(--color-text-muted);
  font-size: 0.9rem;
  margin: 0;
`

export const HiddenFileInput = styled.input`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
`

export const FileList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`

export const FileItem = styled.li`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem 0.75rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: 4px;
`

export const FileName = styled.span`
  flex: 1;
  color: var(--color-text-primary);
  font-size: 0.9rem;
  word-break: break-all;
`

export const FileSize = styled.span`
  color: var(--color-text-muted);
  font-size: 0.85rem;
  white-space: nowrap;
`

export const RemoveButton = styled.button`
  background: transparent;
  border: none;
  color: var(--color-text-muted);
  cursor: pointer;
  font-size: 1.1rem;
  padding: 0 0.25rem;
  line-height: 1;
  flex-shrink: 0;

  &:hover:not(:disabled) {
    color: var(--color-error-text);
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.4;
  }
`

export const FileSummary = styled.p`
  color: var(--color-text-muted);
  font-size: 0.85rem;
  margin: 0;
`

export const ValidationErrorMessage = styled.p`
  color: var(--color-error-text);
  background: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
  margin: 0;
`

export const SubmitButton = styled.button`
  background: var(--color-gold);
  color: var(--color-bg);
  border: none;
  border-radius: 0.375rem;
  padding: 0.625rem 1.25rem;
  cursor: pointer;
  font-family: 'Georgia', serif;
  font-size: 1rem;
  align-self: flex-start;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

export const RetryButton = styled.button`
  margin-top: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: transparent;
  color: var(--color-gold);
  border: 1px solid var(--color-gold);
  border-radius: 0.375rem;
  cursor: pointer;
  font-family: 'Georgia', serif;
  font-size: 0.875rem;

  &:hover {
    background: var(--color-gold);
    color: var(--color-bg);
  }
`

export const SuccessMessage = styled.p`
  color: var(--color-text-primary);
  background: var(--color-surface);
  border-left: 3px solid var(--color-gold);
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
`

export const ErrorMessage = styled.p`
  color: var(--color-error-text);
  background: var(--color-error);
  padding: 0.75rem 1rem;
  border-radius: 0.25rem;
`

// Legacy export for backward compatibility with existing tests
export const FileInput = HiddenFileInput
