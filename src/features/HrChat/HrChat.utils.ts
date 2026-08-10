export const formatMessageTime = (timestamp: number): string =>
  new Date(timestamp).toLocaleTimeString('es-AR', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

export const toSimilarityPercent = (similarity: number): number =>
  Math.round(Math.min(1, Math.max(0, similarity)) * 100)
