import { LoadingDot, LoadingWrapper } from './Loading.styles'

function Loading() {
  return (
    <LoadingWrapper role="status" aria-label="Cargando">
      <LoadingDot data-testid="loading-dot" />
      <LoadingDot data-testid="loading-dot" />
      <LoadingDot data-testid="loading-dot" />
    </LoadingWrapper>
  )
}

export default Loading
