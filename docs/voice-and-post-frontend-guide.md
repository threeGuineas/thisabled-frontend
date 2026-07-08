# 음성인식(STT) · 글쓰기(게시물 작성) — 프론트엔드 연동 가이드

시각장애 사용자를 위한 음성 입력(VIS-03)과, 그 결과를 실어 글을 쓰는 게시물 작성(POST-01) 흐름을
정리한다. 두 기능은 별개 API지만 실제 사용 흐름에서는 "말하면 글이 채워지고, 그 글을 게시한다"로
이어지므로 함께 본다. 전체 API 스펙은 [api.md](api.md) 참고.

## 1. 음성 입력 (STT): `POST /api/v1/media/transcribe`

버튼을 누르고 말하면 텍스트로 변환해 **입력란에 삽입**하는 용도다. 자동으로 게시되지 않는다(§20-4) —
변환된 텍스트는 사용자가 확인/수정 후 직접 게시 버튼을 눌러야 올라간다.

- 인증 필요, `multipart/form-data`, 필드명 `file` (녹음 파일)
- 크기 제한: 25MB 이하 (`MAX_AUDIO_MB`), 초과 시 413
- 파일 형식 제한 없음 (content-type 화이트리스트 없이 그대로 STT 엔진에 전달)
- **일일/분당 횟수 제한 없음** — 게시물 자막(§3)이나 사진 설명(§4)과 달리 쿼터 카운터를 소비하지 않는다.

```
POST /api/v1/media/transcribe
Content-Type: multipart/form-data
file: <녹음 blob>

← 200 { "text": "오늘 날씨가 정말 좋네요" }
```

- 변환 실패 시 `502 { "detail": "음성 변환에 실패했습니다. 다시 말하기를 시도해 주세요" }` →
  재시도 유도(자동 재시도 없음, FE가 버튼 다시 누르게 안내).
- 흔한 실수: 경로가 `/stt/transcribe`가 아니라 **`/media/transcribe`** 다. STT 전용 라우터가
  따로 없고 `media` 라우터 안에 있다.

용도는 음성 입력 그 자체(어느 텍스트 입력란이든 적용 가능)이며, 아래 게시물 작성의 `content`
필드를 채우는 데 쓰는 게 대표 사용처다.

## 2. 글쓰기 흐름 개요

게시물은 **텍스트+사진**과 **영상**, 두 경로가 완전히 다르다.

```
[텍스트/사진 게시물]                         [영상 게시물]
POST /media/images (사진 최대 3장, 선택)      POST /media/videos (파일 1개)
        │                                     → 내부 드래프트 생성 + 자막 생성 즉시 시작
        ▼                                             │
POST /posts { content, media_ids }                    ▼
  → 즉시 공개 (published)                    GET /posts/{id}/caption-status  (폴링)
  → 사진 있으면 설명(VISION-01) 백그라운드 생성          │
                                                        ▼
                                             POST /posts/{id}/publish
                                               → 이 시점에 실제로 공개(published)
```

**핵심 차이: 텍스트/사진 게시물은 `POST /posts` 호출 즉시 공개된다.** 영상은 `POST /media/videos`
시점엔 `processing` 상태의 드래프트만 만들어지고, 자막 생성이 끝난 뒤 **사용자가 명시적으로**
`POST /posts/{id}/publish`를 눌러야 공개된다(§20-4/6 — AI 처리 완료 여부와 무관하게 게시는 항상
사용자 실행으로만).

## 3. 텍스트/사진 게시물

### ① (선택) 사진 업로드 — `POST /api/v1/media/images`

`docs/signup-onboarding-frontend-guide.md` §2와 동일한 API. 최대 3장, jpeg/png/gif/webp,
장당 10MB. 응답으로 받은 `media_id` 목록을 다음 단계에 그대로 넘긴다.

### ② 게시 — `POST /api/v1/posts`

```json
{ "content": "오늘 날씨가 정말 좋네요", "media_ids": ["uuid1", "uuid2"] }
```

- `content`: 필수, 빈 문자열 불가 (`min_length=1`). §1의 STT 결과를 그대로 넣거나 이어붙이면 됨.
- `media_ids`: 선택, 생략 시 `[]`. **①에서 업로드했지만 아직 어떤 게시물에도 안 붙은 이미지만** 넣을
  수 있다 — 다른 게시물에 이미 붙었거나 본인이 올린 게 아니면 403, 존재하지 않으면 404.
- 응답 `201`로 `PostOut` 전체가 즉시 내려온다. `status: "published"`.
- 사진이 있으면 게시 직후 **사진 설명(VISION-01)이 백그라운드로 생성**된다. 응답 시점엔
  `media[].description_status: "processing"`이고 `description: null`이다 — 완료 여부는
  `GET /posts/{id}`를 다시 불러서 확인해야 한다(전용 폴링 API 없음, 목록/상세 재조회로 확인).
- 사진 설명은 하루 20회 / 분당 5회 한도(사용자당, **게시물+채팅 합산**). 한도 초과 시 조용히
  `description_status: "failed"`로 남고 게시 자체는 막히지 않는다(§18.3 — AI 실패가 기본 흐름을
  막지 않음). FE는 실패 시 "설명 생성 실패" 정도로 표시하면 됨, 에러 팝업 불필요.

### ③ 수정 / 삭제

- `PATCH /api/v1/posts/{id}` — `{ "content": "..." }`만 수정 가능(사진 교체 불가, 작성자만, 403).
- `DELETE /api/v1/posts/{id}` — 작성자만, 204.

## 4. 영상 게시물 (텍스트/사진과 별도 경로)

### ① 업로드 — `POST /api/v1/media/videos`

