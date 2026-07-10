# 마이페이지(ACC-03 · TAG-01 · §15) — 프론트엔드 연동 가이드

프로필 조회/수정, 관심사 태그, 접근성 모드·설정, 모드 변경, 회원 탈퇴를 정리한다.
`app/api/v1/users.py` 라우터, `app/schemas/user.py` 스키마. 전체 API 스펙은 [api.md](api.md) 참고.
친구/차단 관리는 마이페이지에서 진입하는 화면이지만 별도 문서([friend-frontend-guide.md](friend-frontend-guide.md))에서 다룬다.
로그아웃/토큰 재발급은 `/auth` 라우터(`POST /auth/refresh`, `POST /auth/logout`) 소관이라 이 문서에서는 §5만 짧게 다룬다.

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러
`{"detail": "..."}`(422는 FastAPI 기본 validation 배열) · 시간 UTC ISO-8601 · ID는 UUID.
`GET /tags`를 제외한 모든 엔드포인트는 로그인 필수(토큰 없으면 401 `Not authenticated`,
무효/만료면 401 `Invalid token`, 탈퇴된 유저의 토큰이면 401 `User not found`).

## 1. 내 프로필 조회 — `GET /users/me`

```
GET /api/v1/users/me
```

응답(`MeOut`, 200):

```json
{
  "id": "uuid",
  "nickname": "닉네임",
  "bio": "자기소개 또는 null",
  "profile_image_url": "https://... 또는 null",
  "ui_mode": "visual",
  "is_minor": false,
  "stranger_requests_allowed": true,
  "mode_settings": { "font_scale": 1.5 },
  "tags": [ { "code": "walking", "category": "이동", "label": "보행" } ]
}
```

- `is_minor`는 서버가 `birth_date`로 요청 시점마다 계산해서 내려주는 파생값이다(만 14~18세).
  FE는 저장하지 말고 매번 이 응답값을 그대로 쓰면 된다.
- `ui_mode`·`birth_date`·`is_minor`는 **본인 조회에만** 있고 타인 프로필(§4)에는 없다 — 절대
  타인 화면에 노출하지 않는다(ACC-03).
- 마이페이지 진입 시 이 API로 화면을 채우면 된다. 태그 카탈로그가 필요하면 §3의
  `GET /tags`를 별도 호출.

## 2. 프로필 수정 — `PATCH /users/me`

```json
{ "nickname": "새닉네임", "bio": "자기소개", "profile_image_url": "https://..." }
```

세 필드 모두 선택(`null`/생략 = 변경 안 함). 응답은 갱신된 `MeOut`.

- `nickname`: 2~12자 한글·영문·숫자만(`^[가-힣a-zA-Z0-9]{2,12}$`). 검증 순서 —
  형식 오류 `400 {"detail": "닉네임은 2~12자 한글·영문·숫자만 가능합니다"}` →
  금칙어 `400 {"detail": "사용할 수 없는 닉네임입니다"}` →
  중복(본인 현재 닉네임은 예외) `409 {"detail": "이미 사용 중인 닉네임입니다"}`.
  현재 값과 동일하면 검증 자체를 건너뛴다.
- `bio`: 최대 300자. **연락처(전화번호·이메일·카톡/텔레그램/인스타 ID 유도 문구)가 감지되면
  `400 {"detail": "자기소개에 연락처를 쓸 수 없습니다. 삭제 후 다시 시도해 주세요"}`**
  (MATCH-02-7, 사설 연락처 교환으로 인한 안전 기능 우회 방지). FE는 저장 실패 시 이 메시지를
  그대로 보여주면 되고, 프론트에서 미리 정규식으로 막을 필요는 없다(서버가 최종 검증).
- `profile_image_url`: 직접 URL 문자열을 넣는 필드다. **이미지 업로드는 별도 2단계**:
  1. `POST /media/images` (multipart, `files`) → 게시물 업로드와 동일한 엔드포인트를 그대로 쓴다.
     응답 `{ "items": [{ "media_id": "uuid", "url": "https://..." }] }` (files 여러 장 보내도
     프로필용으로는 1장만 쓰면 됨). 허용 타입 `image/jpeg|png|gif|webp`, 최대 10MB
     (초과 시 `413`, 미지원 형식 `400`).
  2. 받은 `url`을 `PATCH /users/me`의 `profile_image_url`로 다시 보내야 실제 프로필에 반영된다.
  - 사진을 삭제(기본 이미지로 되돌리기)하고 싶다면 `profile_image_url: null`을 명시적으로
    보내야 하는지 서버 코드상 `None`은 "변경 안 함"으로 처리되므로 **현재는 프로필 사진을
    지우는 API가 없다** — 빈 문자열 URL을 보내는 식으로 우회하지 말고, 필요하면 백엔드에 문의.

## 3. 관심사 태그 (TAG-01)

