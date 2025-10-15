export type UploadResponse = {
  filename: string
  message: string
  preview: string
}

export async function uploadPdf(file: File): Promise<UploadResponse> {
  const form = new FormData()
  form.append('file', file)

  const res = await fetch('http://127.0.0.1:8000/upload-pdf/', {
    method: 'POST',
    body: form,
  })

  if (!res.ok) {
    let detail = ''
    try {
      const err = await res.json()
      detail = err.detail || JSON.stringify(err)
    } catch {
      detail = res.statusText
    }
    throw new Error(detail || 'Upload failed')
  }

  return res.json()
}
