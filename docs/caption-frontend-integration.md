# 동영상 자막(CAPTION-01) 프론트 연동 가이드

> 정본은 FastAPI OpenAPI(`/docs`, `/api/v1/openapi.json`)이다. 이 문서는 프론트에서 자막 기능을 붙일 때 필요한 정보만 모은 요약.
> 관련 요약: `docs/api.md` (media / posts / chat 섹션) · 기준 명세: `docs/ThisAbled_기능명세서_v2_2.md`

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러 `{"detail": "..."}` · ID는 UUID.

## 0. 요약

- 서버는 영상 업로드 시 OpenAI Whisper로 **자막 세그먼트(JSON)** 를 자동 생성한다. `.srt`/`.vtt` 같은 표준 자막 파일은 만들지 않는다 — **VTT/SRT 변환이 필요하면 프론트에서 세그먼트 JSON을 직접 변환**해야 한다 (§6 예시 참고).
- 자막은 두 경로에서 발생한다: **① 게시물(피드) 영상**, **② 채팅 영상**. 두 경로의 상태 확인 방법이 다르므로 주의(§4).
- 자막 생성은 시간이 걸리므로(수 초~수십 초) UI는 반드시 "자막 만드는 중" 상태를 노출해야 한다.

## 1. 데이터 모델

### caption 세그먼트 포맷

`caption` 필드는 `null` 이거나 아래 배열이다.

```json
[
  { "start": 0.0, "end": 2.4, "text": "안녕하세요" },
  { "start": 2.4, "end": 5.1, "text": "오늘 소개할 내용은..." }
]
```

- `start`, `end`: 초 단위 float (Whisper `verbose_json` 세그먼트 그대로)
- `text`: 좌우 공백 제거된 한국어 전사 텍스트
- 생성 실패 시 `caption = null`

### caption_status (AiStatus enum)

`PostMedia.caption_status` / `ChatMessage.caption_status` 공용값:

| 값 | 의미 |
| --- | --- |
| `none` | 자막 대상 아님(사진 등) — 채팅 이미지 메시지는 항상 `none` |
| `processing` | 생성 중 — 로딩 UI 표시 |
| `done` | 생성 완료 — `caption` 배열 사용 가능 |
| `failed` | 재시도(`AI_RETRY_MAX`=2회) 소진 후 실패 |

## 2. 시나리오 A — 게시물(피드) 영상 업로드

```
① POST /media/videos          → post_id, media_id, caption_status:"processing"
② (백그라운드) 서버가 Whisper 호출, PostMedia.caption/caption_status 갱신
③ FE는 아래 둘 중 하나로 완료를 감지
   - WS 알림 media.caption_done / media.caption_failed 수신
   - GET /posts/{post_id}/caption-status 폴링
④ POST /posts/{post_id}/publish 로 실제 게시(공개) 실행
```

영상 업로드는 **내부 processing 드래프트 게시물**을 만든다. 사용자가 명시적으로 "게시" 버튼을 눌러야 피드에 노출된다(§20-4 — 자동 공개 금지).

### ① `POST /media/videos`

`multipart/form-data`:

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `file` | 파일 | `video/mp4`, `video/webm`, `video/quicktime` 만 허용 |
| `duration_seconds` | int | **FE가 측정해 신고**(서버 ffprobe 없음). 3분(180초) 초과 시 400 |

응답 `201`:

```json
{ "post_id": "uuid", "media_id": "uuid", "caption_status": "processing" }
```

에러:

| 상태 | 상황 |
| --- | --- |
| 400 | `duration_seconds` > 180초, 지원하지 않는 영상 형식 |
| 413 | 파일 크기 > 200MB |
| 429 | 일일 자막 쿼터(5회, 게시물·채팅 합산) 초과 — `detail`에 안내 문구 |

### ② 상태 확인 — `GET /posts/{post_id}/caption-status`