```
GET /api/v1/tags              (인증 불요) — 전체 카탈로그
PUT /api/v1/users/me/tags     { "tag_codes": ["walking", "hearing_aid", ...] }
```

- `GET /tags` 응답: `{ "tags": [{ "code", "category", "label" }, ...] }`. 카테고리별로
  묶어서 다중 선택 UI를 구성하면 된다(가입 온보딩과 동일 카탈로그, 43종).
- `PUT /users/me/tags`는 **전체 교체**다(부분 추가/삭제 아님) — 현재 선택된 태그 + 새로 고를
  태그를 합쳐서 항상 "최종 선택 목록 전체"를 보내야 한다. 응답은 갱신된 `MeOut`
  (`tags` 필드로 확인).
- 최대 10개 초과 시 `400 {"detail": "관심사 태그는 최대 10개까지 선택할 수 있습니다"}`.
- 존재하지 않는 `code`가 섞여 있으면 `404 {"detail": "존재하지 않는 태그가 있습니다"}` —
  카탈로그에 없는 코드를 로컬에서 하드코딩하지 말고 항상 `GET /tags` 응답의 `code`만 사용.
- 빈 배열(`{"tag_codes": []}`)을 보내면 태그 전체 해제(정상 처리, 에러 아님).

## 4. 설정 — `PATCH /users/me/settings`

```json
{ "stranger_requests_allowed": false, "mode_settings": { "font_scale": 1.5 } }
```

둘 다 선택(`null`/생략 = 변경 안 함). 응답은 갱신된 `MeOut`.

- `stranger_requests_allowed`: 비친구 메시지 요청 허용 여부(§4.5). **미성년(14~18세)은
  가입 시 서버가 자동으로 `false`로 초기화**하지만 이후 본인이 이 API로 자유롭게 켤 수 있다
  (서버가 미성년이라고 강제로 막지는 않음 — 안내 문구는 FE 몫).
- `mode_settings`: **서버는 내용을 검증하지 않는 자유 형식 JSON 객체다.** 시각 모드의
  글자 크기·대비, 청각 모드의 자막 크기·색상 등(§15)을 FE가 원하는 키로 통째로 저장/조회하는
  용도 — 예: `{"font_scale": 1.5, "contrast": "high"}`, `{"caption_size": "large",
  "caption_color": "#FFEB3B"}`. **키 스키마를 정하고 프론트에서 일관되게 쓰는 것이 FE 책임**이며,
  PATCH할 때마다 객체 전체가 교체된다(부분 병합 아님) — 특정 키 하나만 바꾸고 싶어도
  기존 `GET /users/me`로 받은 `mode_settings` 전체를 가져와 수정 후 통째로 다시 보내야 한다.
- 두 필드 다 `ui_mode` 자체(시각/청각/발달)는 바꾸지 않는다 — 모드 전환은 §5 참고.

## 5. 맞춤 모드 변경 — `PUT /users/me/mode`

```json
{ "ui_mode": "visual" }
```

`ui_mode`는 `"visual" | "hearing" | "developmental"` 중 하나(가입 시 고른 3종, `default` 없음).
응답은 갱신된 `MeOut`.

- 실제로 값이 바뀔 때만 `user_mode_history`에 변경 이력을 남긴다(같은 값 재전송은 아무 일도
  안 하고 200만 반환).
- 모드는 매칭(MATCH) 로직에서 외부에 노출되지 않으므로(§18.3) 다른 사용자 화면에는 절대
  나타나지 않는다 — 본인 마이페이지 전용 설정.

## 6. 로그아웃 (참고, `/auth` 라우터)

```
POST /api/v1/auth/logout   → 204
```

- access_token은 클라이언트에서 그냥 버리면 되고(서버 blacklist 없음), 이 API는
  refresh_token httpOnly 쿠키만 폐기한다. 로그아웃 버튼 클릭 시 이 API 호출 + 로컬에 저장된
  access_token 삭제 + 로그인 화면 이동, 세 가지를 함께 처리해야 한다.

## 7. 회원 탈퇴 — `DELETE /users/me`

```json
{ "posts_action": "anonymize" }
```

`posts_action`: `"anonymize"`(기본값) | `"delete"`. 성공 시 `204`(본문 없음).

- **탈퇴 확인 단계는 FE 책임**이다 — 서버는 별도 확인 절차 없이 즉시 처리한다. 되돌릴 수 없는
  동작이므로 "정말 탈퇴하시겠습니까" + 처리 방식 선택 UI를 반드시 넣을 것.
- `posts_action="anonymize"`: 내가 쓴 게시물·댓글은 삭제하지 않고 작성자를 `탈퇴한 사용자`로
  남긴다(다른 사용자 피드에서 계속 보임).
- `posts_action="delete"`: 내가 쓴 게시물(+그에 딸린 미디어·댓글·좋아요)과 내가 남의 글에 단
  댓글을 모두 삭제한다.
