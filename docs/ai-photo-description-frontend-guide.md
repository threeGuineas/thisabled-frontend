# AI 사진 설명(VISION-01) — 프론트엔드 연동 가이드

시각장애 사용자를 위해 게시물·채팅에 올라온 **사진을 AI가 텍스트로 설명**해주는 기능(VISION-01)의
연동 방법을 정리한다. 별도의 "사진 설명 요청" API는 없다 — 사진이 포함된 게시물을 게시하거나
채팅으로 사진을 보내면 **부수 효과로** 자동 생성된다. 사진 업로드 자체는
[voice-and-post-frontend-guide.md](voice-and-post-frontend-guide.md) §3①,
[signup-onboarding-frontend-guide.md](signup-onboarding-frontend-guide.md) §2와 동일한 API이므로
여기서는 설명 생성 흐름만 다룬다. 전체 API 스펙은 [api.md](api.md) 참고.

## 1. 핵심 요약 (먼저 읽을 것)

- **트리거 시점이 다르다**: 게시물은 **게시(`POST /posts`) 실행 시점**, 채팅은 **전송(`POST /chat/rooms/{id}/media`) 시점**에 생성이 시작된다. 사진 업로드 자체(`POST /media/images`)는 설명을 만들지 않는다.
- **전용 폴링 API가 없다.** 영상 자막(CAPTION-01)에는 `GET /posts/{id}/caption-status`가 있지만, 사진 설명은 없다 — 게시물은 `GET /posts/{id}`(또는 피드), 채팅은 `GET /chat/rooms/{id}/messages`를 **재조회**해서 상태 변화를 확인해야 한다.
- **실시간 알림도 없다.** 채팅 사진은 전송 즉시 `chat.message` WS 이벤트로 도착하지만, 설명이 완료됐다는 별도 push/WS 이벤트는 오지 않는다. FE가 짧은 간격으로 재조회(폴링)하는 수밖에 없다.
- **실패해도 게시/전송 자체는 절대 막히지 않는다.** 실패 시 `description_status: "failed"`, `description: null`로 조용히 남을 뿐 에러 팝업을 띄울 필요가 없다(§18.3).

## 2. 흐름 개요

```
[게시물 사진]                                   [채팅 사진]
POST /media/images (사진 업로드, 최대 3장)        POST /chat/rooms/{room_id}/media (사진 전송)
        │                                               │
        ▼                                               ▼
POST /posts { content, media_ids }             즉시 전달 (201) + WS "chat.message"
  → 즉시 공개(published)                          description_status: "processing"
  → media[].description_status: "processing"            │
        │                                               ▼
        ▼                                       (백그라운드) VISION-01 생성
   (백그라운드) VISION-01 생성                            │
        │                                               ▼
        ▼                                      GET /chat/rooms/{id}/messages 재조회
GET /posts/{id} 재조회                            → description / description_status 확인
  → description / description_status 확인
```

## 3. 게시물 사진 설명

### ① 사진 업로드 — `POST /api/v1/media/images`

최대 3장, `image/jpeg|png|gif|webp`, 장당 10MB(`MAX_UPLOAD_MB`). 이 시점엔 설명이 생성되지 않는다 — 응답으로 받은 `media_id`를 다음 단계에 넘기기만 하면 된다.

### ② 게시 — `POST /api/v1/posts`

```json
{ "content": "오늘 하늘 사진", "media_ids": ["uuid1", "uuid2"] }
```

- 응답 `201`로 `PostOut`이 즉시 내려오고 `status: "published"`다.
- 사진이 있으면 게시 직후 각 이미지에 대해 VISION-01 생성이 **백그라운드**로 시작된다. 응답 시점의
  `media[]`는 다음과 같다.

```json
{
  "id": "post-uuid",
  "status": "published",
  "media": [
    { "id": "media-uuid", "media_type": "image", "url": "...", "sort_order": 0,
      "description": null, "description_status": "processing",
      "caption": null, "caption_status": "none" }
  ]
}
```

- 왜 업로드 시점이 아니라 게시 시점인가: 사용자가 사진을 골랐다 취소했다 반복해도 설명 API를
  중복 호출하지 않기 위해서다(§20-4). 업로드만 하고 게시하지 않은 사진은 설명이 아예 생성되지 않는다.

### ③ 결과 확인 — `GET /api/v1/posts/{post_id}` 재조회

전용 폴링 엔드포인트가 없으므로 게시물 상세(또는 피드 목록)를 다시 불러 `media[].description_status`가
`processing` → `done`/`failed`로 바뀌었는지 확인한다. 몇 초 간격으로 재조회하는 방식을 권장하며,
완료 알림이 오지 않으므로 **화면을 벗어나기 전까지만** 폴링하고 이후엔 사용자가 새로고침했을 때
최신 값을 받는 정도로 처리해도 무방하다.

