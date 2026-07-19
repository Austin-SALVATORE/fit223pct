/** Web Share API where available (mobile — the phone's own share sheet), download link fallback. */
export async function shareOrDownloadFile(filename: string, content: string): Promise<void> {
  const file = new File([content], filename, { type: 'application/json' })

  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return
    } catch {
      // User cancelled, or share failed for another reason — fall through to download.
    }
  }

  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