- 선택과 무관하게 항상 자동으로 처리되는 것들 (FE가 별도로 호출할 API 없음):
  - 1:1 채팅 메시지는 상대방 대화 기록 보존을 위해 **유지**하되 발신자를 `탈퇴한 사용자`로
    익명화(내용은 그대로 남음).
  - 좋아요, 친구 관계, 진행 중인 친구·메시지 요청, 알림, AI 위험 판정 기록, 전송 제한
    카운터는 계정과 함께 삭제.
  - 연결된 소셜 계정(카카오/구글) unlink 시도(제공자 장애로 실패해도 탈퇴 자체는 진행됨).
  - 동일 소셜 계정으로 **30일간 재가입 불가** — 재가입 시도 시 `403`.
- 탈퇴 완료 즉시 해당 access_token은 이후 요청에서 `401 User not found`로 무효 처리된다 —
  FE는 204 응답을 받으면 그 자리에서 로컬 토큰을 지우고 로그인/시작 화면으로 보내면 된다
  (탈퇴 후 추가로 `/auth/logout`을 호출할 필요 없음).

## 8. 타인 프로필 조회 — `GET /users/{user_id}`

마이페이지는 아니지만 닉네임 클릭 등으로 자주 함께 쓰여서 같이 정리한다.

응답(`PublicProfileOut`, 200):

```json
{ "id": "uuid", "nickname": "닉네임", "bio": "...", "profile_image_url": null, "tags": [...] }
```

- `ui_mode`·`is_minor`·`birth_date`는 응답에 아예 포함되지 않는다(ACC-03 — 장애 유형 추정
  방지, §5.2).
- 대상이 없거나(탈퇴 등) 나-상대 어느 방향이든 **차단 관계**면 `404
  {"detail": "사용자를 찾을 수 없습니다"}` — 존재하지 않음과 차단을 FE에서 구분할 수 없다
  (친구 요청 404와 동일한 원칙, [friend-frontend-guide.md](friend-frontend-guide.md) §1 참고).

## 9. 필드 요약

**MeOut** (본인 전용, `GET /users/me` · 대부분의 PATCH/PUT 응답)

| 필드 | 타입 | 비고 |
| --- | --- | --- |
| `id` | UUID | |
| `nickname` | string | 2~12자 |
| `bio` | string \| null | 최대 300자 |
| `profile_image_url` | string \| null | |
| `ui_mode` | string | `visual` \| `hearing` \| `developmental` |
| `is_minor` | boolean | 서버가 매 요청 시 계산하는 파생값(만 14~18세) |
| `stranger_requests_allowed` | boolean | §4.5 |
| `mode_settings` | object | 자유 형식 JSON, FE가 키 스키마 정의 |
| `tags` | TagOut[] | |

**PublicProfileOut** (타인 조회) — `id, nickname, bio, profile_image_url, tags`만 포함,
`ui_mode`/`is_minor`/`birth_date` 없음.

**TagOut** — `code, category, label` (모두 string).

## 10. 에러 케이스 요약

| 상황 | 응답 | FE 처리 |
| --- | --- | --- |
| 토큰 없음 | `401 Not authenticated` | 로그인 화면으로 |
| 토큰 무효/만료 | `401 Invalid token` | 로그인 화면으로(리프레시 시도 후 재시도 고려) |
| 탈퇴된 계정의 토큰 | `401 User not found` | 로컬 토큰 삭제 후 로그인 화면으로 |
| 닉네임 형식 오류 | `400` | 인라인 에러 문구 표시 |
| 닉네임 금칙어 | `400` | 인라인 에러 문구 표시 |
| 닉네임 중복 | `409` | "이미 사용 중" 인라인 표시 |
| bio에 연락처 패턴 감지 | `400` | 저장 실패 토스트, 해당 문구 하이라이트는 서버가 위치를 안 줌 — 전체 문구만 표시 |
| 태그 10개 초과 | `400` | 선택 버튼 자체를 10개에서 비활성화하는 걸 권장 |
| 존재하지 않는 태그 코드 | `404` | 발생하면 안 되는 케이스(카탈로그 기반이면 방지됨) |
| 이미지 미지원 형식 | `400`(`/media/images`) | 업로드 전 accept 필터로 선제 차단 권장 |
| 이미지 10MB 초과 | `413`(`/media/images`) | 업로드 전 용량 체크 권장 |
| 탈퇴 후 30일 내 동일 소셜 재가입 | `403`(`/auth/signup`) | 안내 문구로 처리(마이페이지 범위 밖) |

모든 4xx 에러는 `{ "detail": "<한국어 메시지>" }` 형식(422 제외)이며, 메시지 문자열이 아니라
HTTP status + 엔드포인트 조합으로 분기하는 걸 권장한다.
