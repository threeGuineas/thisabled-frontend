# 채팅(CHAT-01/02/03) · 안전 분석(SAFE-01~05) — 프론트엔드 연동 가이드

1:1 채팅방 생성·요청함, 텍스트/사진/영상 전송, 안전 분석에 따른 블러·전송 제한을 정리한다.
`app/api/v1/chat.py`, `app/api/v1/ws.py` 라우터. 전체 API 스펙은 [api.md](api.md) 참고.

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러
`{"detail": "..."}` · 시간 UTC ISO-8601 · ID는 UUID. 모든 REST 엔드포인트는 로그인 필수
(JWT access_token 없으면 401).

**이 기능의 핵심 전제**: 채팅은 그룹 채팅이 없는 순수 1:1이며, 서버가 메시지를 텍스트일
때만 동기적으로 안전 분석(SAFE-01)한 뒤 응답한다. 사진·영상은 분석 대상이 아니라 즉시
전달되고(SAFE-02), 설명/자막만 비동기로 나중에 붙는다. FE는 "메시지 전송 API 응답을 받은
시점 = 상대에게 이미 전달된 시점"으로 취급하면 된다.

## 1. 채팅방

| 메서드·경로 | 동작 |
| --- | --- |
| `POST /chat/rooms` | 채팅방 생성 또는 기존 방 조회 |
| `GET /chat/rooms` | 내 일반 채팅(`active`) 방 목록 |
| `GET /chat/requests` | 요청함 — 내가 **받은** 요청 방만 |
| `POST /chat/requests/{room_id}/accept` | 요청 수락 → `active`로 전환 |

### ① 생성/조회 — `POST /api/v1/chat/rooms`

```json
{ "user_id": "uuid" }
```

응답(`RoomOut`):

```json
{
  "id": "uuid",
  "state": "active",
  "counterpart": { "id": "uuid", "nickname": "닉네임", "profile_image_url": null },
  "requested_by": null,
  "restricted_sender": false,
  "accepted_at": "2026-07-08T10:00:00Z",
  "created_at": "2026-07-08T10:00:00Z"
}
```

- 친구 사이면 `state: "active"`로 즉시 생성, 친구가 아니면 `state: "request"`로 생성되고
  `requested_by`에 내 id가 채워진다.
- 같은 상대와 이미 방이 있으면 새로 만들지 않고 **기존 방을 그대로 반환**한다 — FE는 상대
  프로필의 "채팅하기" 버튼에서 매번 이 API를 호출해 방 진입에 써도 된다(멱등에 가까움).
- 요청 방 상태에서 친구가 되면(다른 경로로 친구 수락 등) 이 API 호출 시점에 자동으로
  `active`로 승격된다.
- 자기 자신에게 요청: `400 {"detail": "자기 자신과는 채팅할 수 없습니다"}`.
- 상대가 없거나(탈퇴), 나-상대 어느 방향이든 차단 관계이거나, 상대가 비친구 요청을
  받지 않도록 설정(미성년은 가입 시 기본값이 거부)한 경우: **모두 동일하게**
  `404 {"detail": "요청을 보낼 수 없는 상대입니다"}` — 사유를 구분해서 보여주지 않는다
  (친구 가이드의 차단 정책과 동일한 원칙).

### ② 목록 — `GET /api/v1/chat/rooms`, `GET /api/v1/chat/requests`

둘 다 `RoomListOut`(`{ "items": RoomOut[] }`), 정렬은 `created_at desc`.

- `/chat/rooms`는 `state: "active"` 방만 반환 — 요청 상태인 방은 여기 나타나지 않는다.
- `/chat/requests`는 **내가 받은** 요청만 보여준다(내가 보낸 요청은 이 목록에 안 나옴 —
  보낸 사람은 자기가 만든 방이 이미 화면에 있으므로 별도 "보낸 요청함" API는 없음).