작성자 본인만 호출 가능(다른 사용자 404). 폴링 시 2~3초 간격 권장.

```json
{ "caption_status": "processing" }
```

### ③ 실시간 알림(WS) — 폴링 대신/함께 사용 가능

`WS /api/v1/ws?token=<access_token>` 연결 후 아래 이벤트 수신:

```json
{
  "type": "notification",
  "payload": {
    "type": "media.caption_done",
    "post_id": "uuid",
    "media_id": "uuid"
  }
}
```

실패 시 `type: "media.caption_failed"`. (연결 방법은 §5 참고)

### ④ 게시 실행 — `POST /posts/{post_id}/publish`

```json
{ "allow_no_caption": false }
```

| 상태 | 상황 | FE 처리 |
| --- | --- | --- |
| 200 | 게시 성공 (`PostOut` 반환) | 피드로 이동 |
| 409 | `caption_status == "processing"` | "자막 만드는 중입니다" 안내 후 재시도 유도 |
| 400 | `caption_status == "failed"` 이고 `allow_no_caption` 미지정 | "다시 시도" 또는 **"자막 없이 게시"** 버튼 제공 → 후자는 `allow_no_caption:true` 로 재요청 |
| 400 | 이미 게시됨 | — |

### 게시물 조회 시 자막 필드

`GET /feed`, `GET /posts/{id}` 응답의 `media[]` 항목:

```json
{
  "id": "uuid",
  "media_type": "video",
  "url": "https://...",
  "caption": [{ "start": 0.0, "end": 2.4, "text": "..." }],
  "caption_status": "done"
}
```

## 3. 시나리오 B — 채팅 영상 전송

```
① POST /chat/rooms/{room_id}/media   → MessageOut(caption_status:"processing", 즉시 전달됨)
② (백그라운드) 서버가 자막 생성, ChatMessage.caption/caption_status 갱신
③ FE는 GET /chat/rooms/{room_id}/messages 재조회(폴링)로 갱신 확인  ※ 아래 주의 참고
```

### ⚠️ 주의: 채팅 자막은 완료 알림(WS)이 없다

게시물 경로(§2)와 달리, 채팅 영상 자막 생성 완료 시 **WS `notification` 이벤트도, `chat.message` 재전송도 발생하지 않는다** (서버 코드 `caption_chat_message_job`에 알림 호출 없음). 영상 메시지는 자막 생성 여부와 무관하게 **전송 즉시 상대에게 전달**되므로(SAFE-02, 안전 분석 대상 아님), 자막은 "나중에 조용히 채워지는" 부가 정보로 취급된다.

프론트에서 자막을 보여주려면:
- 영상 메시지가 `caption_status: "processing"` 이면, 짧은 간격으로 `GET /chat/rooms/{room_id}/messages`를 재조회하거나
- 사용자가 해당 메시지를 다시 열람/재생하는 시점에 최신 상태를 조회

### `POST /chat/rooms/{room_id}/media`

`multipart/form-data`: `file`(이미지 또는 영상), `duration_seconds`(영상일 때만, ≤180초).

- 친구 관계인 `active` 방에서만 가능(403), 미성년-성인 조합은 미디어 전송 자체가 403.
- 영상이면 업로드 시점에 일일 자막 쿼터 1회 차감(429 초과 시).

응답 `201` (`MessageOut`):

```json
{
  "id": "uuid",
  "room_id": "uuid",
  "type": "video",
  "media_url": "https://...",
  "caption": null,
  "caption_status": "processing",
  "...": "..."
}
```

## 4. 두 시나리오 비교 요약

