# 알림(Notifications) — 프론트엔드 연동 가이드

## 개요

- Base path: `/api/v1`
- 인증: `Authorization: Bearer <access_token>` 필수 (REST), WS는 `?token=<access_token>` 쿼리 파라미터로 인증
- 관련 엔드포인트:
  - `GET /api/v1/notifications` — 알림 목록 조회
  - `POST /api/v1/notifications/read` — 읽음 처리
  - `WS /api/v1/ws` — 실시간 알림/채팅 이벤트 수신
- 기능명세서 §16(알림)에는 API 스펙(필드명, type 목록, payload 구조)이 명시되어 있지 않다. 이 문서는 실제 백엔드 코드(`app/api/v1/notifications.py`, `app/services/notify.py`, `app/services/events.py`) 기준으로 작성됨.
- **청각 모드 관련**: 백엔드에는 청각(hearing) 모드 전용 알림 필드나 분기 로직이 없다. `payload`는 모든 모드에서 동일하게 내려가며, "시각·음성·진동" 표현은 전적으로 프론트 책임이다(§13 HEAR-03).

---

## 1. 알림 목록 조회 — `GET /api/v1/notifications`

**쿼리 파라미터**

| 파라미터 | 타입 | 기본값 | 비고 |
|---|---|---|---|
| `limit` | int | 50 | 1~100 |

- **`cursor` 파라미터는 존재하지 않는다.** 커서 기반 페이지네이션이 백엔드에 구현되어 있지 않다. `?cursor=xxx`를 보내도 에러 없이 무시될 뿐 아무 효과가 없다.
- 정렬은 `created_at desc` 고정(최신순)이며, 매 요청마다 상위 `limit`개만 반환한다. **"다음 페이지" 조회 자체가 불가능** — 현재는 최신 최대 100건까지만 조회 가능. cursor 페이지네이션이 필요하면 백엔드 API 확장이 선행되어야 한다.

**Response 200**
```json
{
  "items": [
    {
      "id": "uuid",
      "type": "friend.request",
      "payload": { "request_id": "uuid", "sender_nickname": "홍길동" },
      "read_at": null,
      "created_at": "2026-08-14T09:00:00Z"
    }
  ]
}
```

- 목록 배열 필드명은 `items`.
- `next_cursor` / `has_more` 같은 페이지네이션 필드는 응답에 없다.
- **`is_read`(boolean)가 아니라 `read_at`(nullable datetime)이다.** `read_at`이 `null`이면 안 읽음, 값이 있으면 읽은 시각. `is_read: boolean`으로 파싱하도록 구현했다면 타입 불일치로 크래시가 날 수 있다.
- `payload`는 자유 형식 dict — `type`마다 필드 구성이 다르다 (2절 참고). 옵셔널 체이닝 없이 특정 키가 항상 있다고 가정하면 타입에 따라 크래시가 날 수 있다.
- `type`은 DB에도 enum 제약이 없는 자유 문자열(`String(30)`)이라, 프론트가 모르는 새 값이 와도 서버가 막지 않는다. **switch/분기문에 `default` 케이스를 반드시 둘 것.**

## 2. 읽음 처리 — `POST /api/v1/notifications/read`

**Request**
```json
{ "ids": ["uuid", "uuid", "..."] }
```

**Response 200**
```json
{ "read": true }
```

- id 배열 일괄 처리 방식이며, 단건 처리 전용 API는 없다.
- 본인 소유 + 아직 안 읽은 알림만 업데이트된다.

---

## 3. `type` 값 전체 목록과 `payload` 구조

`type`은 enum이 아니라 문자열 상수(`app/services/notify.py`)로 정의되어 있다.

| `type` | 발생 시점 | `payload` |
|---|---|---|
| `friend.request` | 친구 요청 전송 시 (수신자에게) | `{ request_id, sender_nickname }` |
| `friend.accepted` | 친구 요청 수락 시 (요청자에게) | `{ request_id, receiver_nickname }` |
| `post.like` | 게시물 좋아요 시 (작성자에게, 본인 제외) | `{ post_id, by_nickname }` |
| `post.comment` | 게시물 댓글 작성 시 (작성자에게, 본인 제외) | `{ post_id, comment_id, by_nickname }` |
| `post.published` | 게시물 발행 완료 시 (본인에게) | `{ post_id }` |
| `chat.request` | 채팅방이 request 상태에서 첫 메시지 발송 시 (상대방에게) | `{ room_id, sender_nickname }` |
| `chat.flagged` | 메시지가 위험 판정될 때 (수신자에게) | `{ room_id, message_id }` — 소급 재분석으로 뒤늦게 판정된 경우 `retroactive: true` 추가 |
| `chat.restricted` | 관계 단위 전송 제한 발동 시 (SAFE-05-5, 수신자에게만. 발신자에겐 알림 없음) | `{ room_id, sender_id, message: "위험 가능성이 있는 메시지가 반복되어 전송을 제한했어요" }` |
| `media.caption_done` | 영상 자막 생성 완료 시 | `{ post_id, media_id }` |
| `media.caption_failed` | 영상 자막 생성 실패 시 | `{ post_id, media_id }` |
| `media.description_done` | (코드상 상수만 정의, **실사용 없음**) | 사진 설명(VISION) 완료/실패 알림 로직이 아직 `notify()`에 연결되어 있지 않아 실전에서 이 타입은 오지 않는다. 분기에 넣어둬도 무방하나 당장은 대비만 |
| `media.description_failed` | 〃 | 〃 |

댓글/좋아요/게시 알림은 "본인 행동에는 알림 없음" 원칙을 지킨다. 채팅 제한 알림도 발신자에게는 어떤 판정 알림도 가지 않는다.

---