- 요청 방이라도 **분석이 완료된 메시지가 하나도 없으면 목록에서 아예 숨겨진다**(SAFE-01
  동기 원칙: 안전 서버가 잠시 불가해 메시지가 `pending`으로만 남아있는 극히 드문 경우).
  즉 FE가 "요청 왔는데 목록엔 안 보임" 상태를 마주쳐도 버그가 아니라 분석 대기 중일 수
  있으니, 별도 폴링 없이 다음 진입 시 자연스럽게 보이면 된다.
- `restricted_sender`는 방마다 다르게 계산된다: **내가 수신자일 때** 상대(발신자)가 나에게
  SAFE-05 전송 제한이 걸려 있으면 `true` — 이 방에서는 상대가 당분간 메시지를 못 보낸다는
  뜻이므로 "제한됨" 배지 등을 띄울 수 있다.

### ③ 요청 수락 — `POST /api/v1/chat/requests/{room_id}/accept`

바디 없음. 응답은 갱신된 `RoomOut`(`state: "active"`, `accepted_at` 채워짐).

- **수신자만** 가능. 요청 방이 아니거나 내가 보낸 요청을 내가 수락하려는 경우
  `400 {"detail": "수락할 수 없는 요청입니다"}`.
- 거절/취소 개념은 없다 — 수락하지 않고 두면 요청 상태로 남고, 대화하고 싶지 않으면 그냥
  무시하거나(추후) 차단하면 된다.

## 2. 메시지

| 메서드·경로 | 동작 |
| --- | --- |
| `POST /chat/rooms/{room_id}/messages` | 텍스트 전송 (동기 안전 분석) |
| `GET /chat/rooms/{room_id}/messages` | 메시지 목록 (커서 페이지네이션) |
| `POST /chat/messages/{message_id}/reveal` | 블러 처리된 메시지 "내용 보기" |
| `POST /chat/rooms/{room_id}/media` | 사진·영상 전송 (multipart) |

### ① 텍스트 전송 — `POST /api/v1/chat/rooms/{room_id}/messages`

```json
{ "content": "안녕하세요" }
```

응답(`MessageOut`, 201):

```json
{
  "id": "uuid",
  "room_id": "uuid",
  "sender": { "id": "uuid", "nickname": "닉네임", "profile_image_url": null },
  "mine": true,
  "type": "text",
  "content": "안녕하세요",
  "blurred": false,
  "safety_status": null,
  "media_url": null,
  "description": null,
  "description_status": "none",
  "caption": null,
  "caption_status": "none",
  "created_at": "2026-07-08T10:00:00Z"
}
```

- 서버가 **내용을 즉시 분석한 뒤 응답**하므로 FE는 낙관적 렌더링(optimistic UI) 없이 응답을
  받은 뒤 말풍선을 그려도 지연이 크지 않다. 다만 안전 서버 상태에 따라 응답이 느려질 수
  있으니 전송 버튼은 응답 전까지 비활성화 권장.
- 응답의 `safety_status`는 **항상 `null`이다** — 발신자 본인에게는 자기 메시지의 판정
  결과를 노출하지 않는다(자기 검열 유도 방지). 판정 결과는 오직 수신자가 메시지 목록을
  조회할 때만 의미가 있다(아래 ② 참고).
- 요청(비친구) 방에서 요청자가 수락 전에 두 번째 메시지를 보내려 하면
  `400 {"detail": "요청이 수락되기 전에는 메시지를 1건만 보낼 수 있습니다"}` — 요청 방에서는
  전송 버튼을, 내가 보낸 메시지가 이미 1건 있으면 "상대 수락 대기 중" 상태로 비활성화하는
  걸 권장.
- **403 두 가지 원인이 같은 메시지로 묶여 나온다**: `{"detail": "메시지를 보낼 수 없습니다"}`
  → (a) 내가 상대에게 SAFE-05 전송 제한이 걸려 있거나(§3 참고), (b) 상대가 차단했거나
  탈퇴했거나 요청 방에서 내가 수신자인 경우(수신자는 답장 대신 수락만 가능). FE에서 원인을
  구분해 보여줄 방법이 없으므로, 이 메시지가 오면 그냥 토스트로 띄우고 방을 새로고침해
  현재 상태(`restricted_sender`, 상대 탈퇴 여부)를 다시 파악하는 걸 권장.

