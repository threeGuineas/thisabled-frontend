# ThisAbled — 장애 모드 연동 가이드

> 대상: 프론트엔드 개발자  
> 최종 업데이트: 2026-06-18  
> 담당 백엔드: mi-noong

---

## 개요

장애 모드(`disability_type`)는 서비스 전체 UI를 결정하는 핵심 값입니다.  
현재 백엔드에서 모드가 관여하는 시점은 **2가지**입니다.

| 시점 | API | 설명 |
|------|-----|------|
| 회원가입 | `POST /api/v1/auth/register` | 모드를 선택해서 계정 생성 |
| 앱 초기화 | `GET /api/v1/auth/me` | 저장된 모드를 읽어 UI에 적용 |

> 가입 후 모드 변경 API는 현재 미구현입니다. 회원가입 시 1회 선택으로 고정됩니다.

---

## 모드 값 정의

| `disability_type` 값 | UI 모드 | 설명 |
|----------------------|---------|------|
| `"visual"` | 시각장애 모드 | GPT-4o 이미지 음성 해설, Whisper 음성 댓글 |
| `"developmental"` | 발달장애 모드 | 그루밍/혐오 탐지, 신고 UI 강화 |
| `"hearing"` | 청각장애 모드 | 실시간 자막, LLM 소통 코칭 |
| `"none"` | 일반 모드 | 기본 UI (기본값) |

---

## 1. 회원가입 시 모드 선택

**POST** `/api/v1/auth/register`

회원가입 폼에서 모드를 선택받아 `disability_type` 필드에 담아 전송합니다.

### Request Body

```json
{
  "nickname": "홍길동",
  "password": "mypassword123",
  "disability_type": "visual"
}
```

> `disability_type`을 생략하면 자동으로 `"none"` (일반 모드)으로 설정됩니다.

### 성공 응답 `201 Created`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

> 응답에 `disability_type`이 포함되지 않습니다.  
> 토큰 저장 후 아래 `/auth/me` 를 호출해 모드 값을 가져오거나,  
> 회원가입 폼에서 선택한 값을 그대로 로컬에 보관해도 됩니다.

### 구현 예시

```js
async function register({ nickname, password, disabilityType }) {
  const res = await fetch('http://localhost:8000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      nickname,
      password,
      disability_type: disabilityType,  // "visual" | "developmental" | "hearing" | "none"
    }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(err.detail)
  }

  const { access_token } = await res.json()
  localStorage.setItem('access_token', access_token)

  // 모드 값 적용 (선택 1: 폼에서 선택한 값 바로 사용)
  applyMode(disabilityType)

  // 모드 값 적용 (선택 2: /me 호출로 서버에서 확인)
  // const user = await fetchMe()
  // applyMode(user.disability_type)
}
```

---

## 2. 앱 초기화 시 모드 읽기

**GET** `/api/v1/auth/me`

앱이 시작될 때 (또는 새로고침 시) 저장된 토큰으로 현재 유저 정보와 모드를 가져옵니다.

### Request Header

```
Authorization: Bearer <access_token>
```

### 성공 응답 `200 OK`

```json
{
  "id": 1,
  "nickname": "홍길동",
  "disability_type": "visual"
}
```

### 에러 응답

| 상태코드 | 원인 | 처리 방법 |
|---------|------|----------|
| `401 Unauthorized` | 토큰 없음 또는 만료 | 토큰 삭제 후 로그인 화면으로 이동 |

### 구현 예시

```js
async function initApp() {
  const token = localStorage.getItem('access_token')

  if (!token) {
    redirectToLogin()
    return
  }

  const res = await fetch('http://localhost:8000/api/v1/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    localStorage.removeItem('access_token')
    redirectToLogin()
    return
  }

  const user = await res.json()
  applyMode(user.disability_type)
}
```

---

## 3. 모드 적용 함수 예시

```js
function applyMode(disabilityType) {
  switch (disabilityType) {
    case 'visual':
      // 시각장애 모드 UI 활성화
      // - 이미지 음성 해설 버튼 표시
      // - 폰트 크기 확대, 고대비 테마 적용
      break
    case 'developmental':
      // 발달장애 모드 UI 활성화
      // - 혐오/그루밍 탐지 경고 UI 활성화
      // - 간결한 텍스트, 큰 버튼
      break
    case 'hearing':
      // 청각장애 모드 UI 활성화
      // - 자막 영역 표시
      // - 진동/시각 알림 우선
      break
    case 'none':
    default:
      // 기본 UI 유지
      break
  }
}
```

---

## 전체 플로우

```
[회원가입]
모드 선택 화면 → disability_type 선택
  → POST /api/v1/auth/register { nickname, password, disability_type }
  → access_token 저장
  → applyMode(disability_type) → 메인 피드

[앱 시작 / 새로고침]
localStorage에서 token 확인
  → 없음: 로그인 화면
  → 있음: GET /api/v1/auth/me
    → 200: applyMode(user.disability_type) → 메인 피드
    → 401: token 삭제 → 로그인 화면

[로그인]
POST /api/v1/auth/login
  → access_token 저장
  → GET /api/v1/auth/me 로 disability_type 확인
  → applyMode(disability_type) → 메인 피드
```

---

## 현재 미구현 / 예정 사항

| 기능 | 상태 | 예정 API |
|------|------|----------|
| 가입 후 모드 변경 | 미구현 | `PATCH /api/v1/users/me` |
| 모드별 콘텐츠 필터링 | 미구현 | 게시글 조회 시 파라미터 추가 예정 |
