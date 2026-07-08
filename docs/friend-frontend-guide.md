# 친구(FRIEND-01/02) · 차단(BLOCK-01) — 프론트엔드 연동 가이드

친구 요청/수락/거절/취소, 친구 목록/해제와 이에 직결되는 차단 기능을 정리한다.
`app/api/v1/friends.py`, `app/api/v1/blocks.py` 라우터. 전체 API 스펙은 [api.md](api.md) 참고.

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러
`{"detail": "..."}` · 시간 UTC ISO-8601 · ID는 UUID. 모든 엔드포인트는 로그인 필수(JWT
access_token 없으면 401).

## 1. 친구 요청

| 메서드·경로 | 동작 |
| --- | --- |
| `POST /friends/requests` | 친구 요청 보내기 → 201 |
| `GET /friends/requests?box=received\|sent` | 받은/보낸 요청 목록 (기본값 `received`) |
| `POST /friends/requests/{id}/accept` | 수락 (수신자만) → 양방향 친구 성립 |
| `POST /friends/requests/{id}/decline` | 거절 (수신자만) |
| `POST /friends/requests/{id}/cancel` | 취소 (요청자만) |

### ① 보내기 — `POST /api/v1/friends/requests`

```json
{ "receiver_id": "uuid" }
```

응답(`FriendRequestOut`, 201):

```json
{
  "id": "uuid",
  "sender": { "id": "uuid", "nickname": "닉네임", "profile_image_url": null },
  "receiver": { "id": "uuid", "nickname": "닉네임", "profile_image_url": null },
  "status": "pending",
  "created_at": "2026-07-08T10:00:00Z",
  "responded_at": null
}
```

에러 케이스 (모두 body는 다르지만 **"차단"이라는 이유는 절대 노출하지 않는다** — 존재하지
않는 사용자와 차단된 사용자를 FE에서 구분할 수 없게 동일 메시지로 통일):

| 상황 | 응답 |
| --- | --- |
| 자기 자신에게 요청 | `400 {"detail": "자기 자신에게는 요청할 수 없습니다"}` |
| 상대가 없거나(탈퇴 등) 나-상대 어느 방향이든 차단 관계 | `404 {"detail": "요청을 보낼 수 없는 상대입니다"}` |
| 이미 친구 | `400 {"detail": "이미 친구입니다"}` |
| 이미 처리 중(pending)인 요청이 양방향으로 존재 | `400 {"detail": "처리 중인 친구 요청이 있습니다"}` |

→ FE는 위 메시지들을 그대로 토스트로 띄우면 되고, 404/차단 사유를 별도로 안내하는 UI를
만들 필요는 없다(서버가 의도적으로 숨김).

### ② 목록 — `GET /api/v1/friends/requests?box=received|sent`

`box` 생략 시 `received`. 응답은 **pending 상태만** 내려온다(수락/거절/취소된 요청은 이
목록에서 사라짐 — 이력 화면이 따로 필요하면 별도 API가 없으므로 만들 수 없음, 필요하면
서버에 문의).

```json
{ "items": [ /* FriendRequestOut[] */ ] }
```

정렬은 `created_at desc`(최신 요청이 먼저).

### ③ 수락/거절/취소

```
POST /api/v1/friends/requests/{request_id}/accept
POST /api/v1/friends/requests/{request_id}/decline
POST /api/v1/friends/requests/{request_id}/cancel
```

- 셋 다 대상 요청이 `pending`이 아니면(이미 처리됨/없음) `404 {"detail": "처리할 수 없는 요청입니다"}`.
- `accept`/`decline`은 **수신자만**, `cancel`은 **요청자만** 가능 — 아니면
  `403 {"detail": "수신자만 수락할 수 있습니다"}` 등 역할별 메시지.
- 응답은 셋 다 갱신된 `FriendRequestOut` 한 건 (status: `accepted`/`declined`/`cancelled`).
- `accept` 성공 시 그 자리에서 양방향 친구 관계가 즉시 생성된다 — FE는 수락 직후 친구
  목록을 다시 불러오거나, 옵티미스틱하게 로컬 친구 목록에 추가해도 된다.
- `decline` 시 `responded_at`이 채워진다. 이 값은 추천 로직에서 30일간 재추천 제외에
  쓰이므로(MATCH-03) FE가 신경 쓸 부분은 없지만, "거절 후 30일간 다시 추천되지 않음" 같은
  안내 문구를 넣고 싶다면 참고.

## 2. 친구 목록 / 해제

```
GET    /api/v1/friends
DELETE /api/v1/friends/{user_id}   → 204
```

- `GET /friends` 응답: `{ "items": [AuthorOut, ...] }` — 정렬 순서 보장 없음(생성 순 아님).
- `DELETE /friends/{user_id}`는 친구가 아니어도 에러 없이 204를 반환한다(멱등) — 별도 확인
  없이 "친구 끊기" 버튼에서 바로 호출해도 안전하지만, 되돌릴 수 없는 동작이므로 확인 팝업은
  FE에서 넣는 걸 권장.