### ② 메시지 목록 — `GET /api/v1/chat/rooms/{room_id}/messages?cursor=&limit=`

- `limit`: 1~100, 기본 30. `cursor`: 이전 응답의 `next_cursor` 그대로 전달(내부 인코딩 값,
  FE가 파싱할 필요 없음). 정렬은 `created_at desc, id desc`(최신 메시지가 먼저 옴 — 채팅
  UI에서 흔한 "최신부터 위로 페이징" 방식과 맞음).
- 커서가 잘못됐거나 만료 형식이면 `400 {"detail": "잘못된 커서입니다"}`.
- 처음 진입 시 `cursor` 없이 호출 → 최신 `limit`건 + `next_cursor`. 스크롤로 과거 메시지를
  더 불러올 때 `next_cursor`를 다시 넘긴다. `next_cursor: null`이면 더 없음.

응답(`MessageListOut`):

```json
{
  "items": [
    {
      "id": "uuid",
      "room_id": "uuid",
      "sender": { "id": "uuid", "nickname": "닉네임", "profile_image_url": null },
      "mine": false,
      "type": "text",
      "content": null,
      "blurred": true,
      "safety_status": "flagged",
      "media_url": null,
      "description": null,
      "description_status": "none",
      "caption": null,
      "caption_status": "none",
      "created_at": "2026-07-08T10:00:00Z"
    }
  ],
  "next_cursor": "MjAyNi0wNy0wOFQxMDowMDowMForMDA6MDB8dXVpZA%3D%3D"
}
```

- **`mine` 필드로 말풍선 좌/우를 바로 결정**하면 된다 — 내 user_id와 `sender.id`를 직접
  비교할 필요 없음(탈퇴 유저는 `sender.id: null`이라 비교가 애초에 불가능하기도 함).
- **블러 규칙(SAFE-03)은 오직 수신자 화면에서만 적용된다**: `mine: false`인 메시지 중
  `safety_status: "flagged"`이고 아직 "내용 보기"를 안 했으면 `blurred: true`,
  `content: null`로 내려온다 — FE는 블러 UI(흐림 처리 + "내용 보기" 버튼)를 씌우고, 탭하면
  ③ reveal API를 호출해 실제 내용을 받아온다.
- `mine: true`(내가 보낸 메시지)는 판정 결과와 무관하게 `content`가 항상 그대로 보인다.
- `safety_status`는 `mine: false`일 때만 값이 채워지고(`"safe"` / `"flagged"` /
  `"pending"` / `"unanalyzed"`), `mine: true`면 항상 `null`(위 ①과 동일한 이유).
- `"pending"`(분석 대기) 상태 메시지는 **수신자 목록에는 아예 나타나지 않는다**(서버가
  필터링) — 발신자 본인 화면에만 "전송됨" 정도로 보인다. 안전 서버가 복구되면 서버가
  일괄 재분석하며, 이때 사후에 `"flagged"`로 바뀌는 메시지는 `chat.flagged` 알림
  (`retroactive: true`)으로 뒤늦게 통지된다(§4).
- 미디어 메시지(`type: "image"|"video"`)는 `media_url`이 채워지고, `description`(사진 설명,
  VISION-01)·`caption`(영상 자막 세그먼트, CAPTION-01)은 업로드 직후엔 `null` +
  `*_status: "processing"`이며 비동기로 채워진다 — 아래 §4 "실시간 연동" 주의사항 참고
  (완료돼도 WS 알림이 오지 않는다).

### ③ 내용 보기 — `POST /api/v1/chat/messages/{message_id}/reveal`

바디 없음. 응답(`RevealOut`): `{ "id": "uuid", "content": "실제 메시지 내용" }`.

- **수신자만** 가능(발신자 본인이 호출하면 `403`). 블러 대상(`flagged`)이 아닌 메시지에
  호출하면 `400 {"detail": "블러 처리된 메시지가 아닙니다"}`.
