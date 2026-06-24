# ThisAbled — 게시글 API 연동 가이드

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
| Swagger UI | `http://localhost:8000/docs` |

---

## 엔드포인트 목록

| 메서드 | 경로 | 설명 | 인증 필요 |
|--------|------|------|----------|
| POST | `/api/v1/upload` | 이미지 업로드 | O |
| POST | `/api/v1/posts` | 게시글 작성 | O |
| GET | `/api/v1/posts` | 게시글 피드 (목록) | X |
| GET | `/api/v1/posts/{post_id}` | 게시글 단건 조회 | X |
| DELETE | `/api/v1/posts/{post_id}` | 게시글 삭제 | O |

> 인증이 필요한 API는 요청 헤더에 `Authorization: Bearer <access_token>` 를 포함해야 합니다.  
> 토큰 발급 방법은 [api-auth.md](./api-auth.md) 참고.

---

## 게시글 등록 플로우

이미지가 있는 게시글과 없는 게시글의 등록 흐름이 다릅니다.

```
[이미지 없는 게시글]
POST /api/v1/posts  { content }
  → 완료

[이미지 있는 게시글]
① POST /api/v1/upload  (이미지 파일)
     → 응답: { url: "/uploads/abc123.jpg" }
② POST /api/v1/posts  { content, image_url: "/uploads/abc123.jpg" }
     → 완료
```

> 이미지를 먼저 업로드해서 `url`을 받은 뒤, 그 값을 `image_url`에 담아 게시글을 등록합니다.

---

## 1. 이미지 업로드

**POST** `/api/v1/upload`

> 인증 필요 — `Authorization: Bearer <token>`

### Request

- Content-Type: `multipart/form-data`
- 필드명: `file`

