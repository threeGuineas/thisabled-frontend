# ThisAbled — 프론트엔드 연동 가이드

> 최종 업데이트: 2026-06-27 · 스프린트 S1 기준

---

## 목차
1. [기본 설정](#1-기본-설정)
2. [인증 흐름](#2-인증-흐름)
3. [공통 요청 규격](#3-공통-요청-규격)
4. [에러 응답 형식](#4-에러-응답-형식)
5. [API 엔드포인트 명세](#5-api-엔드포인트-명세)
6. [파일 업로드](#6-파일-업로드)
7. [AI 기능 연동](#7-ai-기능-연동)
8. [장애 모드 연동](#8-장애-모드-연동)
9. [프론트엔드 설정 예시](#9-프론트엔드-설정-예시)

---

## 1. 기본 설정

### 접속 URL

| 환경 | Base URL |
|------|----------|
| 로컬 개발 | `http://localhost:8000` |
| 테일스케일 터널 (현재 배포) | `.env`의 `CORS_ORIGINS` 참고 |

모든 API 경로는 `/api/v1`으로 시작합니다.

### 인터랙티브 API 문서

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

직접 요청을 테스트해볼 수 있으니 연동 전에 먼저 확인하세요.

### CORS

허용된 오리진은 서버의 `.env`에서 `CORS_ORIGINS`로 관리합니다.  
기본값:
```
CORS_ORIGINS=http://localhost:5173,http://localhost:3000
```

**중요:** 쿠키(리프레시 토큰)를 주고받기 위해 반드시 `credentials: 'include'`를 설정해야 합니다.

---

## 2. 인증 흐름

### 토큰 구조

| 토큰 | 수명 | 전달 방식 |
|------|------|-----------|
| Access Token (JWT) | 24시간 | 요청 헤더 `Authorization: Bearer <token>` |
| Refresh Token | 30일 | `httpOnly` 쿠키 (`refresh_token`) |

- **Access Token**: 회원가입/로그인 응답 body의 `access_token` 필드로 받습니다. 이후 모든 인증 요청의 헤더에 포함합니다.
- **Refresh Token**: 서버가 자동으로 쿠키를 심습니다. JS에서 직접 읽을 수 없으며, 브라우저가 자동으로 `/api/v1/auth/refresh` 요청 시 함께 전송합니다.

### 토큰 갱신 흐름

```
1. 보호된 API 요청
2. 401 응답 수신
3. POST /api/v1/auth/refresh (credentials: 'include')
4. 새 access_token 발급
5. 원래 요청 재시도
6. refresh도 만료(401) → 로그인 화면으로 이동
```

### 로그아웃 처리

`POST /api/v1/auth/logout` 호출 후 **프론트에서도 저장된 access_token을 삭제**해야 합니다.  
(서버는 쿠키만 만료시킵니다. access_token은 만료 전까지 유효합니다.)

---

## 3. 공통 요청 규격

### 인증 헤더

```http
Authorization: Bearer <access_token>
Content-Type: application/json
```

### 파일 업로드 시

```http
Authorization: Bearer <access_token>
Content-Type: multipart/form-data
```

### 쿠키 포함 필수 요청

리프레시 토큰 관련 요청은 반드시 `credentials: 'include'` 설정 필요.

```typescript
fetch('/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include',
})
```

---

## 4. 에러 응답 형식

모든 에러는 동일한 형식으로 반환됩니다.

```json
{
  "detail": "에러 메시지"
}
```

### HTTP 상태 코드 정리

| 코드 | 의미 | 주요 발생 상황 |
|------|------|----------------|
| `200` | 성공 | GET, PUT |
| `201` | 생성됨 | POST (회원가입, 게시글 작성, 파일 업로드) |
| `204` | 내용 없음 | DELETE 성공 |
| `400` | 잘못된 요청 | 파라미터 오류, 잘못된 이미지 경로 |
| `401` | 인증 실패 | 토큰 없음/만료, 잘못된 비밀번호 |
| `403` | 권한 없음 | 다른 사람 게시글 삭제 시도 |
| `404` | 리소스 없음 | 없는 게시글/파일 조회 |
| `409` | 충돌 | 닉네임 중복 |
| `413` | 파일 크기 초과 | 이미지 10MB, 오디오 25MB 초과 |
| `415` | 지원하지 않는 형식 | 허용되지 않은 파일 타입 |
| `422` | 유효성 검사 실패 | Pydantic 스키마 오류 (필수 필드 누락 등) |

### 예시

```json
// 닉네임 중복
{ "detail": "이미 사용 중인 닉네임입니다" }

// 인증 없음
{ "detail": "Not authenticated" }

// 파일 초과
{ "detail": "File exceeds 10 MB limit" }
```

---

## 5. API 엔드포인트 명세

### 5.1 헬스체크

#### `GET /api/v1/health`
인증 불필요. 서버/DB/Redis 상태를 확인합니다.

**응답 `200`**
```json
{
  "status": "ok",
  "db": "ok",
  "redis": "ok"
}
```

---

### 5.2 인증 (Auth)

#### `GET /api/v1/auth/check-nickname?nickname=<닉네임>`
닉네임 중복·유효성을 실시간 체크합니다. 인증 불필요.

**Query Params**
| 파라미터 | 타입 | 설명 |
|----------|------|------|
| `nickname` | string | 확인할 닉네임 (2~12자, 한글/영문/숫자) |

**응답 `200`**
```json
{
  "available": true,
  "reason": null
}
```

`available: false`일 때 `reason` 값:
- `"invalid_format"` — 형식 오류 (길이, 허용 문자 등)
- `"forbidden_word"` — 금칙어 포함
- `"duplicate"` — 이미 존재하는 닉네임

---

#### `POST /api/v1/auth/signup`
회원가입. 인증 불필요.

**요청 Body**
```json
{
  "nickname": "홍길동123",
  "password": "Test1234"
}
```

| 필드 | 규칙 |
|------|------|
| `nickname` | 2~12자, 한글/영문/숫자만 |
| `password` | 8자 이상, 영문자 + 숫자 포함 필수 |

**응답 `201`**
```json
{
  "user_id": "uuid",
  "access_token": "eyJhbGci...",
  "recovery_code": "A1B2C3D4E5F6",
  "token_type": "bearer"
}
```

> ⚠️ **`recovery_code`는 이 응답에서 딱 한 번만 반환됩니다.**  
> 비밀번호 찾기에 필요하므로 사용자가 반드시 저장하도록 안내해 주세요.

**사이드 이펙트:** httpOnly 리프레시 토큰 쿠키 설정됨

---

#### `POST /api/v1/auth/login`
로그인. 인증 불필요.

**요청 Body**
```json
{
  "nickname": "홍길동123",
  "password": "Test1234"
}
```

**응답 `200`**
```json
{
  "access_token": "eyJhbGci...",
  "user_id": "uuid",
  "needs_onboarding": false,
  "token_type": "bearer"
}
```

> `needs_onboarding: true`이면 장애 모드 선택 온보딩 화면으로 이동해야 합니다.  
> `disability_mode`가 아직 설정되지 않은 신규 사용자입니다.

**사이드 이펙트:** httpOnly 리프레시 토큰 쿠키 설정됨

---

#### `POST /api/v1/auth/refresh`
리프레시 토큰으로 새 access_token 발급. 인증 불필요.

**요청 Body:** 없음 (쿠키 자동 전송)

```typescript
// 반드시 credentials: 'include' 사용
fetch('/api/v1/auth/refresh', {
  method: 'POST',
  credentials: 'include',
})
```

**응답 `200`**
```json
{
  "access_token": "eyJhbGci...",
  "token_type": "bearer"
}
```

---

#### `POST /api/v1/auth/recovery`
복구 코드로 비밀번호 재설정. 인증 불필요.

**요청 Body**
```json
{
  "nickname": "홍길동123",
  "recovery_code": "A1B2C3D4E5F6",
  "new_password": "NewPass5678"
}
```

**응답 `200`**
```json
{ "status": "ok" }
```

---

#### `POST /api/v1/auth/logout`
로그아웃. 인증 불필요.

**요청 Body:** 없음

**응답 `200`**
```json
{ "status": "ok" }
```

> 서버에서 쿠키를 만료시킵니다. 프론트에서도 `access_token`을 삭제하세요.

---

#### `GET /api/v1/auth/me`
현재 로그인한 사용자 정보 조회. **인증 필요.**

**응답 `200`**
```json
{
  "id": "uuid",
  "nickname": "홍길동123",
  "disability_mode": "visual",
  "trust_score": 1.0
}
```

`disability_mode` 가능 값: `"visual"` | `"hearing"` | `"developmental"` | `"default"` | `null` (온보딩 미완료)

---

### 5.3 게시글 (Posts)

#### `GET /api/v1/posts?offset=0&limit=20`
피드 목록 조회. 최신순 정렬. 인증 불필요.

**Query Params**
| 파라미터 | 기본값 | 설명 |
|----------|--------|------|
| `offset` | `0` | 건너뛸 게시글 수 |
| `limit` | `20` | 가져올 게시글 수 |

**응답 `200`**
```json
[
  {
    "id": "uuid",
    "user_id": "uuid",
    "content": "오늘 산책하면서 찍은 사진이에요 🌳",
    "image_url": "/uploads/abc123.png",
    "created_at": "2026-06-27T10:30:00Z"
  }
]
```

---

#### `POST /api/v1/posts`
게시글 작성. **인증 필요.**

**요청 Body**
```json
{
  "content": "오늘 산책하면서 찍은 사진이에요 🌳",
  "image_url": "/uploads/abc123.png"
}
```

| 필드 | 필수 | 설명 |
|------|------|------|
| `content` | ✅ | 게시글 텍스트 |
| `image_url` | ❌ | 업로드된 이미지 경로 (`null` 가능) |

`image_url`은 `POST /api/v1/upload` 응답의 `url` 값을 사용하세요.

**응답 `201`**
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "content": "오늘 산책하면서 찍은 사진이에요 🌳",
  "image_url": "/uploads/abc123.png",
  "created_at": "2026-06-27T10:30:00Z"
}
```

---

#### `GET /api/v1/posts/{post_id}`
게시글 단건 조회. 인증 불필요.

**응답 `200`** — 게시글 목록 아이템과 동일한 형식

---

#### `DELETE /api/v1/posts/{post_id}`
게시글 삭제. **인증 필요.** 작성자 본인만 가능.

**응답 `204`** — Body 없음

---

## 6. 파일 업로드

#### `POST /api/v1/upload`
이미지 파일 업로드. **인증 필요.**

**요청 형식:** `multipart/form-data`

| 필드 | 타입 | 제한 |
|------|------|------|
| `file` | File | JPEG / PNG / GIF / WebP, 최대 10MB |

```typescript
const formData = new FormData();
formData.append('file', fileInput.files[0]);

const res = await fetch('/api/v1/upload', {
  method: 'POST',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: formData,
  // Content-Type은 FormData 사용 시 직접 설정하지 마세요
});
const { url } = await res.json();
// url = "/uploads/abc123.png"
```

**응답 `201`**
```json
{
  "url": "/uploads/abc123.png"
}
```

이 `url`을 게시글 작성의 `image_url` 필드에 넣으면 됩니다.  
이미지를 직접 표시할 때는 Base URL을 앞에 붙여야 합니다: `http://localhost:8000/uploads/abc123.png`

---

## 7. AI 기능 연동

### 7.1 이미지 음성 해설 (시각장애 모드)

#### `POST /api/v1/vision/describe`
이미지를 GPT-4o Vision으로 분석해 한국어 설명 텍스트를 반환합니다. **인증 필요.**

**요청 Body**
```json
{
  "image_url": "/uploads/abc123.png"
}
```

`/uploads/`로 시작하는 경로만 허용합니다 (외부 URL 불가).

**응답 `200`**
```json
{
  "description": "밝은 공원에서 벚꽃이 피어있는 나무들이 있고 사람들이 산책하고 있습니다.",
  "duration_ms": 1234,
  "cached": false
}
```

| 필드 | 설명 |
|------|------|
| `description` | 한국어 이미지 설명 |
| `duration_ms` | 처리 시간(ms). 캐시 히트 시 `0` |
| `cached` | Redis 캐시에서 반환된 경우 `true` |

동일한 이미지는 24시간 동안 캐시됩니다 (비용 절감).

---

### 7.2 음성 댓글 텍스트 변환 (시각장애 모드)

#### `POST /api/v1/stt/transcribe`
오디오 파일을 Whisper로 한국어 텍스트로 변환합니다. **인증 필요.**

**요청 형식:** `multipart/form-data`

| 필드 | 타입 | 제한 |
|------|------|------|
| `file` | File | MP3 / WAV / WebM / MP4 / M4A / OGG, 최대 25MB |

**응답 `200`**
```json
{
  "text": "안녕하세요 오늘 날씨가 좋네요",
  "duration_ms": 2456
}
```

---

## 8. 장애 모드 연동

#### `GET /api/v1/users/me/mode`
현재 사용자의 장애 모드 및 UI 설정을 가져옵니다. **인증 필요.**

**응답 `200`**
```json
{
  "mode": "visual",
  "settings": {
    "font_scale": 1.5,
    "high_contrast": true,
    "tts": true,
    "keyboard_nav": true
  },
  "changed_at": "2026-06-27T10:30:00Z"
}
```

### 모드별 기본 settings 값

| 모드 | settings 키 |
|------|-------------|
| `visual` | `font_scale: 1.5`, `high_contrast: true`, `tts: true`, `keyboard_nav: true` |
| `hearing` | `captions: true`, `vibration: true`, `visual_alerts: true` |
| `developmental` | `simplified: true`, `large_icons: true`, `one_item_feed: true` |
| `default` | `font_scale: 1.0`, `high_contrast: false` |

---

#### `PUT /api/v1/users/me/mode`
장애 모드 변경. **인증 필요.**

**요청 Body**
```json
{
  "mode": "hearing"
}
```

`mode` 가능 값: `"visual"` | `"hearing"` | `"developmental"` | `"default"`

**응답 `200`** — 변경된 모드와 settings 반환 (형식은 GET과 동일)

---

## 9. 프론트엔드 설정 예시

### 환경변수 (`.env.local`)

```env
VITE_API_BASE_URL=http://localhost:8000
```

### API 클라이언트 (axios 예시)

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true, // 쿠키 자동 포함
});

// 401 시 자동 토큰 갱신
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        const { data } = await api.post('/api/v1/auth/refresh');
        const newToken = data.access_token;
        localStorage.setItem('access_token', newToken);
        error.config.headers['Authorization'] = `Bearer ${newToken}`;
        return api(error.config);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// 요청마다 access_token 자동 삽입
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers['Authorization'] = `Bearer ${token}`;
  return config;
});

export default api;
```

### 로그인 후 온보딩 분기 처리

```typescript
const { data } = await api.post('/api/v1/auth/login', { nickname, password });
localStorage.setItem('access_token', data.access_token);

if (data.needs_onboarding) {
  router.push('/onboarding'); // 장애 모드 선택 화면
} else {
  router.push('/feed');
}
```

### 장애 모드 적용 예시

```typescript
const { data } = await api.get('/api/v1/users/me/mode');

if (data.mode === 'visual') {
  document.documentElement.style.setProperty('--font-scale', data.settings.font_scale);
  enableTTS(data.settings.tts);
}
```

---

## 미구현 예정 기능 (S2+)

| 기능 | 엔드포인트 | 스프린트 |
|------|-----------|---------|
| 실시간 채팅 (WebSocket/Socket.IO) | `/api/v1/ws` | S2 |
| 메시지 API | `/api/v1/messages` | S2 |
| 신고 API | `/api/v1/reports` | S2 |
| 그루밍 탐지 연동 | `/api/v1/moderation` | M1 |
| 실시간 자막 | 미정 | M1 |