- 한 번 보면 그 뒤로는 목록 API에서도 `blurred: false`, `content` 그대로 내려온다 — FE는
  reveal 성공 시 로컬 메시지 상태를 직접 업데이트하거나 목록을 다시 불러오면 된다.
- **"내용 보기"를 해도 SAFE-05 누적 카운트(§3)에는 계속 포함된다** — 즉 열람 여부와
  무관하게 반복 위반이면 상대는 결국 전송 제한에 걸린다. FE가 별도로 신경 쓸 부분은 없다.

### ④ 사진·영상 전송 — `POST /api/v1/chat/rooms/{room_id}/media` (multipart/form-data)

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `file` | 파일 | 이미지: jpeg/png/gif/webp, 최대 10MB. 영상: mp4/webm/quicktime, 최대 200MB |
| `duration_seconds` | 정수(폼 필드) | 영상일 때만 의미 있음, 최대 180초(3분), 기본값 0 |

응답은 텍스트와 동일한 `MessageOut`(201). `content: null`, `media_url`에 업로드된 파일
URL이 들어간다.

- **사진·영상은 안전 분석 대상이 아니다**(SAFE-02) — `safety_status: "unanalyzed"`로
  저장되고 블러 처리는 절대 되지 않는다. 대신 아래 조건으로 사전에 막는다:
  - **친구 사이의 `active` 방에서만** 가능 — 요청 방이거나 친구가 아니면
    `403 {"detail": "사진·동영상은 친구와의 채팅에서만 보낼 수 있습니다"}`.
  - **미성년-성인 조합인 채팅방은 미디어 전송 자체가 불가**(텍스트만 가능) —
    `403 {"detail": "이 채팅에서는 사진·동영상을 보낼 수 없습니다"}`.
  - 차단 관계이거나 SAFE-05 전송 제한 중이거나 상대가 탈퇴했으면 텍스트와 동일하게
    `403 {"detail": "메시지를 보낼 수 없습니다"}`.
- 파일 형식이 지원 목록에 없으면 `400 {"detail": "지원하지 않는 파일 형식입니다"}`.
- 크기 초과: 이미지 `413 {"detail": "이미지는 10MB 이하만 가능합니다"}`, 영상
  `413 {"detail": "영상은 200MB 이하만 가능합니다"}`.
- 영상 길이 초과: `400 {"detail": "영상은 최대 3분까지 보낼 수 있습니다"}`.
- **영상은 하루 업로드 횟수 제한이 있고, 이 쿼터는 게시물 영상 업로드와 합산된다** —
  초과 시 `429 {"detail": "영상 업로드는 하루 N회까지 가능합니다 (게시물·채팅 합산)"}`.
  FE는 게시물 작성 화면에서 이미 영상을 여러 번 올렸다면 채팅에서도 제한에 걸릴 수 있음을
  안내하는 게 좋다.
- 업로드 응답은 바로 오지만 `description_status`/`caption_status`는 `"processing"`으로
  시작한다 — 완료 여부를 확인하려면 §4의 주의사항을 참고.

## 3. SAFE-05 전송 제한

동일 상대에게 짧은 기간 동안 반복해서 "주의(flagged)" 판정을 받으면, 서버가 그 발신자→
수신자 방향으로 **자동 전송 제한**을 건다(3일 내 3회 누적 기준, 서버 설정값이므로 하드코딩
하지 말 것).

- 제한이 걸리면 발신자에게는 아무 알림도 가지 않는다 — 다음 메시지 전송 시도가 그냥
  `403 RESTRICTED`로 실패할 뿐이다(§2-① 참고). **수신자에게만** `chat.restricted` 알림이
  간다(§4).
- 수신자는 `RoomOut.restricted_sender: true`로 이 상태를 확인할 수 있다.
- 해제는 **수신자만** 가능: `POST /api/v1/chat/restrictions/{sender_id}/release` (바디 없음)
  → `{ "released": true }`. 해제할 제한이 없으면
  `404 {"detail": "해제할 전송 제한이 없습니다"}`.
