export type CaptionSize = 'small' | 'medium' | 'large'
export type CaptionColor = 'black' | 'white' | 'yellow'

export interface CaptionPreferences {
  enabled: boolean
  size: CaptionSize
  color: CaptionColor
}

const STORAGE_KEY = 'caption_preferences'
const CHANGE_EVENT = 'caption-preferences-change'
const DEFAULT_PREFERENCES: CaptionPreferences = { enabled: true, size: 'medium', color: 'white' }

export function getCaptionPreferences(): CaptionPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PREFERENCES
    const parsed = JSON.parse(raw) as Partial<CaptionPreferences>
    return {
      enabled: parsed.enabled ?? true,
      size: parsed.size === 'small' || parsed.size === 'large' ? parsed.size : 'medium',
      color: parsed.color === 'black' || parsed.color === 'yellow' ? parsed.color : 'white',
    }
  } catch {
    return DEFAULT_PREFERENCES
  }
}

// 실제 동영상 자막(<track>) 렌더링이 마이페이지의 자막 크기·색상 설정을 즉시 반영할 수 있도록,
// 저장과 함께 커스텀 이벤트를 쏴서 이미 마운트된 VideoCaptionPlayer들도 갱신한다.
export function setCaptionPreferences(prefs: CaptionPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs))
  window.dispatchEvent(new CustomEvent<CaptionPreferences>(CHANGE_EVENT, { detail: prefs }))
}

export function subscribeCaptionPreferences(listener: (prefs: CaptionPreferences) => void): () => void {
  const handler = (e: Event) => listener((e as CustomEvent<CaptionPreferences>).detail)
  window.addEventListener(CHANGE_EVENT, handler)
  return () => window.removeEventListener(CHANGE_EVENT, handler)
}
