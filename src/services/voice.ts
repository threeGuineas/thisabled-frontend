import { authedRequest, IS_MOCK } from './auth'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_DESCRIPTIONS = [
  '초록색 나뭇잎이 가득한 숲 속 풍경입니다. 맑은 햇빛이 나뭇잎 사이로 비치고 있습니다.',
  '넓은 들판 위로 푸른 하늘이 펼쳐져 있습니다. 구름이 조금 떠 있고 따뜻한 햇살이 비치는 오후 풍경입니다.',
  '하늘을 배경으로 찍은 풍경 사진입니다. 밝은 빛이 가득하고 평화로운 분위기입니다.',
  '빵집에서 찍은 사진입니다. 갓 구운 크루아상이 접시에 담겨 있고, 배경에는 따뜻한 카페 분위기가 느껴집니다.',
]

// API 실패 시 throw 대신 fallback 문자열 반환 — TTS는 항상 동작해야 함
export async function describeImage(imageUrl: string): Promise<string> {
  if (IS_MOCK) {
    await sleep(900)
    return MOCK_DESCRIPTIONS[Math.abs(imageUrl.length) % MOCK_DESCRIPTIONS.length]
  }
  try {
    const data = await authedRequest<{ description: string }>('/api/v1/vision/describe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image_url: imageUrl }),
    })
    return data.description
  } catch {
    return '이미지가 첨부된 게시글입니다.'
  }
}

// getVoices()는 비동기 로딩이므로 voiceschanged 이벤트 대기 후 한국어 음성 선택
export function speakText(text: string, onEnd: () => void): void {
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
  const data = await authedRequest<{ text: string; duration_ms: number }>('/api/v1/stt/transcribe', {
    method: 'POST',
    body: formData,
  })
  return data.text
}