- 해제하면 누적 카운트가 리셋된다 — "다시 대화 계속하기" 같은 버튼에 연결하면 된다.
- "내용 보기"(reveal)를 했더라도 누적 카운트에서 빠지지 않는다(§2-③) — 열람 여부와 제한
  해제는 별개 개념.

## 4. 실시간 연동 (WebSocket)

`WS /api/v1/ws?token=<access_token>` — 액세스 토큰을 쿼리 파라미터로 전달(헤더 아님).
토큰이 유효하지 않으면 연결을 수락한 뒤 바로 **close code 4401**로 끊는다 — FE는 정상
핸드셰이크 실패와 구분해 재로그인 유도.

연결되면 서버가 클라이언트로 보내는 텍스트 프레임은 모두 아래 포맷의 JSON 문자열이다.
클라이언트가 뭔가 보내도 서버는 그냥 무시한다(연결 유지 감지용이므로 보낼 필요 없음).

```json
{ "type": "chat.message", "payload": { "room_id": "uuid", "message_id": "uuid" } }
```

```json
{ "type": "notification", "payload": { "type": "chat.request", "room_id": "uuid", "sender_nickname": "닉네임" } }
```

| `type` | `payload.type` | 발생 시점 |
| --- | --- | --- |
| `chat.message` | — | 상대가 텍스트/미디어 메시지를 보냈을 때(분석이 `pending`이 아닌 경우만) |
| `notification` | `chat.request` | 비친구 상대에게 첫 메시지(요청)를 받았을 때 — `{ room_id, sender_nickname }` |
| `notification` | `chat.flagged` | 상대가 보낸 메시지가 "주의" 판정났을 때(블러 도착) — `{ room_id, message_id, retroactive? }` |
| `notification` | `chat.restricted` | 상대에게 SAFE-05 전송 제한이 걸렸을 때(수신자만) — `{ room_id, sender_id, message }` |

**중요 — `chat.message` 이벤트에는 메시지 원문이 절대 실리지 않는다.** `room_id`,
`message_id`만 오므로, 이벤트를 받으면 FE가 §2-②(메시지 목록 재조회) 또는 해당 방을 보고
있지 않다면 방 목록을 REST로 다시 불러와야 한다. 이는 의도된 설계로, WS 페이로드만으로
블러 여부(SAFE-03)를 판단할 수 없게 해 안전 규칙을 REST 응답 한곳에서만 강제하기 위함이다.

**중요 — 사진 설명(description)·영상 자막(caption) 생성이 끝나도 WS 알림이 오지 않는다.**
게시물 미디어와 달리 채팅 미디어는 완료 시 별도 push가 없으므로, `description_status`/
`caption_status`가 `"processing"`인 메시지가 있으면 FE가 짧은 간격으로 해당 방의 메시지
목록을 다시 조회하거나(폴링), 방에 재진입할 때마다 최신 상태를 반영하는 방식으로 처리해야
한다. 완료 후 상태는 `"done"`(+ 값 채워짐) 또는 `"failed"`로 고정되며 그 이후로는 바뀌지
않는다.

`chat.flagged`가 `retroactive: true`로 오는 경우: 안전 분석 서버가 일시 장애였다가
복구된 뒤 서버가 뒤늦게 재분석한 결과다(§18.3, 텍스트 메시지만 대상). 이미 화면에 평문으로
표시했던 메시지가 갑자기 블러 처리돼야 할 수 있으니, 이 알림을 받으면 해당 메시지를 다시
조회해 블러 상태를 갱신하는 걸 권장.

## 5. 필드 요약

**RoomOut**

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `id` | UUID | |
| `state` | string | `"request"` \| `"active"` |
| `counterpart` | AuthorOut | 상대방. 탈퇴 시 `id: null, nickname: "탈퇴한 사용자"` |
| `requested_by` | UUID \| null | 요청 방일 때 요청을 보낸 사람의 id |
| `restricted_sender` | boolean | 내가 수신자일 때, 상대가 나에게 전송 제한 걸려있는지(§3) |
| `accepted_at` | datetime \| null | `active`로 전환된 시각 |
| `created_at` | datetime | |

