export type DisabilityType = 'visual' | 'developmental' | 'hearing' | 'default'

export interface LoginResponse {
  access_token: string
  user_id: string
  needs_onboarding: boolean
  token_type: string
}

export interface SignupResponse {
  user_id: string
  access_token: string
  recovery_code: string
  token_type: string
}

export interface MeResponse {
  id: string
  nickname: string
  disability_mode: DisabilityType | null
  trust_score: number
}

export interface NicknameCheckResponse {
  available: boolean
  reason: 'invalid_format' | 'forbidden_word' | 'duplicate' | null
}

export interface KakaoCallbackResponse {
  is_new_user: boolean
  access_token?: string
  user_id?: string
  signup_token?: string
}

export interface KakaoSignupPayload {
  signup_token: string
  nickname: string
  birth_date: string
  ui_mode: 'visual' | 'hearing' | 'developmental'
  agreements: { terms: boolean; privacy: boolean; ai_notice: boolean }
}

export interface KakaoSignupResponse {
  access_token: string
  user_id: string
  stranger_requests_allowed: boolean
}

// ── Token storage ────────────────────────────────────────────────────────
export const tokenStorage = {
  get: (): string | null => localStorage.getItem('access_token'),
  set: (token: string): void => { localStorage.setItem('access_token', token) },
  remove: (): void => { localStorage.removeItem('access_token') },
}

// ── Mock (VITE_MOCK_API=true 일 때 백엔드 없이 동작) ──────────────────────
const _localMock = localStorage.getItem('mock_api')
export const IS_MOCK = _localMock !== null
  ? _localMock === 'true'
  : import.meta.env.VITE_MOCK_API === 'true'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const encodeMockToken = (mode: DisabilityType) => `mock::${mode}`
const decodeMockToken = (token: string): DisabilityType => {
  const t = token.split('::')[1] as DisabilityType
  return ['visual', 'developmental', 'hearing', 'default'].includes(t) ? t : 'visual'
}

const mockAuth = {
  async login(nickname: string): Promise<LoginResponse> {
    await sleep(800)
    if (nickname.toLowerCase() === 'error')
      throw { status: 401, detail: 'Invalid credentials' }
    const map: Record<string, DisabilityType> = {
      visual: 'visual', hearing: 'hearing', developmental: 'developmental', default: 'default', none: 'default',
    }
    const mode = map[nickname.toLowerCase()] ?? 'visual'
    return { access_token: encodeMockToken(mode), user_id: 'mock-uuid', needs_onboarding: false, token_type: 'bearer' }
  },
  async register(nickname: string): Promise<SignupResponse> {
    await sleep(800)
    if (nickname.toLowerCase() === 'taken')
      throw { status: 409, detail: '이미 사용 중인 닉네임입니다' }
    return { access_token: encodeMockToken('visual'), user_id: 'mock-uuid', recovery_code: 'MOCKCODE1234', token_type: 'bearer' }
  },
  async getMe(): Promise<MeResponse> {
    await sleep(300)
    const token = tokenStorage.get() ?? ''
    return { id: 'mock-uuid', nickname: 'testuser', disability_mode: decodeMockToken(token), trust_score: 1.0 }
  },
  async checkNickname(nickname: string): Promise<NicknameCheckResponse> {
    await sleep(300)
    if (nickname === 'taken') return { available: false, reason: 'duplicate' }
    if (nickname.length < 2) return { available: false, reason: 'invalid_format' }
    return { available: true, reason: null }
  },
  async kakaoLogin(): Promise<KakaoCallbackResponse> {
    await sleep(800)
    return { is_new_user: false, access_token: encodeMockToken('visual'), user_id: 'mock-uuid' }
  },
  async kakaoSignup(payload: KakaoSignupPayload): Promise<KakaoSignupResponse> {
    await sleep(800)
    return { access_token: encodeMockToken(payload.ui_mode as DisabilityType), user_id: 'mock-uuid', stranger_requests_allowed: true }
  },
}

// ── Base URL & shared fetch utils ─────────────────────────────────────────
// dev: vite proxy가 /api를 백엔드로 전달하므로 상대 경로 사용. prod: 정적 빌드엔 프록시가 없으므로 백엔드 주소 직접 지정.
const BASE_URL = import.meta.env.PROD ? (import.meta.env.VITE_BACKEND_URL as string) : ''

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail ?? '오류가 발생했습니다.' }
  }
  return res.json() as Promise<T>
}

// 인증이 필요한 요청. 401 응답 시 토큰 자동 갱신 후 1회 재시도.
export async function authedRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const doFetch = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string>),
      },
    })

  let res = await doFetch(tokenStorage.get())

  if (res.status === 401) {
    const refreshRes = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })

    if (refreshRes.ok) {
      const { access_token } = await refreshRes.json() as { access_token: string }
      tokenStorage.set(access_token)
      res = await doFetch(access_token)
    } else {
      tokenStorage.remove()
      throw { status: 401, detail: '세션이 만료되었습니다. 다시 로그인해주세요.' }
    }
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail ?? '오류가 발생했습니다.' }
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Public API ────────────────────────────────────────────────────────────

export function login(nickname: string, password: string): Promise<LoginResponse> {
  if (IS_MOCK) return mockAuth.login(nickname)
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  })
}

export function register(nickname: string, password: string): Promise<SignupResponse> {
  if (IS_MOCK) return mockAuth.register(nickname)
  return request<SignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  })
}

export function getMe(): Promise<MeResponse> {
  if (IS_MOCK) return mockAuth.getMe()
  return authedRequest<MeResponse>('/api/v1/auth/me')
}

export function checkNickname(nickname: string): Promise<NicknameCheckResponse> {
  if (IS_MOCK) return mockAuth.checkNickname(nickname)
  const params = new URLSearchParams({ nickname })
  return request<NicknameCheckResponse>(`/api/v1/auth/check-nickname?${params}`)
}

export async function logout(): Promise<void> {
  tokenStorage.remove()
  if (!IS_MOCK) {
    await request<{ status: string }>('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
  }
}

export async function initiateKakaoLogin(): Promise<KakaoCallbackResponse | null> {
  if (IS_MOCK) return mockAuth.kakaoLogin()
  const { authorize_url } = await request<{ authorize_url: string }>('/api/v1/auth/kakao/authorize')
  // 백엔드 mock 모드: authorize_url에 code=mock: 포함 → fetch로 직접 처리
  // http://localhost:8000/... 형태의 절대 URL이므로 pathname만 추출해 Vite proxy 경유 (CORS 우회)
  if (authorize_url.includes('code=mock:')) {
    const { pathname, search } = new URL(authorize_url)
    const res = await fetch(pathname + search, { credentials: 'include' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw { status: res.status, detail: body.detail ?? '오류가 발생했습니다.' }
    }
    return res.json() as Promise<KakaoCallbackResponse>
  }
  // 실제 카카오: 브라우저 리다이렉트
  window.location.href = authorize_url
  return null
}

export async function kakaoSignup(payload: KakaoSignupPayload): Promise<KakaoSignupResponse> {
  if (IS_MOCK) return mockAuth.kakaoSignup(payload)
  return request<KakaoSignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export const IS_MOCK_API = IS_MOCK

export function toggleMockApi() {
  localStorage.setItem('mock_api', IS_MOCK ? 'false' : 'true')
  window.location.reload()
}