| 항목 | 게시물(피드) 영상 | 채팅 영상 |
| --- | --- | --- |
| 업로드 API | `POST /media/videos` | `POST /chat/rooms/{room_id}/media` |
| 전달 시점 | 게시(publish) 버튼을 눌러야 공개 | 업로드 즉시 상대에게 전달 |
| 상태 폴링 API | `GET /posts/{post_id}/caption-status` | 없음 → `GET /chat/rooms/{room_id}/messages` 재조회 |
| 완료 WS 알림 | O (`media.caption_done`/`media.caption_failed`) | X |
| 자막 실패 시 | "자막 없이 게시" 선택 가능 (`allow_no_caption`) | 별도 UX 없음 — `caption_status:"failed"`면 자막 없이 그대로 재생 |

## 5. WS 연결

```
WS /api/v1/ws?token=<access_token>
```

- 인증은 access 토큰 검증만(JWT), 만료/무효 시 accept 후 코드 `4401`로 close.
- 수신 메시지는 텍스트(JSON 문자열), 아래 두 타입이 자막과 관련:

```json
{ "type": "notification", "payload": { "type": "media.caption_done", "post_id": "...", "media_id": "..." } }
{ "type": "notification", "payload": { "type": "media.caption_failed", "post_id": "...", "media_id": "..." } }
```

연결이 끊기면 재연결 후 놓친 상태는 폴링(§2-②)으로 보정 권장(WS는 at-most-once, 재전송 없음).

## 6. 세그먼트 → WebVTT 변환 (프론트 구현 예시)

서버가 표준 자막 파일을 만들지 않으므로, `<video>`의 `<track kind="subtitles">`에 붙이려면 클라이언트에서 VTT 문자열을 생성해 Blob URL로 넘겨야 한다.

```ts
function segmentsToVtt(segments: { start: number; end: number; text: string }[]): string {
  const fmt = (t: number) => {
    const h = Math.floor(t / 3600).toString().padStart(2, "0");
    const m = Math.floor((t % 3600) / 60).toString().padStart(2, "0");
    const s = (t % 60).toFixed(3).padStart(6, "0");
    return `${h}:${m}:${s}`;
  };
  const body = segments
    .map((seg) => `${fmt(seg.start)} --> ${fmt(seg.end)}\n${seg.text}`)
    .join("\n\n");
  return `WEBVTT\n\n${body}\n`;
}

// 사용 예
const vttUrl = URL.createObjectURL(
  new Blob([segmentsToVtt(media.caption)], { type: "text/vtt" })
);
// <track kind="subtitles" srclang="ko" src={vttUrl} default />
```

`caption === null` 이거나 `caption_status !== "done"` 이면 `<track>`을 생략(또는 "자막 없음" 표시).

## 7. 제약사항 / 쿼터

| 항목 | 값 |
| --- | --- |
| 영상 최대 길이 | 180초(3분) — FE 신고 기반, 서버 실검증 없음 |
| 영상 최대 용량 | 200MB — 서버 실검증(초과 시 413) |
| 허용 포맷 | `video/mp4`, `video/webm`, `video/quicktime` |
| 자막 생성 일일 한도 | 5회/일 (게시물+채팅 합산, 사용자 단위) — 초과 시 업로드 자체가 429 |
| 자막 재시도 | 서버 내부 최대 2회, 모두 실패하면 쿼터 자동 환불 + `caption_status:"failed"` |
| 캐싱 | 동일 파일 해시(media_hash)면 캐시된 자막 재사용(재호출 없이 즉시 `done`) |
| 게시물 드래프트 만료 | 24시간 내 미게시 시 자동 삭제 (별도 배치, 프론트 확인 불가 — 업로드 후 오래 방치하지 않도록 안내 권장) |

## 8. 알려진 한계 (백엔드 기준 미구현)

- SRT/WebVTT 등 표준 자막 파일의 서버 측 생성·다운로드 엔드포인트 없음 → §6처럼 클라이언트 변환 필요.
- 채팅 영상 자막 완료를 알리는 WS 이벤트 없음(§3 참고) → 폴링 UX 설계 필요.
- 자막 텍스트 수정/편집 API 없음(생성된 그대로 노출).