```
Content-Type: multipart/form-data
file: <영상 파일>
duration_seconds: 87        // Form 필드. 길이는 FE가 재서 신고 (서버에 길이 실검증 없음)
```

- 형식: `video/mp4`, `video/webm`, `video/quicktime`만 허용(400).
- 길이: `duration_seconds`가 180초(3분) 초과면 400 — **서버는 실제 파일 길이를 검증하지 않으므로
  FE가 정확히 측정해서 보내야 한다.**
- 용량: 200MB 이하(`MAX_VIDEO_MB`), 초과 시 413.
- 하루 5회 한도(`CAPTION_DAILY_LIMIT`, **게시물+채팅 영상 합산**), 초과 시
  `429 { "detail": "영상 업로드는 하루 5회까지 가능합니다 (게시물·채팅 합산)" }`.
- 성공(`201`) 시 **자동으로 `processing` 상태의 Post 드래프트가 생성**되고 자막(CAPTION-01)
  생성이 즉시 백그라운드로 시작된다.

```json
{ "post_id": "uuid", "media_id": "uuid", "caption_status": "processing" }
```

이 `post_id`를 들고 있다가 아래 단계에서 그대로 쓴다.

### ② 자막 상태 폴링 — `GET /api/v1/posts/{post_id}/caption-status`

```json
{ "caption_status": "processing" | "done" | "failed" }
```

- 작성자 본인만 조회 가능. 몇 초 간격으로 폴링해서 `processing` → `done`/`failed`로 바뀔 때까지
  기다렸다가 게시 버튼을 활성화하면 된다(자막 생성 완료/실패 알림도 별도로 옴, §16 — 알림 API로도
  트리거 가능하지만 폴링이 더 단순).
- 영상이 없는 게시물 id로 호출하면 404.

### ③ 게시 — `POST /api/v1/posts/{post_id}/publish`

```json
{ "allow_no_caption": false }
```

- 자막이 아직 `processing`이면 `409` — "자막을 만드는 중입니다. 잠시 후 다시 시도해 주세요" →
  버튼 비활성 유지, 폴링 계속.
- 자막이 `failed`(재시도 2회 소진 후에도 실패)면 기본적으로 `400`으로 막힌다. 이때만
  `allow_no_caption: true`를 보내면 자막 없이 게시할 수 있다 — **"자막 없이 게시" 버튼을 별도로
  노출해서 사용자가 명시적으로 선택하게 해야 한다**(자동으로 우회하면 안 됨, CAPTION-01 정책 예외).
- 이미 공개된 게시물을 다시 publish하면 400.
- 성공 시 `PostOut`이 내려오며 `status: "published"`, `media[0].caption`에 자막 세그먼트
  (`[{start, end, text}, ...]`)가 채워진다.

### 영상 드래프트는 `POST /posts`로 만들지 않는다

`POST /media/videos`가 이미 `Post` 레코드(processing 상태)를 만든다. 여기에 `POST /posts`의
`media_ids`로 영상을 다시 넣으려 하면 **400**이 난다("영상 게시물은 영상 업로드 시 만들어진
드래프트로 게시해 주세요"). 즉 텍스트/사진 경로와 영상 경로는 절대 섞어 쓰면 안 된다.

## 5. 상태값 요약

| 필드 | 값 | 의미 |
|---|---|---|
| `Post.status` | `processing` | 영상 드래프트, 아직 미공개 (작성자만 조회 가능) |
| | `published` | 공개됨 |
| `media[].description_status` | `processing` / `done` / `failed` | 사진 설명(VISION-01) 생성 상태 |
| `media[].caption_status` | `processing` / `done` / `failed` | 영상 자막(CAPTION-01) 생성 상태 |

`processing`/`failed`여도 사용자에게 보이는 콘텐츠 자체(사진/영상)는 정상 노출된다 — 설명/자막은
접근성 보조 정보이지 게시를 막는 필수 조건이 아니다(사진 게시물은 애초에 막지 않고, 영상은 §4③의
`allow_no_caption`으로 우회 가능).

## 6. 에러 케이스 요약

| 단계 | 상황 | 응답 | FE 처리 |
|---|---|---|---|
| STT | 25MB 초과 | 413 | 파일 크기 안내 |
| STT | 변환 실패 | 502 | "다시 말하기를 시도해 주세요" |
| 게시(공통) | `content` 빈 문자열 | 422 | 내용 입력 안내 |
| 사진 게시 | 남의/이미 붙은 미디어 id | 403 / 404 | 업로드부터 재시도 |
| 사진 게시 | 사진 4장 이상 | 400 | 최대 3장 안내 |
| 영상 업로드 | 3분 초과 | 400 | 길이 안내 (FE가 직접 측정한 값 기준) |
| 영상 업로드 | 200MB 초과 | 413 | 용량 안내 |
| 영상 업로드 | 하루 5회 초과 | 429 | 내일 다시 시도 안내 |
| 영상 게시 | 자막 생성 중 | 409 | 버튼 비활성 + 폴링 유지 |
| 영상 게시 | 자막 실패, `allow_no_caption` 미지정 | 400 | "자막 없이 게시" 옵션 노출 |
| 영상 게시 | 이미 공개됨 | 400 | 게시 버튼 숨김/무시 |
| 영상 게시 | 사진 경로로 영상 등록 시도 | 400 | 영상은 `/media/videos` 경로 강제 |

모든 에러는 `{ "detail": "<한국어 메시지>" }` 형식이며, `detail` 문자열이 아니라 **HTTP status +
엔드포인트 조합**으로 분기하는 걸 권장한다(동일 400이라도 단계별 의미가 다름).