- 언팔로우 개념이 아니라 **상호** 관계 삭제 — 내가 끊으면 상대 쪽 친구 목록에서도 즉시 사라짐
  (재요청하려면 친구 요청부터 다시).

## 3. 차단과의 관계 (BLOCK-01)

친구 기능은 차단과 강하게 연동되어 있어 FE에서 꼭 알아야 한다.

```
POST   /api/v1/blocks            { "user_id": "uuid" } → 201 { "blocked": true }
DELETE /api/v1/blocks/{user_id}  → 204
GET    /api/v1/blocks             → { "items": AuthorOut[] }
```

- 차단하면 **그 즉시**: ① 기존 친구 관계 해제, ② 양방향 pending 친구 요청 삭제(이력도
  안 남음 — 거절과 달리 흔적 없이 사라짐), ③ 이후 서로 친구 요청 불가(위 §1 통일 404).
  프로필 조회(`GET /users/{id}`)도 양쪽 다 `404`로 막힌다.
- 차단 해제(`DELETE /blocks/{user_id}`)는 친구 관계를 복원하지 않는다 — 다시 친구가
  되려면 요청을 새로 보내야 한다.
- 차단은 **일방향 리스트**(`GET /blocks`는 내가 차단한 사람만 보여줌)이지만, 친구 요청
  차단 판정은 **양방향**(상대가 나를 차단했어도 내가 요청 보내면 동일하게 404) — 즉 FE는
  "내가 차단 목록에 없다"는 이유만으로 요청 버튼을 활성화하면 안 되고, 항상 서버 응답(404)에
  따라 처리해야 한다. 프로필 진입 자체가 404로 막히므로 실제로는 요청 버튼까지 도달할 일이
  거의 없다.
- 자기 자신 차단 시도는 `400 {"detail": "자기 자신은 차단할 수 없습니다"}`.
- 이미 차단된 상대를 다시 `POST /blocks`해도 에러 없이 201(멱등).

## 4. 알림 연동 (§16)

친구 요청/수락 시 알림이 발생한다. 알림 목록/실시간 푸시는 `GET /notifications`,
`WS /api/v1/ws?token=`에서 공통으로 다루므로 여기서는 친구 관련 `type`/`payload`만 정리.

| `type` | 발생 시점 | `payload` |
| --- | --- | --- |
| `friend.request` | 친구 요청을 받았을 때 | `{ "request_id": "uuid", "sender_nickname": "닉네임" }` |
| `friend.accepted` | 내가 보낸 요청이 수락됐을 때 | `{ "request_id": "uuid", "receiver_nickname": "닉네임" }` |

- `decline`/`cancel`에는 알림이 없다 — 거절/취소당한 쪽은 알림으로 알 수 없고, FE가
  보낸/받은 요청 목록을 다시 조회했을 때 사라진 것으로만 확인 가능.
- WS로 오는 실시간 이벤트 포맷: `{ "type": "notification", "payload": { "type": "friend.request", ...위 payload } }`.
- `request_id`로 어떤 요청인지 특정할 수 있으므로, 알림 클릭 시 받은 요청함으로 이동해
  해당 항목을 하이라이트하는 데 사용 가능.

## 5. 필드 요약

**FriendRequestOut**

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `id` | UUID | |
| `sender` | AuthorOut | |
| `receiver` | AuthorOut | |
| `status` | string | `pending` \| `accepted` \| `declined` \| `cancelled` |
| `created_at` | datetime | |
| `responded_at` | datetime \| null | accept/decline/cancel 시에만 채워짐 |

**AuthorOut** — 탈퇴 유저면 `id: null`, `nickname: "탈퇴한 사용자"` (댓글/좋아요 가이드와 공용).

## 6. 에러 케이스 요약

| 상황 | 응답 | FE 처리 |
| --- | --- | --- |
| 로그인 안 함 | 401 | 로그인 화면으로 |
| 자기 자신에게 요청/차단 | 400 | 버튼 자체를 본인 프로필에서 숨김 |
| 상대 없음 또는 차단 관계(양방향) | 404, 통일 메시지 | 요청 실패 토스트만, 사유는 구분해서 보여주지 않음 |
| 이미 친구인 상대에게 요청 | 400 | "이미 친구" 안내 |
| pending 요청 중복 | 400 | "처리 중인 요청" 안내, 요청 버튼 비활성 |
| 이미 처리된/없는 요청에 accept·decline·cancel | 404 | 목록 새로고침(이미 사라졌을 가능성) |
| 권한 없는 사용자가 accept·decline·cancel 시도 | 403 | 역할별 버튼 노출 제어(수신자만 수락/거절 버튼, 요청자만 취소 버튼) |
| 친구 아닌 상대 unfriend | 204(정상) | 에러 아님 |
| 이미 차단된 상대 재차단 | 201(정상) | 에러 아님 |

모든 에러는 `{ "detail": "<한국어 메시지>" }` 형식이며(422는 FastAPI 기본 validation 에러
배열 형식), `detail` 문자열이 아니라 HTTP status + 엔드포인트 조합으로 분기하는 걸 권장한다.