## 4. 채팅 사진 설명

### ① 사진 전송 — `POST /api/v1/chat/rooms/{room_id}/media`

```
Content-Type: multipart/form-data
file: <이미지 파일>
```

- 친구 사이 채팅방에서만 가능(신청 대기 중이거나 차단/제한 상태면 403), 미성년-성인 쌍은 애초에
  사진·동영상 전송이 막힌다(§4.5).
- 사진은 **안전 분석(SAFE) 대상이 아니다** — `safety_status: "unanalyzed"`로 고정. 채팅 텍스트와
  달리 블러 처리도 없다.
- 응답 `201`로 `MessageOut`이 즉시 내려오며 `description_status: "processing"`, `description: null`이다.
  동시에 상대방에게는 WS `chat.message` 이벤트가 즉시 발송되므로, 사진 자체는 바로 보이고 설명만
  나중에 채워지는 구조다.

```json
{
  "id": "message-uuid", "room_id": "room-uuid", "type": "image",
  "media_url": "...", "description": null, "description_status": "processing",
  "safety_status": "unanalyzed"
}
```

### ② 결과 확인 — `GET /api/v1/chat/rooms/{room_id}/messages` 재조회

마찬가지로 전용 폴링/알림 수단이 없다. 채팅방을 열어둔 동안 메시지 목록을 짧은 간격으로 재조회하거나,
사용자가 화면을 다시 방문했을 때 최신 `description_status`를 반영하는 방식으로 처리한다.

## 5. 쿼터·캐시 정책 (게시물·채팅 공통)

- **하루 20회 / 분당 5회**, **사용자당**, **게시물+채팅 사진 합산**으로 소비된다(사진 1장 = 1회).
- 분당 한도 초과로 실패하면 이미 차감된 일일 카운터는 자동 롤백된다 — 사용자 입장에서는 "이번 요청만
  실패"로 보이면 된다.
- **동일 이미지(바이트 해시 동일)는 캐시로 즉시 재사용**되고 쿼터를 소비하지 않는다. 같은 사진을
  여러 게시물/채팅에 재사용해도 추가 비용이 들지 않는다는 뜻이므로 별도 안내는 불필요하다.
- 재시도: 모델 호출 실패 시 최대 2회 자동 재시도(총 3회 시도) 후에도 실패하면 `failed`로 확정된다.
- 쿼터 초과나 최종 실패는 **HTTP 에러로 내려오지 않는다.** 게시/전송 응답 자체는 항상 성공(`201`)이고,
  `description_status: "failed"`로만 표시된다.

## 6. 상태값 요약

| 필드 | 값 | 의미 |
|---|---|---|
| `description_status` | `none` | 설명 대상 아님(동영상이거나, 채팅에서 사진이 아직 전송 전) |
| | `processing` | 생성 중 — 재조회로 폴링 필요 |
| | `done` | 생성 완료, `description`에 텍스트 존재 |
| | `failed` | 쿼터 초과 또는 재시도 소진 — `description: null`로 남음, 콘텐츠 자체는 정상 노출 |
| `description` | `string \| null` | 완료 시 50~150자 내외의 한국어 설명. `done` 상태에서만 값이 채워짐 |

`processing`/`failed`여도 사진 자체는 항상 정상적으로 보인다 — 설명은 접근성 보조 정보일 뿐 게시/전송을
막는 조건이 아니다.

## 7. 에러 케이스 요약

| 단계 | 상황 | 응답 | FE 처리 |
|---|---|---|---|
| 사진 업로드 | 4장 이상 | 400 | 최대 3장 안내 |
| 사진 업로드 | 10MB 초과 | 413 | 용량 안내 |
| 사진 업로드 | 지원하지 않는 형식 | 400 | jpeg/png/gif/webp만 허용 안내 |
| 게시물 게시 | 남의/이미 붙은 미디어 id | 403 / 404 | 업로드부터 재시도 |
| 채팅 전송 | 친구 아님/차단/제한 | 403 | 전송 버튼 비활성 또는 안내 문구 |
| 채팅 전송 | 미성년-성인 쌍 | 403 | 사진·동영상 전송 UI 자체를 숨김 |
| 설명 생성(공통) | 쿼터 초과 / 재시도 소진 | *(에러 아님)* `description_status: "failed"` | "설명 생성 실패" 정도로만 표시, 팝업 불필요 |

모든 명시적 에러는 `{ "detail": "<한국어 메시지>" }` 형식이며, HTTP status + 엔드포인트 조합으로
분기하는 것을 권장한다. 설명 생성 실패는 에러가 아니라 **정상 응답 안의 상태값**이라는 점에 유의한다.
