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

// ── Base URL & shared fetch utils ─────────────────────────────────────────
// dev: vite proxy가 /api를 백엔드로 전달하므로 상대 경로 사용. prod: 정적 빌드엔 프록시가 없으므로 백엔드 주소 직접 지정.
const BASE_URL = import.meta.env.PROD ? (import.meta.env.VITE_BACKEND_URL as string) : ''

// FastAPI는 422 검증 오류에서 detail을 문자열이 아니라 [{type, loc, msg, input}, ...] 배열로 준다.
// 이걸 그대로 React 자식으로 렌더링하면 "Objects are not valid as a React child"로 앱이 죽으므로
// 항상 문자열로 정규화해서 던진다.
function extractDetail(body: unknown, fallback: string): string {
  const detail = (body as { detail?: unknown } | null)?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    const messages = detail
      .map((item) => (item && typeof item === 'object' && 'msg' in item ? String((item as { msg: unknown }).msg) : null))
      .filter((msg): msg is string => Boolean(msg))
    if (messages.length > 0) return messages.join(' ')
  }
  return fallback
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: extractDetail(body, '오류가 발생했습니다.') }
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
    throw { status: res.status, detail: extractDetail(body, '오류가 발생했습니다.') }
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

// ── Public API ────────────────────────────────────────────────────────────

export function login(nickname: string, password: string): Promise<LoginResponse> {
  return request<LoginResponse>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  })
}

export function register(nickname: string, password: string): Promise<SignupResponse> {
  return request<SignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ nickname, password }),
  })
}

export function checkNickname(nickname: string): Promise<NicknameCheckResponse> {
  const params = new URLSearchParams({ nickname })
  return request<NicknameCheckResponse>(`/api/v1/auth/check-nickname?${params}`)
}

export async function logout(): Promise<void> {
  tokenStorage.remove()
  await request<{ status: string }>('/api/v1/auth/logout', { method: 'POST' }).catch(() => {})
}

export async function initiateKakaoLogin(): Promise<KakaoCallbackResponse | null> {
  const { authorize_url } = await request<{ authorize_url: string }>('/api/v1/auth/kakao/authorize')
  // 백엔드 mock 모드: authorize_url에 code=mock: 포함 → fetch로 직접 처리
  // http://localhost:8000/... 형태의 절대 URL이므로 pathname만 추출해 Vite proxy 경유 (CORS 우회)
  if (authorize_url.includes('code=mock:')) {
    const { pathname, search } = new URL(authorize_url)
    const res = await fetch(pathname + search, { credentials: 'include' })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw { status: res.status, detail: extractDetail(body, '오류가 발생했습니다.') }
    }
    return res.json() as Promise<KakaoCallbackResponse>
  }
  // 실제 카카오: 브라우저 리다이렉트
  window.location.href = authorize_url
  return null
}

export async function kakaoSignup(payload: KakaoSignupPayload): Promise<KakaoSignupResponse> {
  return request<KakaoSignupResponse>('/api/v1/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}
