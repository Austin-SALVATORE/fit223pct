export type ShareOrDownloadOutcome = 'shared' | 'downloaded' | 'cancelled'

/** Web Share API where available (mobile — the phone's own share sheet), download link fallback. */
export async function shareOrDownloadFile(
  filename: string,
  content: string,
): Promise<ShareOrDownloadOutcome> {
  const file = new File([content], filename, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (error) {
      // Cancelling the share sheet is a deliberate, visible user action —
      // it must not silently trigger a download the user didn't ask for.
      if (error instanceof DOMException && error.name === 'AbortError') {
        return 'cancelled'
      }
      // Any other failure: fall through to download rather than lose the export.
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
