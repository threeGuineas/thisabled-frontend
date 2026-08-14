# 게시물 동영상 첨부 기능 — 프론트엔드 연동 가이드

## 결론

**동영상 첨부 업로드 기능은 이미 구현되어 있습니다.** 다만 이미지와 완전히 동일한 흐름이 아니라 **영상 전용 별도 플로우**입니다.

- 이미지: 업로드 → `media_ids`를 `POST /posts`에 넣어 **즉시 공개 게시**
- 영상: 업로드 즉시 서버가 **비공개 드래프트 게시물**을 자동 생성 → 자막(caption) 생성이 끝날 때까지 폴링 → 사용자가 명시적으로 **게시 확정** 호출

공통 사항:
- Base path: **`/api/v1`** (아래 경로는 모두 이 prefix가 붙습니다. 예: `POST /api/v1/media/videos`)
- 인증: `Authorization: Bearer <access_token>` 헤더 필수 (없으면 401, 유효하지 않으면 401)
- 에러 응답 포맷: FastAPI 기본 형식 `{ "detail": "에러 메시지" }`

---

## 전체 플로우 (시퀀스)

1. `POST /media/videos` (multipart) — 영상 업로드 → `post_id`, `media_id` 발급, 서버가 백그라운드로 자막 생성 시작
2. (선택/권장) `GET /posts/{post_id}/caption-status` 를 주기적으로 폴링 → `caption_status`가 `processing`이 아니게 될 때까지 대기
3. `POST /posts/{post_id}/publish` — 게시 확정 (본문 작성용 `content`는 이 단계에 없음에 주의 — 아래 "알려진 제약" 참고)
4. 게시 완료 후 `GET /posts/{post_id}` 로 최종 게시물 조회 가능

---

## API 레퍼런스

### 1) 영상 업로드 — `POST /media/videos`

- Content-Type: `multipart/form-data`
- 필드:

| 필드명 | 타입 | 필수 | 설명 |
|---|---|---|---|
| `file` | File | Y | 영상 파일 (`video/mp4`, `video/webm`, `video/quicktime` 중 하나) |
| `duration_seconds` | int (form field) | Y | 영상 길이(초). **서버는 이 값을 검증하지 않고 프론트가 보낸 값을 그대로 신뢰합니다** (`ffprobe` 미탑재). 정확히 측정해서 보내야 함 |

- 인증: Bearer 필요

- 성공 응답 `201 Created`:
```json
{
  "post_id": "uuid",
  "media_id": "uuid",
  "caption_status": "processing"
}
```
(`app/schemas/media.py`의 `VideoUploadOut`)

- 에러:

| 상태코드 | 상황 | detail 메시지 |
|---|---|---|
| 400 | `duration_seconds`가 180초(`MAX_VIDEO_SECONDS`) 초과 | `"영상은 최대 3분까지 올릴 수 있습니다"` |
| 400 | `file.content_type`이 허용 목록에 없음 | `"지원하지 않는 영상 형식입니다"` |
| 413 | 파일 크기가 200MB(`MAX_VIDEO_MB`) 초과 | `"영상은 200MB 이하만 가능합니다"` |
| 429 | 일일 자막 생성 쿼터(5회, `CAPTION_DAILY_LIMIT`) 소진 — **게시물 업로드와 채팅 영상 전송이 쿼터를 공유** | `"영상 업로드는 하루 5회까지 가능합니다 (게시물·채팅 합산)"` |
| 401 | 토큰 없음/무효 | `"Not authenticated"` / `"Invalid token"` |

이 호출이 성공하면 서버 DB에는 `status = "processing"`인 `Post`가 이미 생성되어 있습니다(사용자에게는 아직 비공개).

---

### 2) 자막 생성 상태 폴링 — `GET /posts/{post_id}/caption-status`

- 작성자 본인만 조회 가능
- 성공 응답 `200`:
```json
{ "caption_status": "processing" }
```
- `caption_status` 가능한 값 (`AiStatus` enum, `app/core/enums.py`): `"none" | "processing" | "done" | "failed"`
- 프론트는 이 값이 `"processing"`이 아닐 때까지(즉 `"done"` 또는 `"failed"`) 주기적으로 폴링해야 합니다. 서버는 웹소켓/SSE 푸시를 제공하지 않으므로 **클라이언트 사이드 폴링(interval) 구현 필요**.
- 에러: 404 (`"게시물을 찾을 수 없습니다"`, 본인 게시물이 아니거나 존재하지 않음), 404 (`"영상이 없는 게시물입니다"`, video media가 없는 post_id인 경우)

---

### 3) 게시 확정 — `POST /posts/{post_id}/publish`

- Content-Type: `application/json`
- Body:
```json
{ "allow_no_caption": false }
```
  - `allow_no_caption`: 자막 생성이 `failed` 상태일 때, 사용자가 "자막 없이 게시"를 명시적으로 선택했는지 여부 (기본값 `false`)

- 성공 응답 `200`: `PostOut` 전체 객체 (아래 "공통 응답 모델" 참고)

- 에러:

| 상태코드 | 상황 | detail |
|---|---|---|
| 404 | post_id가 없거나 본인 게시물이 아님 | `"게시물을 찾을 수 없습니다"` |
| 400 | 이미 게시된 게시물 | `"이미 게시된 게시물입니다"` |
| 409 | 자막 생성이 아직 `processing` 중 | `"자막을 만드는 중입니다. 잠시 후 다시 시도해 주세요"` → 프론트는 이 경우 재시도 안내 또는 폴링 계속 |
| 400 | 자막 생성 `failed` & `allow_no_caption=false` | `"자막 생성에 실패했습니다. 다시 시도하거나 '자막 없이 게시'를 선택해 주세요"` → 프론트는 "자막 없이 게시" UI 제공 필요 |