```js
// FormData 구성 예시
const formData = new FormData()
formData.append('file', imageFile)  // File 객체

await fetch('http://localhost:8000/api/v1/upload', {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}` },
  body: formData,
  // Content-Type은 브라우저가 자동으로 multipart/form-data로 설정합니다 — 직접 지정하지 마세요
})
```

### 허용 파일 형식 및 제한

| 항목 | 값 |
|------|-----|
| 허용 MIME 타입 | `image/jpeg`, `image/png`, `image/gif`, `image/webp` |
| 최대 파일 크기 | **10 MB** |

### 성공 응답 `201 Created`

```json
{
  "url": "/uploads/3f2a1b4c8d9e0f1a2b3c4d5e6f7a8b9c.jpg"
}
```

이 `url` 값을 그대로 게시글 작성 시 `image_url` 필드에 넣으면 됩니다.

### 이미지 실제 접근 URL

```
http://localhost:8000/uploads/3f2a1b4c8d9e0f1a2b3c4d5e6f7a8b9c.jpg
```

> `<img src={`http://localhost:8000${url}`} />` 형태로 사용하세요.

### 에러 응답

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `401 Unauthorized` | 토큰 없음 또는 만료 | `"Invalid token"` |
| `413 Request Entity Too Large` | 파일이 10 MB 초과 | `"File exceeds 10 MB limit"` |
| `415 Unsupported Media Type` | 허용되지 않는 파일 형식 | `"Allowed types: image/jpeg, image/png, image/gif, image/webp"` |

---

## 2. 게시글 작성

**POST** `/api/v1/posts`

> 인증 필요 — `Authorization: Bearer <token>`

### Request Body

```json
{
  "content": "오늘 날씨가 정말 좋네요!",
  "image_url": "/uploads/3f2a1b4c8d9e0f1a2b3c4d5e6f7a8b9c.jpg"
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `content` | string | O | 게시글 본문 텍스트 |
| `image_url` | string \| null | X | 업로드 API에서 받은 `url` 값. 이미지 없으면 생략 |

### 성공 응답 `201 Created`

```json
{
  "id": 42,
  "user_id": 7,
  "content": "오늘 날씨가 정말 좋네요!",
  "image_url": "/uploads/3f2a1b4c8d9e0f1a2b3c4d5e6f7a8b9c.jpg",
  "created_at": "2026-06-17T10:23:45.123456+00:00"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `id` | number | 게시글 고유 ID |
| `user_id` | number | 작성자 유저 ID |
| `content` | string | 본문 |
| `image_url` | string \| null | 이미지 경로 (없으면 `null`) |
| `created_at` | string (ISO 8601) | 작성 시각 (UTC) |

### 에러 응답

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `401 Unauthorized` | 토큰 없음 또는 만료 | `"Invalid token"` |
| `422 Unprocessable Entity` | `content` 필드 누락 | Pydantic 상세 메시지 |

---

## 3. 게시글 피드 (목록 조회)

**GET** `/api/v1/posts`

> 인증 불필요 — 비로그인 상태에서도 피드 조회 가능

### Query Parameters

| 파라미터 | 타입 | 기본값 | 설명 |
|---------|------|--------|------|
| `offset` | number | `0` | 건너뛸 게시글 수 (페이지네이션) |
| `limit` | number | `20` | 한 번에 가져올 최대 게시글 수 |

```
GET /api/v1/posts              → 최신 20개
GET /api/v1/posts?offset=20   → 21번째부터 20개 (다음 페이지)
GET /api/v1/posts?limit=10    → 최신 10개
```

### 성공 응답 `200 OK`

```json
[
  {
    "id": 42,
    "user_id": 7,
    "content": "오늘 날씨가 정말 좋네요!",
    "image_url": "/uploads/3f2a1b4c8d9e0f1a2b3c4d5e6f7a8b9c.jpg",
    "created_at": "2026-06-17T10:23:45.123456+00:00"
  },
  {
    "id": 41,
    "user_id": 3,
    "content": "안녕하세요 처음 가입했어요",
    "image_url": null,
    "created_at": "2026-06-17T09:11:00.000000+00:00"
  }
]
```

> 최신 게시글이 배열 앞에 옵니다 (내림차순).  
> 게시글이 없으면 빈 배열 `[]` 을 반환합니다.

### 무한 스크롤 구현 예시

```js
let offset = 0
const LIMIT = 20

async function loadMore() {
  const res = await fetch(
    `http://localhost:8000/api/v1/posts?offset=${offset}&limit=${LIMIT}`
  )
  const posts = await res.json()

  if (posts.length < LIMIT) {
    // 더 이상 불러올 게시글 없음
  }

  offset += posts.length
  return posts
}
```

---

## 4. 게시글 단건 조회

**GET** `/api/v1/posts/{post_id}`

> 인증 불필요

### 성공 응답 `200 OK`

```json
{
  "id": 42,
  "user_id": 7,
  "content": "오늘 날씨가 정말 좋네요!",
  "image_url": "/uploads/3f2a1b4c8d9e0f1a2b3c4d5e6f7a8b9c.jpg",
  "created_at": "2026-06-17T10:23:45.123456+00:00"
}
```

### 에러 응답

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `404 Not Found` | 해당 ID 게시글 없음 | `"Post not found"` |

---

## 5. 게시글 삭제

**DELETE** `/api/v1/posts/{post_id}`

> 인증 필요 — 본인이 작성한 게시글만 삭제 가능

### 성공 응답 `204 No Content`

응답 바디 없음.

### 에러 응답

| 상태코드 | 원인 | `detail` 값 |
|---------|------|-------------|
| `401 Unauthorized` | 토큰 없음 또는 만료 | `"Invalid token"` |
| `403 Forbidden` | 다른 사람의 게시글 | `"Not your post"` |
| `404 Not Found` | 해당 ID 게시글 없음 | `"Post not found"` |

---

## 전체 구현 예시 (이미지 포함 게시글 등록)

```js
async function createPost({ content, imageFile }) {
  const token = localStorage.getItem('access_token')
  const headers = { Authorization: `Bearer ${token}` }

  // ① 이미지가 있으면 먼저 업로드
  let image_url = null
  if (imageFile) {
    const formData = new FormData()
    formData.append('file', imageFile)

    const uploadRes = await fetch('http://localhost:8000/api/v1/upload', {
      method: 'POST',
      headers,
      body: formData,
    })

    if (!uploadRes.ok) {
      const err = await uploadRes.json()
      throw new Error(err.detail)
    }

    const uploadData = await uploadRes.json()
    image_url = uploadData.url
  }

  // ② 게시글 등록
  const postRes = await fetch('http://localhost:8000/api/v1/posts', {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, image_url }),
  })

  if (!postRes.ok) {
    const err = await postRes.json()
    throw new Error(err.detail)
  }

  return await postRes.json()
}
```

---

## `created_at` 날짜 표시

응답의 `created_at`은 UTC 기준 ISO 8601 형식입니다. 한국 시간(KST, UTC+9)으로 변환해서 표시하세요.

```js
function formatDate(isoString) {
  return new Date(isoString).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// "2026. 06. 17. 오전 10:23" 형태로 출력
```
