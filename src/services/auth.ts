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
}

// ── Base URL & shared fetch utils ─────────────────────────────────────────
const BASE_URL = ''

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

export const IS_MOCK_API = IS_MOCK

export function toggleMockApi() {
  localStorage.setItem('mock_api', IS_MOCK ? 'false' : 'true')
  window.location.reload()
}
