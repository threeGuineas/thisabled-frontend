import { API_BASE_URL } from './posts'
import { tokenStorage } from './auth'

export async function transcribeAudio(blob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append('file', blob, 'voice.webm')
  const token = tokenStorage.get()
  const res = await fetch(`${API_BASE_URL}/api/v1/transcribe`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail ?? '음성 인식에 실패했습니다.' }
  }
  const data = await res.json() as { text: string }
  return data.text
}
