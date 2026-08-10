export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) {
    const kb = bytes / 1024
    const rounded = Math.round(kb * 10) / 10
    return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)} KB`
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
