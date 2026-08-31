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

// mock 모드에서는 백엔드가 없으므로 이 객체가 유일한 저장소 역할을 한다.
// 이전에는 매 요청마다 이 상수를 스프레드만 하고 실제로 갱신하지 않아, 설정 저장 후
// 다시 getMe()를 호출하면(예: 마이페이지 재진입) 항상 초기값으로 되돌아가는 버그가 있었다.
let mockMeState: MeProfile = {
  id: 'mock-uuid',
  nickname: 'testuser',
  bio: null,
  profile_image_url: null,
  ui_mode: 'visual',
  is_minor: false,
  stranger_requests_allowed: true,
  mode_settings: {},
  tags: MOCK_TAG_CATALOG.slice(0, 3),
}

const mockUsers = {
  async setMode(uiMode: 'visual' | 'hearing' | 'developmental'): Promise<MeProfile> {
    await sleep(300)
    mockMeState = { ...mockMeState, ui_mode: uiMode }
    return mockMeState
  },
  async updateMe(patch: UpdateMePayload): Promise<MeProfile> {
    await sleep(400)
    mockMeState = {
      ...mockMeState,
      nickname: patch.nickname ?? mockMeState.nickname,
      bio: patch.bio ?? mockMeState.bio,
      profile_image_url: patch.profile_image_url ?? mockMeState.profile_image_url,
    }
    return mockMeState
  },
  async updateSettings(patch: UpdateSettingsPayload): Promise<MeProfile> {
    await sleep(400)
    mockMeState = {
      ...mockMeState,
      stranger_requests_allowed: patch.stranger_requests_allowed ?? mockMeState.stranger_requests_allowed,
      mode_settings: patch.mode_settings ?? mockMeState.mode_settings,
    }
    return mockMeState
  },
  async getMe(): Promise<MeProfile> {
    await sleep(300)
    return mockMeState
  },
  async getTags(): Promise<{ tags: Tag[] }> {
    await sleep(300)
    return { tags: MOCK_TAG_CATALOG }
  },
  async setTags(tagCodes: string[]): Promise<MeProfile> {
    await sleep(400)
    mockMeState = { ...mockMeState, tags: MOCK_TAG_CATALOG.filter((t) => tagCodes.includes(t.code)) }
    return mockMeState
  },
  async deleteAccount(): Promise<void> {
    await sleep(400)
  },
}

// 백엔드 ui_mode는 'visual'|'hearing'|'developmental'만 허용한다('default' 없음, §5).
// 온보딩 단계에서 로컬 전용 '기본화면(default)'을 고른 경우를 대비해 여기서 보정한다
// (KakaoSignupScreen의 toSignupUiMode와 동일한 규칙).
function toApiUiMode(mode: DisabilityType): 'visual' | 'hearing' | 'developmental' {
  return mode === 'default' ? 'visual' : mode
}

export function setMode(mode: DisabilityType): Promise<MeProfile> {
  const ui_mode = toApiUiMode(mode)
  if (IS_MOCK) return mockUsers.setMode(ui_mode)
  return authedRequest<MeProfile>('/api/v1/users/me/mode', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ui_mode }),
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

// 로그인된 유저의 프로필 조회 — 마이페이지 조회, 로그인 직후 ui_mode 기반 홈 화면 라우팅 등에 사용
export function getMe(): Promise<MeProfile> {
  if (IS_MOCK) return mockUsers.getMe()
  return authedRequest<MeProfile>('/api/v1/users/me')
}

// 인증 불필요 — 서버가 관리하는 태그 마스터 카탈로그
export function getTags(): Promise<{ tags: Tag[] }> {
  if (IS_MOCK) return mockUsers.getTags()
  return request<{ tags: Tag[] }>('/api/v1/tags')
}

// PUT이므로 매번 전체 교체 — 기존 선택값 + 신규 코드를 합쳐서 보내야 함. 응답은 갱신된 MeOut.
export function setTags(tagCodes: string[]): Promise<MeProfile> {
  if (IS_MOCK) return mockUsers.setTags(tagCodes)
  return authedRequest<MeProfile>('/api/v1/users/me/tags', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tag_codes: tagCodes }),
  })
}

// 둘 다 선택 — 보낸 필드만 갱신되고, mode_settings는 부분 병합이 아니라 통째로 교체된다.
export function updateSettings(patch: UpdateSettingsPayload): Promise<MeProfile> {
  if (IS_MOCK) return mockUsers.updateSettings(patch)
  return authedRequest<MeProfile>('/api/v1/users/me/settings', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  })
}

// 회원 탈퇴 — 되돌릴 수 없음. 확인 UI는 호출부(FE) 책임. 성공 시 204(본문 없음).
export function deleteAccount(postsAction: 'anonymize' | 'delete' = 'anonymize'): Promise<void> {
  if (IS_MOCK) return mockUsers.deleteAccount()
  return authedRequest<void>('/api/v1/users/me', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ posts_action: postsAction }),
  })
}
