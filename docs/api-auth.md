# ThisAbled — 인증 API 연동 가이드

> 대상: 프론트엔드 개발자  
> 최종 업데이트: 2026-06-17  
> 담당 백엔드: mi-noong

---

## 기본 정보

| 항목 | 값 |
|------|-----|
| Base URL (로컬) | `http://localhost:8000` |
| API 접두사 | `/api/v1` |
| 인증 방식 | JWT Bearer Token |
| 요청 Content-Type | `application/json` |
| 응답 Content-Type | `application/json` |

> Swagger UI: `http://localhost:8000/docs`  
> 모든 API 응답 스펙은 Swagger에서 직접 확인 및 테스트 가능합니다.

---

## 엔드포인트 목록

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|----------|
| POST | `/api/v1/auth/register` | 회원가입 | X |
| POST | `/api/v1/auth/login` | 로그인 | X |
| GET | `/api/v1/auth/me` | 내 정보 조회 | O |

---

## 1. 회원가입

**POST** `/api/v1/auth/register`

### Request Body

```json
{
  "nickname": "홍길동",
  "password": "mypassword123",
  "disability_type": "visual"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `nickname` | string | O | 2~50자, 서비스 내 고유값 |
| `password` | string | O | 최소 8자 이상 |
| `disability_type` | string | X | 아래 값 중 하나 (기본값: `"none"`) |

#### `disability_type` 허용 값

| 값 | 설명 |
|----|------|
| `"visual"` | 시각장애 모드 |
| `"developmental"` | 발달장애 모드 |
| `"hearing"` | 청각장애 모드 |
| `"none"` | 일반 (기본값) |

### 성공 응답 `201 Created`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

> 회원가입 성공 시 자동으로 토큰을 발급합니다. 별도 로그인 없이 바로 사용 가능합니다.

### 에러 응답

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `409 Conflict` | 이미 사용 중인 닉네임 | `"Nickname already taken"` |
| `422 Unprocessable Entity` | 유효성 검사 실패 (닉네임 길이, 비밀번호 길이 등) | Pydantic 상세 메시지 배열 |

---

## 2. 로그인

**POST** `/api/v1/auth/login`

### Request Body

```json
{
  "nickname": "홍길동",
  "password": "mypassword123"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `nickname` | string | O | 가입 시 사용한 닉네임 |
| `password` | string | O | 가입 시 사용한 비밀번호 |

### 성공 응답 `200 OK`

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

### 에러 응답

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `401 Unauthorized` | 닉네임 없음 또는 비밀번호 불일치 | `"Invalid credentials"` |
| `422 Unprocessable Entity` | 필드 누락 또는 타입 오류 | Pydantic 상세 메시지 배열 |

---

## 3. 내 정보 조회

**GET** `/api/v1/auth/me`

> 인증 토큰이 유효한지 확인하거나, 현재 로그인한 유저 정보를 가져올 때 사용합니다.

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

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `401 Unauthorized` | 토큰 없음, 만료, 또는 위조 | `"Invalid token"` |
| `401 Unauthorized` | 토큰은 유효하나 유저가 삭제된 경우 | `"User not found"` |

---

## 토큰 사용법

### 저장 위치

로그인/회원가입 후 받은 `access_token`을 **localStorage** 또는 **메모리**에 저장합니다.

```js
// 저장
localStorage.setItem('access_token', response.access_token)

// 불러오기
const token = localStorage.getItem('access_token')
```

### 인증이 필요한 API 호출 시

모든 인증 필요 API는 요청 헤더에 아래 형식으로 토큰을 포함해야 합니다.

```
Authorization: Bearer <access_token>
```

**axios 공통 설정 예시:**

```js
import axios from 'axios'

const api = axios.create({
  baseURL: 'http://localhost:8000',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

### 토큰 만료

- 토큰 유효기간: **30분**
- 만료 시 인증 필요 API에서 `401` 응답이 옵니다.
- 현재 토큰 갱신(refresh) 엔드포인트는 미구현입니다. 만료 시 재로그인이 필요합니다.

---

## 유효성 검사 에러 형식 (`422`)

Pydantic 유효성 검사 실패 시 다음 형식으로 응답됩니다.

```json
{
  "detail": [
    {
      "type": "value_error",
      "loc": ["body", "nickname"],
      "msg": "Value error, nickname must be 2–50 characters",
      "input": "a"
    }
  ]
}
```

`detail[].loc` 배열의 마지막 요소가 문제가 된 필드명입니다.

---

## 장애 모드 UI 적용 가이드

로그인/회원가입 직후 받은 토큰으로 `/api/v1/auth/me`를 호출하면 `disability_type`을 확인할 수 있습니다.

```
"visual"        → 시각장애 모드 UI 활성화
"developmental" → 발달장애 모드 UI 활성화
"hearing"       → 청각장애 모드 UI 활성화
"none"          → 기본 UI
```

> 모드 변경 기능은 추후 `PATCH /api/v1/users/me` 형태로 제공 예정입니다. 현재는 회원가입 시 1회 선택으로 고정됩니다.

---

## 전체 플로우 요약

```
[회원가입]
사용자 입력 (nickname, password, disability_type)
  → POST /api/v1/auth/register
  → 성공: access_token 저장 → 메인 피드로 이동
  → 실패(409): "이미 사용 중인 닉네임입니다" 안내

[로그인]
사용자 입력 (nickname, password)
  → POST /api/v1/auth/login
  → 성공: access_token 저장 → 메인 피드로 이동
  → 실패(401): "닉네임 또는 비밀번호가 올바르지 않습니다" 안내

[앱 초기화 / 토큰 검증]
localStorage에서 token 읽기
  → token 없음: 로그인 화면으로
  → token 있음: GET /api/v1/auth/me
    → 200: 유저 정보 + 장애 모드 적용 → 메인 피드로
    → 401: token 삭제 → 로그인 화면으로
```