**MessageOut**

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `id` | UUID | |
| `room_id` | UUID | |
| `sender` | AuthorOut | 탈퇴 시 익명화 |
| `mine` | boolean | 말풍선 방향 결정에 사용, 비교 연산 불필요 |
| `type` | string | `"text"` \| `"image"` \| `"video"` |
| `content` | string \| null | 블러 대상이면 `null`(§2-②) |
| `blurred` | boolean | `mine: false`이고 미분석/미열람 flagged일 때만 `true` |
| `safety_status` | string \| null | `mine: true`면 항상 `null`. 값: `pending`\|`safe`\|`flagged`\|`unanalyzed` |
| `media_url` | string \| null | 이미지·영상 URL |
| `description` | string \| null | 사진 설명(VISION-01), 비동기 |
| `description_status` | string | `none`\|`processing`\|`done`\|`failed` |
| `caption` | array \| null | 영상 자막 세그먼트(CAPTION-01), 비동기 |
| `caption_status` | string | `none`\|`processing`\|`done`\|`failed` |
| `created_at` | datetime | |

**AuthorOut** — 탈퇴 유저면 `id: null`, `nickname: "탈퇴한 사용자"` (다른 가이드들과 공용).

## 6. 에러 케이스 요약

| 상황 | 응답 | FE 처리 |
| --- | --- | --- |
| 로그인 안 함 | 401 | 로그인 화면으로 |
| 자기 자신과 채팅 시도 | 400 | 본인 프로필에서 버튼 자체를 숨김 |
| 상대 없음 / 차단 관계 / 비친구 요청 거부 설정 | 404, 통일 메시지 | 사유 구분 없이 토스트만 |
| 존재하지 않거나 내가 참여자가 아닌 방 접근 | 404 | 방 목록 새로고침 |
| 요청 미수락 상태에서 요청자가 2건째 전송 | 400 | 전송 버튼을 "수락 대기 중"으로 비활성화 |
| SAFE-05 제한 / 차단 / 탈퇴 상대에게 전송 | 403, 통일 메시지 | 방 상태(`restricted_sender`) 재조회 후 안내 |
| 요청 방에서 수신자가 답장 시도 | 403, 통일 메시지 | 수신자 화면엔 "수락하기" 버튼만 노출 |
| 미친구/요청 방에서 미디어 전송 | 403 | 미디어 첨부 버튼을 친구·active 방에서만 노출 |
| 미성년-성인 방에서 미디어 전송 | 403 | 상대 나이대 조합에 따라 미디어 버튼 숨김 |
| 지원하지 않는 파일 형식 | 400 | 첨부 전 클라이언트에서 MIME 필터링 권장 |
| 이미지 10MB / 영상 200MB 초과 | 413 | 업로드 전 파일 크기 검증 |
| 영상 3분 초과 | 400 | 업로드 전 길이 검증 |
| 영상 업로드 일일 쿼터 초과(게시물과 합산) | 429 | "오늘 영상 업로드 횟수 소진" 안내 |
| 잘못된 페이지네이션 커서 | 400 | 커서 없이(첫 페이지로) 재요청 |
| 블러 아닌 메시지에 reveal 시도 | 400 | reveal 버튼을 blurred 메시지에서만 노출 |
| 발신자 본인이 reveal 시도 | 403 | reveal 버튼을 `mine: false`에서만 노출 |
| 해제할 SAFE-05 제한이 없는데 release 시도 | 404 | release 버튼을 `restricted_sender: true`일 때만 노출 |
| 이미 처리된/없는 요청 accept 시도 | 400 | 요청함 새로고침 |
| WS 토큰 무효 | close code 4401 | 재로그인 유도, 일반 네트워크 끊김과 구분 |

모든 에러는 `{ "detail": "<한국어 메시지>" }` 형식이며(422는 FastAPI 기본 validation 에러
배열 형식), `detail` 문자열이 아니라 HTTP status + 엔드포인트 조합으로 분기하는 걸 권장한다.
