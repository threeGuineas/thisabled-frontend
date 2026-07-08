import { authedRequest, request, IS_MOCK, type DisabilityType } from './auth'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

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

export interface MeProfile {
  id: string
  nickname: string
  bio: string | null
  profile_image_url: string | null
  ui_mode: DisabilityType
  is_minor: boolean
  stranger_requests_allowed: boolean
  mode_settings: ModeSettings
  tags: string[]
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

export interface ModeResponse {
  mode: DisabilityType
  settings: ModeSettings
  changed_at: string
}

const MOCK_TAG_CATALOG: Tag[] = [
  ...['걷기', '등산', '헬스', '요가', '자전거', '홈트'].map((label) => ({ code: `health_${label}`, category: '운동·건강', label })),
  ...['모바일게임', 'PC게임', '보드게임', '퍼즐'].map((label) => ({ code: `game_${label}`, category: '게임', label })),
  ...['음악 듣기', '노래', '악기', 'K-pop', '트로트'].map((label) => ({ code: `music_${label}`, category: '음악', label })),
  ...['영화', '드라마', 'OTT', '애니메이션'].map((label) => ({ code: `movie_${label}`, category: '영화·드라마', label })),
  ...['독서', '웹툰', '웹소설', '글쓰기'].map((label) => ({ code: `book_${label}`, category: '책·글', label })),
  ...['그림', '사진', '공예·DIY', '뜨개'].map((label) => ({ code: `craft_${label}`, category: '그림·만들기', label })),
  ...['요리', '베이킹', '맛집', '카페', '디저트'].map((label) => ({ code: `food_${label}`, category: '요리·먹기', label })),
  ...['국내여행', '캠핑', '전시·박물관', '드라이브'].map((label) => ({ code: `travel_${label}`, category: '여행·나들이', label })),
  ...['강아지', '고양이', '식물 키우기'].map((label) => ({ code: `pet_${label}`, category: '반려동물·자연', label })),
  ...['일상 나누기', '소소한 대화', '마음 나누기', '힐링'].map((label) => ({ code: `daily_${label}`, category: '일상·수다', label })),
]

const mockUsers = {
  async getMode(): Promise<ModeResponse> {
    await sleep(300)
    return { mode: 'visual', settings: { font_scale: 1.5, high_contrast: true, tts: true, keyboard_nav: true }, changed_at: new Date().toISOString() }
  },
  async setMode(mode: DisabilityType): Promise<ModeResponse> {
    await sleep(300)
    return { mode, settings: {}, changed_at: new Date().toISOString() }
  },
  async updateMe(patch: UpdateMePayload): Promise<MeProfile> {
    await sleep(400)
    return {
      id: 'mock-uuid',
      nickname: patch.nickname ?? 'testuser',
      bio: patch.bio ?? null,
      profile_image_url: patch.profile_image_url ?? null,
      ui_mode: 'visual',
      is_minor: false,
      stranger_requests_allowed: true,
      mode_settings: {},
      tags: [],
    }
  },
  async getTags(): Promise<{ tags: Tag[] }> {
    await sleep(300)
    return { tags: MOCK_TAG_CATALOG }
  },
  async setTags(tagCodes: string[]): Promise<{ tags: string[] }> {
    await sleep(400)
    return { tags: tagCodes }
  },
}

export function getMode(): Promise<ModeResponse> {
  if (IS_MOCK) return mockUsers.getMode()
  return authedRequest<ModeResponse>('/api/v1/users/me/mode')
}

export function setMode(mode: DisabilityType): Promise<ModeResponse> {
  if (IS_MOCK) return mockUsers.setMode(mode)
  return authedRequest<ModeResponse>('/api/v1/users/me/mode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode }),
  })
}

// 부분 업데이트 — 전달한 필드만 갱신됨 (nickname/bio/profile_image_url)
export function updateMe(patch: UpdateMePayload): Promise<MeProfile> {
  if (IS_MOCK) return mockUsers.updateMe(patch)
  return authedRequest<MeProfile>('/api/v1/users/me', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

// 인증 불필요 — 서버가 관리하는 태그 마스터 카탈로그
export function getTags(): Promise<{ tags: Tag[] }> {
  if (IS_MOCK) return mockUsers.getTags()
  return request<{ tags: Tag[] }>('/api/v1/tags')
}

// PUT이므로 매번 전체 교체 — 기존 선택값 + 신규 코드를 합쳐서 보내야 함
export function setTags(tagCodes: string[]): Promise<{ tags: string[] }> {
  if (IS_MOCK) return mockUsers.setTags(tagCodes)
  return authedRequest<{ tags: string[] }>('/api/v1/users/me/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_codes: tagCodes }),
  })
}
