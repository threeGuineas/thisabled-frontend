export type DisabilityType = 'visual' | 'developmental' | 'hearing' | 'none'

interface AuthResponse {
  access_token: string
  token_type: string
}

export interface MeResponse {
  id: number
  nickname: string
  disability_type: DisabilityType
}

// ── Mock (VITE_MOCK_API=true 일 때 백엔드 없이 동작) ──────────────────────

const IS_MOCK = import.meta.env.VITE_MOCK_API === 'true'
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// mock 토큰에 disability_type을 인코딩해서 getMe에서 읽음
const encodeMockToken = (disabilityType: DisabilityType) => `mock::${disabilityType}`
const decodeMockToken = (token: string): DisabilityType => {
  const t = token.split('::')[1] as DisabilityType
  return ['visual', 'developmental', 'hearing', 'none'].includes(t) ? t : 'visual'
}

const mockAuth = {
  async login(nickname: string): Promise<AuthResponse> {
    await sleep(800)
    if (nickname.toLowerCase() === 'error')
      throw { status: 401, detail: 'Invalid credentials' }
    // 닉네임으로 disability_type 지정: visual / hearing / developmental / none
    const map: Record<string, DisabilityType> = {
      visual: 'visual', hearing: 'hearing', developmental: 'developmental', none: 'none',
    }
    const disabilityType = map[nickname.toLowerCase()] ?? 'visual'
    return { access_token: encodeMockToken(disabilityType), token_type: 'bearer' }
  },
  async register(nickname: string): Promise<AuthResponse> {
    await sleep(800)
    if (nickname.toLowerCase() === 'taken')
      throw { status: 409, detail: 'Nickname already taken' }
    return { access_token: encodeMockToken('visual'), token_type: 'bearer' }
  },
  async getMe(token: string): Promise<MeResponse> {
    await sleep(300)
    return { id: 1, nickname: 'testuser', disability_type: decodeMockToken(token) }
  },
}

// ── Real API ──────────────────────────────────────────────────────────────

const BASE_URL = 'http://localhost:8000'

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail }
  }
  return res.json() as Promise<T>
}

// ── Public API (IS_MOCK 에 따라 분기) ────────────────────────────────────

export function login(nickname: string, password: string) {
  if (IS_MOCK) return mockAuth.login(nickname)
  return request<AuthResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  })
}

export function register(nickname: string, password: string, disability_type: DisabilityType) {
  if (IS_MOCK) return mockAuth.register(nickname)
  return request<AuthResponse>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ nickname, password, disability_type }),
  })
}

export function getMe(token: string) {
  if (IS_MOCK) return mockAuth.getMe(token)
  return request<MeResponse>('/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
}

export const tokenStorage = {
  get: (): string | null => localStorage.getItem('access_token'),
  set: (token: string): void => { localStorage.setItem('access_token', token) },
  remove: (): void => { localStorage.removeItem('access_token') },
}

export const IS_MOCK_API = IS_MOCK
