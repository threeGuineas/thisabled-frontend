import { authedRequest, IS_MOCK } from './auth'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// getVoices()는 비동기 로딩이므로 voiceschanged 이벤트 대기 후 한국어 음성 선택
export function speakText(text: string, onEnd: () => void): void {
  if (!window.speechSynthesis) { onEnd(); return }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.lang = 'ko-KR'
  utterance.rate = 0.9
  utterance.onend = onEnd
  utterance.onerror = onEnd

  const applyVoiceAndSpeak = () => {
    const voices = window.speechSynthesis.getVoices()
    const koVoice = voices.find(v => v.lang === 'ko-KR') ?? voices.find(v => v.lang.startsWith('ko'))
    if (koVoice) utterance.voice = koVoice
    window.speechSynthesis.speak(utterance)
  }

  if (window.speechSynthesis.getVoices().length > 0) {
    applyVoiceAndSpeak()
  } else {
    window.speechSynthesis.addEventListener('voiceschanged', applyVoiceAndSpeak, { once: true })
  }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  if (IS_MOCK) {
    await sleep(1000)
    return '음성 인식 테스트 텍스트입니다.'
  }
  const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
  const formData = new FormData()
  formData.append('file', blob, `voice.${ext}`)
  const data = await authedRequest<{ text: string }>('/api/v1/media/transcribe', {
    method: 'POST',
    body: formData,
  })
  return data.text
}
