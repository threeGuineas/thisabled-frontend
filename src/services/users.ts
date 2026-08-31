import { authedRequest, request, type DisabilityType } from './auth'

export interface Tag {
  code: string
  category: string
  label: string
}

export interface UpdateMePayload {
  nickname?: string
  bio?: string
  profile_image_url?: string
}

export interface UpdateSettingsPayload {
  stranger_requests_allowed?: boolean
  mode_settings?: ModeSettings
}

export interface MeProfile {
  id: string
  nickname: string
  bio: string | null
  profile_image_url: string | null
  ui_mode: DisabilityType
  is_minor: boolean
  stranger_requests_allowed: boolean
  mode_settings: ModeSettings
  tags: Tag[]
}

export interface ModeSettings {
  font_scale?: number
  high_contrast?: boolean
  tts?: boolean
  keyboard_nav?: boolean
  captions?: boolean
  vibration?: boolean
  visual_alerts?: boolean
  simplified?: boolean
  large_icons?: boolean
  one_item_feed?: boolean
}

// 백엔드 ui_mode는 'visual'|'hearing'|'developmental'만 허용한다('default' 없음, §5).
// 온보딩 단계에서 로컬 전용 '기본화면(default)'을 고른 경우를 대비해 여기서 보정한다
// (KakaoSignupScreen의 toSignupUiMode와 동일한 규칙).
function toApiUiMode(mode: DisabilityType): 'visual' | 'hearing' | 'developmental' {
  return mode === 'default' ? 'visual' : mode
}

export function setMode(mode: DisabilityType): Promise<MeProfile> {
  const ui_mode = toApiUiMode(mode)
  return authedRequest<MeProfile>('/api/v1/users/me/mode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ui_mode }),
  })
}

// 부분 업데이트 — 전달한 필드만 갱신됨 (nickname/bio/profile_image_url)
export function updateMe(patch: UpdateMePayload): Promise<MeProfile> {
  return authedRequest<MeProfile>('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

// 로그인된 유저의 프로필 조회 — 마이페이지 조회, 로그인 직후 ui_mode 기반 홈 화면 라우팅 등에 사용
export function getMe(): Promise<MeProfile> {
  return authedRequest<MeProfile>('/api/v1/users/me')
}

// 인증 불필요 — 서버가 관리하는 태그 마스터 카탈로그
export function getTags(): Promise<{ tags: Tag[] }> {
  return request<{ tags: Tag[] }>('/api/v1/tags')
}

// PUT이므로 매번 전체 교체 — 기존 선택값 + 신규 코드를 합쳐서 보내야 함. 응답은 갱신된 MeOut.
export function setTags(tagCodes: string[]): Promise<MeProfile> {
  return authedRequest<MeProfile>('/api/v1/users/me/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_codes: tagCodes }),
  })
}

// 둘 다 선택 — 보낸 필드만 갱신되고, mode_settings는 부분 병합이 아니라 통째로 교체된다.
export function updateSettings(patch: UpdateSettingsPayload): Promise<MeProfile> {
  return authedRequest<MeProfile>('/api/v1/users/me/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

// 회원 탈퇴 — 되돌릴 수 없음. 확인 UI는 호출부(FE) 책임. 성공 시 204(본문 없음).
export function deleteAccount(postsAction: 'anonymize' | 'delete' = 'anonymize'): Promise<void> {
  return authedRequest<void>('/api/v1/users/me', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts_action: postsAction }),
  })
}