---

### 4) 게시물 상세 조회 — `GET /posts/{post_id}`

- 게시 완료 후(또는 작성자 본인이 드래프트 상태에서도) 조회 가능
- 응답: `PostOut`

### 공통 응답 모델 (`PostOut`)

```json
{
  "id": "uuid",
  "author": { "id": "uuid | null", "nickname": "string", "profile_image_url": "string | null" },
  "content": "string",
  "status": "processing | published",
  "media": [
    {
      "id": "uuid",
      "media_type": "image | video",
      "url": "string",
      "sort_order": 0,
      "description": "string | null",
      "description_status": "none | processing | done | failed",
      "caption": "array | null",
      "caption_status": "none | processing | done | failed"
    }
  ],
  "like_count": 0,
  "comment_count": 0,
  "liked_by_me": false,
  "published_at": "datetime | null",
  "created_at": "datetime"
}
```

---

## (비교) 이미지 업로드 플로우

- `POST /media/images` (multipart, 필드명 `files`, 최대 3장) → `{ "items": [{ "media_id": "uuid", "url": "string" }] }`
- 허용 MIME: `image/jpeg`, `image/png`, `image/gif`, `image/webp`
- 크기 제한: 10MB (`MAX_UPLOAD_MB`)
- 이후 `POST /posts` 본문에 `{ "content": "...", "media_ids": ["uuid", ...] }`를 넣어 **즉시 게시**. `media_ids`에 video 타입 미디어를 넣으면 400 에러(`"영상 게시물은 영상 업로드 시 만들어진 드래프트로 게시해 주세요"`).

---

## 알려진 제약 / 프론트에서 반드시 알아야 할 사항

1. **본문(content) 텍스트를 영상 게시물에 붙일 API가 현재 없습니다.**
   - `POST /media/videos`는 `content` 파라미터를 받지 않고, 서버가 내부적으로 `content=""`인 드래프트 `Post`를 생성합니다.
   - `POST /posts/{post_id}/publish`도 `allow_no_caption` 외의 필드를 받지 않아 `content`를 넘길 방법이 없습니다.
   - `PATCH /posts/{post_id}`로 게시 후(혹은 게시 전 드래프트 상태에서도, 작성자 본인이면) 별도로 `content`를 수정할 수는 있습니다 (`{ "content": "..." }`).
   - → 영상 게시물에 텍스트 설명을 붙이고 싶다면, **`publish` 이후(혹은 이전) `PATCH /posts/{post_id}` 호출을 추가로 조합**해야 합니다. 백엔드 스펙 확정이 필요하면 별도 논의 필요.

2. **영상은 1개 게시물당 1개만 지원됩니다.** (`PostMedia`를 `post_id`+`media_type=video`로 단건 조회하는 구조) 이미지처럼 여러 개를 한 게시물에 묶는 기능은 영상에는 없습니다.

3. **저장 파일 확장자 이슈**: 서버가 로컬 저장 시 확장자를 content-type으로 매핑하는데(`app/core/storage.py`), 이미지 4종만 매핑되어 있고 영상 MIME(`video/mp4`, `video/webm`, `video/quicktime`)은 매핑이 없어 **저장 파일이 `.bin` 확장자로 저장됩니다.** 즉 업로드 응답으로 내려오는 `url`이 `/uploads/{uuid}.bin` 형태일 수 있습니다.
   - `<video>` 태그나 일부 플레이어는 확장자 없이도 서버가 내려주는 `Content-Type` 헤더로 재생 가능하지만, 정적 파일 서빙 방식에 따라 헤더가 `application/octet-stream`으로 내려갈 위험이 있습니다. **실제 브라우저에서 업로드된 영상 URL이 정상 재생되는지 반드시 확인 필요** — 안 되면 백엔드 수정(확장자 매핑 추가 또는 Content-Type 헤더 명시)이 선행되어야 합니다.

4. **길이 제한(3분)은 서버가 검증하지 않습니다.** 프론트가 `duration_seconds`를 정확히 계산해 보내야 하며, 악의적 클라이언트가 값을 조작하면 서버는 이를 그대로 신뢰합니다(보안/정합성 측면에서 서버측 검증 부재 — 참고만 하되 프론트 구현과는 무관).

5. **일일 쿼터 5회는 게시물 영상 업로드와 채팅 영상 전송이 공유**합니다. 429 발생 시 사용자에게 "오늘 영상 업로드/전송 횟수를 모두 사용했습니다" 같은 안내가 필요합니다.

6. **폴링 간격은 백엔드가 지정하지 않습니다.** 실시간 푸시가 없으므로 프론트에서 자체적으로 폴링 주기(예: 2~3초)를 정해야 합니다.

---

## 관련 파일 목록 (백엔드)

- `app/api/v1/posts.py` — 게시물 생성/조회/게시확정/피드 컨트롤러
- `app/api/v1/media.py` — 이미지/영상/음성 업로드 컨트롤러
- `app/models/post.py` — `Post`, `PostMedia` 엔티티
- `app/schemas/post.py` — `PostCreateIn`, `PostOut`, `MediaOut` 등
- `app/schemas/media.py` — `VideoUploadOut`, `ImageUploadOut`, `CaptionStatusOut`, `PublishIn`
- `app/core/storage.py` — 로컬 파일 저장 로직 (S3 미사용)
- `app/core/enums.py` — `MediaType`, `AiStatus`, `PostStatus`
- `app/core/config.py` — 업로드 제한값 (`MAX_VIDEO_MB=200`, `MAX_VIDEO_SECONDS=180`, `CAPTION_DAILY_LIMIT=5` 등)
- `app/core/deps.py` — 인증(Bearer JWT) 의존성
- `app/main.py` — 라우터 prefix `/api/v1` 등록
