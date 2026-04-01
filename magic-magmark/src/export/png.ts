export async function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise((resolve, reject) => {
    canvas.toBlob(blob => {
      if (blob === null) {
        reject(new Error('Failed to create image blob'))
        return
      }
      resolve(blob)
    }, 'image/png')
  })
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function sanitizeStem(name: string): string {
  const trimmed = name.trim()
  if (trimmed.length === 0) return 'magic-magmark'
  return trimmed.replace(/[<>:"/\\|?*\u0000-\u001F]+/g, '-')
}

export function escapeHtml(text: string): string {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}