## 4. WS `/api/v1/ws` — 실시간 이벤트

- 연결: `WS /api/v1/ws?token=<access_token>` — 인증 실패 시 close code `4401`.
- 서버는 Redis pub/sub으로 들어온 이벤트를 그대로 relay한다 (서버가 프레임을 가공하지 않음).

**최상위 프레임 타입은 3가지뿐이다.** 최상위 `type`으로 먼저 분기할 것.

| 최상위 `type` | 의미 | 구조 |
|---|---|---|
| `notification` | 새 알림 발생 | `{ "type": "notification", "payload": { "type": <알림 type>, ...나머지 payload 필드 } }` |
| `chat.message` | 새 채팅 메시지 도착 신호 (원문 미포함) | `{ "type": "chat.message", "payload": { "room_id", "message_id" } }` |
| `chat.read` | 상대방이 메시지를 읽음 (읽음 커서 갱신) | `{ "type": "chat.read", "payload": { "room_id", "message_id" } }` |

### `notification` 프레임 예시

```json
{
  "type": "notification",
  "payload": {
    "type": "friend.request",
    "request_id": "uuid",
    "sender_nickname": "홍길동"
  }
}
```

- **`payload` 안에 다시 `type`이 중첩된다.** 이 안쪽 `type` 값이 REST의 `type`과 동일하고, 나머지 키가 REST의 `payload`와 동일하다.
- **WS 프레임에는 REST 응답의 `id`, `read_at`, `created_at`이 포함되지 않는다.** WS는 "새 알림이 왔다"는 실시간 트리거 신호일 뿐이며, 목록/상세는 여전히 `GET /api/v1/notifications`로 조회해야 한다.
- 채팅 메시지 원문도 WS에 실리지 않는다 — `chat.message` 수신 시 REST로 재조회하는 구조(SAFE-03 블러 규칙과 동일한 원칙).

### 처리 순서 권장

1. 최상위 `type`으로 1차 분기 (`notification` / `chat.message` / `chat.read`)
2. `notification`이면 `payload.type`으로 2차 분기해 알림 종류 판단
3. 두 단계 모두 `default`/알 수 없는 값에 대한 fallback을 둘 것 — 서버가 타입을 화이트리스트로 검증하지 않으므로 예상 밖의 값이 올 수 있다.

---

## 5. 청각(hearing) 모드 관련

- 백엔드에는 청각 모드 전용 알림 필드나 로직이 **없다.** `notify()` 서비스는 "DB 저장 + WS 푸시"만 담당하고, 시각·음성·진동 등 감각별 표현은 전적으로 프론트 책임으로 위임되어 있다(`app/services/notify.py` 모듈 주석).
- `NotificationOut`/WS `payload`에는 `sound`, `vibrate`, `visual_only` 같은 모드별 필드가 전혀 없다. 사용자의 `ui_mode`가 `hearing`이어도 응답 내용은 다른 모드와 동일하다.
- 따라서 특정 모드에서만 알림 화면이 크래시한다면, 백엔드의 모드별 분기 문제가 아니라 **위 2, 3절의 필드명/타입 불일치(`read_at` vs `is_read`, `post.like`/`post.comment` 등)를 그 화면에서 먼저 만났을 가능성이 크다.** 다른 모드에서도 같은 응답 파싱 코드를 타면 동일하게 재현되어야 정상이므로, 모드별로 별도 파싱 로직이 있다면 그쪽부터 필드명을 대조해볼 것.

---

## 요약 체크리스트 (프론트 구현 시)

- [ ] `cursor` 파라미터 사용하지 않기 — 미구현. 페이지네이션 필요하면 백엔드에 별도 요청
- [ ] 배열 필드는 `items`
- [ ] 읽음 여부는 `is_read`가 아니라 `read_at`(nullable datetime)로 판단
- [ ] `type` 값은 `post.like`/`post.comment` (`post.liked`/`post.commented` 아님)
- [ ] `type`은 자유 문자열 — 분기문에 `default`/fallback 케이스 필수
- [ ] `payload`는 타입마다 필드가 다름 — 옵셔널 체이닝으로 접근
- [ ] `media.description_done`/`media.description_failed`는 현재 실사용 없음 (대비만)
- [ ] WS 프레임은 최상위 `type` → (notification이면) `payload.type` 순으로 2단계 분기
- [ ] WS `notification` 프레임에는 `id`/`read_at`/`created_at` 없음 — 상세는 REST로 재조회
- [ ] 청각 모드 알림 UI가 별도 파싱 로직을 쓰고 있다면 필드명부터 대조

## 관련 파일 목록 (백엔드)

- `app/api/v1/notifications.py` — `GET /notifications`, `POST /notifications/read` 컨트롤러, `NotificationOut`/`NotificationListOut`/`ReadIn` 스키마
- `app/services/notify.py` — `type` 상수 전체, `notify()` 생성 함수 (DB 저장 + WS 푸시)
- `app/models/misc.py` — `Notification` ORM 모델 (`read_at`, `payload` 등 컬럼 정의)
- `app/services/events.py` — WS 이벤트 포맷(`user_channel()`, `publish_to_user()`)
- `app/api/v1/ws.py` — WS 엔드포인트, 인증(`4401`), relay 로직
- `app/api/v1/friends.py`, `app/api/v1/posts.py`, `app/api/v1/chat.py`, `app/services/chat.py`, `app/services/ai_media.py` — 각 알림 타입의 실제 생성(insert) 지점
- `docs/ThisAbled_기능명세서_v2_2.md` §16(알림), §13 HEAR-03(청각 모드 알림 요구사항)
- `tests/test_notifications.py`, `tests/test_ws.py` — 실제 응답/이벤트 구조 검증용 테스트
