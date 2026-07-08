# 댓글 · 좋아요(하트) — 프론트엔드 연동 가이드

게시물의 댓글 조회/등록/수정/삭제(POST-03)와 좋아요(하트) 토글을 정리한다. 둘 다
`app/api/v1/posts.py`의 posts 라우터 안에 있으며, 전체 API 스펙은 [api.md](api.md) 참고.

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러
`{"detail": "..."}` · 시간 UTC ISO-8601 · ID는 UUID. 모든 엔드포인트는 로그인 필수(JWT
access_token 없으면 401).

## 1. 좋아요(하트)

**토글 API가 아니라 `POST`(추가)/`DELETE`(제거) 두 엔드포인트다.** 둘 다 멱등(idempotent) —
이미 좋아요한 상태에서 또 `POST`해도 에러 없이 200이 오고, 좋아요 안 한 상태에서 `DELETE`해도
에러 없이 200이 온다. FE는 현재 `liked_by_me` 상태를 보고 눌렀을 때 `POST`/`DELETE` 중 하나만
호출하면 되고, 중복 클릭 방지를 위한 별도 디바운스 로직은 없어도 안전하다.

댓글 좋아요는 없다 — 좋아요는 게시물 단위에만 존재한다.

```
POST   /api/v1/posts/{post_id}/like
DELETE /api/v1/posts/{post_id}/like

← 200
{
  "post_id": "uuid",
  "liked": true,        // POST면 true, DELETE면 false
  "like_count": 12       // 호출 후 해당 게시물의 총 좋아요 수
}
```

- 요청 body 없음, path param `post_id`만 필요.
- 존재하지 않거나 차단 관계에 있는 사용자의 게시물이면 `404 {"detail": "게시물을 찾을 수 없습니다"}`
  (상대가 나를 차단했는지 내가 차단했는지는 구분해 알려주지 않음).
- 좋아요 시 게시물 작성자에게 알림이 간다(자기 글에 자기가 좋아요를 눌러도 알림은 안 감).
- `GET /feed`, `GET /posts/{id}` 응답(`PostOut`)에도 이미 `like_count`, `liked_by_me`가 포함돼
  있으므로, 목록/상세 화면에서는 이 필드로 하트 상태와 개수를 그리고, 버튼을 누를 때만 위 두
  엔드포인트를 호출하면 된다 — 좋아요 여부만 따로 조회하는 API는 없다.

## 2. 댓글

**대댓글(답글) 기능은 없다.** `Comment`에 부모 댓글을 가리키는 필드가 없고, 목록도 작성 시각순
단일 리스트로만 내려온다. 화면 설계 시 답글 트리 UI를 고려할 필요 없음.

| 메서드·경로 | 동작 |
| --- | --- |
| `GET /posts/{post_id}/comments` | 댓글 목록 (작성 시각 오름차순, 페이지네이션 없음 — 전체를 한 번에 반환) |
| `POST /posts/{post_id}/comments` | 댓글 등록 → 201 |
| `PATCH /comments/{comment_id}` | 댓글 수정 (본인만) |
| `DELETE /comments/{comment_id}` | 댓글 삭제 (본인만) → 204 |

### ① 목록 조회 — `GET /api/v1/posts/{post_id}/comments`

```json
{
  "items": [
    {
      "id": "uuid",
      "post_id": "uuid",
      "author": { "id": "uuid", "nickname": "닉네임", "profile_image_url": null },
      "content": "댓글 내용",
      "created_at": "2026-07-08T10:00:00Z",
      "updated_at": null
    }
  ]
}
```

- 게시물이 없거나 차단 관계면 `404 {"detail": "게시물을 찾을 수 없습니다"}`.
- 커서/limit 파라미터 없음 — 댓글이 아주 많은 게시물이라도 한 번에 전부 내려온다(현재 페이지네이션
  미구현이므로 FE에서 자체적으로 스크롤 잘라 보여줘도 서버 호출은 한 번뿐).

### ② 등록 — `POST /api/v1/posts/{post_id}/comments`

```json
{ "content": "댓글 내용" }
```

- `content`: 필수, 빈 문자열 불가(`min_length=1`). 최대 길이 제한은 없음.
- 응답(`201`)은 목록의 아이템과 동일한 `CommentOut` 한 건.
- 등록 성공 시 게시물 작성자에게 알림이 간다(본인 글에 본인이 단 댓글은 알림 제외).
- 게시물이 없거나 차단 관계면 `404`.

### ③ 수정 — `PATCH /api/v1/comments/{comment_id}`

```json
{ "content": "수정된 내용" }
```

- body는 등록과 동일(`content` 필수). 댓글 작성자 본인만 가능, 아니면
  `403 {"detail": "작성자만 수정할 수 있습니다"}`.
- 댓글이 없으면 `404 {"detail": "댓글을 찾을 수 없습니다"}`.
- 응답에 `updated_at`이 채워져 내려온다 — 목록에서 "(수정됨)" 표시 등에 활용 가능.

### ④ 삭제 — `DELETE /api/v1/comments/{comment_id}`

- 작성자 본인만, 아니면 `403`. 댓글 없으면 `404`. 성공 시 `204`(body 없음).
- 삭제 전 확인 팝업을 넣는 걸 권장(§7 — 삭제는 되돌릴 수 없음).

### 탈퇴한 사용자의 댓글

댓글 작성자가 탈퇴하면 `author.id: null`, `author.nickname: "탈퇴한 사용자"`로 내려온다(댓글
자체는 삭제되지 않고 남는다). FE는 `author.id`가 `null`이면 프로필 이동 등 클릭 액션을 막아야
한다.

## 3. 필드 요약

**AuthorOut** (댓글 작성자, 게시물 작성자 공용)

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `id` | UUID \| null | 탈퇴 유저면 null |
| `nickname` | string | 탈퇴 유저면 "탈퇴한 사용자" |
| `profile_image_url` | string \| null | optional |

**CommentOut**

| 필드 | 타입 |
| --- | --- |
| `id` | UUID |
| `post_id` | UUID |
| `author` | AuthorOut |
| `content` | string |
| `created_at` | datetime |
| `updated_at` | datetime \| null |

**LikeOut**

| 필드 | 타입 |
| --- | --- |
| `post_id` | UUID |
| `liked` | boolean |
| `like_count` | int |

댓글/좋아요 전용 enum은 없다(상태값 없이 존재/삭제만 있는 단순 리소스).

## 4. 에러 케이스 요약

| 상황 | 응답 | FE 처리 |
| --- | --- | --- |
| 로그인 안 함 | 401 | 로그인 화면으로 |
| 댓글 `content` 빈 문자열/누락 | 422 | 내용 입력 안내, 등록 버튼 비활성 |
| 없는/차단된 게시물에 댓글·좋아요 시도 | 404 | 게시물 목록으로 이동 |
| 남의 댓글 수정·삭제 시도 | 403 | 수정/삭제 버튼 자체를 숨김(본인 댓글에만 노출) |
| 없는 댓글 id로 수정·삭제 | 404 | 목록 새로고침 |
| 이미 좋아요한 글에 다시 `POST` | 200(정상) | 에러 아님 — 그대로 `like_count` 반영 |
| 좋아요 안 한 글에 `DELETE` | 200(정상) | 에러 아님 — 그대로 `like_count` 반영 |

모든 에러는 `{ "detail": "<한국어 메시지>" }` 형식이며(422는 FastAPI 기본 validation 에러
배열 형식), `detail` 문자열이 아니라 HTTP status + 엔드포인트 조합으로 분기하는 걸 권장한다.
