# 회원가입 온보딩 — 프론트엔드 연동 가이드

신규 가입 시 사용자가 입력하는 **닉네임 / 생년월일 / 필수 동의 / 프로필 이미지 / 자기소개 / 관심사 태그**를
프론트엔드가 어떤 API로 어떻게 제출해야 하는지 정리한다.
소셜 로그인(카카오) 자체의 흐름(authorize/callback)은 [kakao-login-frontend-guide.md](kakao-login-frontend-guide.md) 참고.
전체 API 스펙은 [api.md](api.md) 참고.

## 0. 핵심 포인트: 가입은 두 단계로 나뉜다

**닉네임 · 생년월일 · 필수 동의(3종)** 는 `POST /auth/signup` 한 번에 제출해야 계정이 만들어진다.
**프로필 이미지 · 자기소개 · 관심사 태그** 는 이 API의 입력값이 아니다 — 계정 생성 후 로그인된 상태에서
`PATCH /users/me`, `PUT /users/me/tags` 로 별도 저장한다.

즉 "가입 화면"에서 전자를 받아 계정을 만들고, 곧바로 이어지는 "프로필 꾸미기"(스킵 가능한 온보딩)
화면에서 후자를 채우는 2단계 UX로 설계해야 한다.

```
[가입 화면]                                    [프로필 꾸미기 화면 (선택, 스킵 가능)]
닉네임/생년월일/UI모드/약관동의                    프로필 이미지 / 자기소개 / 관심사 태그
        │                                                    │
        ▼                                                    ▼
POST /api/v1/auth/signup                    POST /media/images (이미지 먼저 업로드)
  ← access_token, user_id                   → PATCH /users/me { profile_image_url, bio }
                                             → PUT /users/me/tags { tag_codes }
```

## 1. 1단계 — 계정 생성: `POST /api/v1/auth/signup`

카카오 콜백에서 받은 `signup_token`과 함께 아래를 body로 보낸다.

```json
{
  "signup_token": "...",
  "nickname": "홍길동",
  "birth_date": "2000-01-01",
  "ui_mode": "visual",
  "agreements": { "terms": true, "privacy": true, "ai_notice": true }
}
```

응답 (`201`):

```json
{
  "access_token": "...",
  "token_type": "bearer",
  "user_id": "uuid",
  "stranger_requests_allowed": true
}
```

이후 요청부터는 `Authorization: Bearer <access_token>` 헤더를 붙인다. (refresh 쿠키는
`kakao-login-frontend-guide.md` §4 참고)

### 닉네임 (`nickname`)

- 필수, 2~12자, **한글·영문·숫자만** 허용 (`^[가-힣a-zA-Z0-9]{2,12}$`, 공백/특수문자 불가).
- 서버 검증 순서: 형식(400) → 금칙어 포함 여부(400) → 중복(409).
- 실시간 중복 체크 API는 없다 — 가입 폼에서 중복 여부를 미리 보여주려면 별도 API 추가가
  필요하므로, 현재는 제출 시 409를 받아 안내하는 방식으로 처리해야 한다.

### 생년월일 (`birth_date`)

- 필수, `YYYY-MM-DD` (ISO date). 카카오 프로필에서 자동으로 받아오지 않으므로 **FE가 반드시
  직접 입력받아야 한다.**
- 만 14세 미만이면 400 (가입 불가). 만 14~18세는 가입은 되지만 `stranger_requests_allowed`가
  자동으로 `false`로 시작한다(비친구의 요청 기본 차단, §4.5).
- 서버는 생년월일 원문만 저장하고 만 나이/미성년 여부는 매 요청 시점에 계산한다(`is_minor`는
  `GET/PATCH /users/me` 응답에 파생값으로 내려옴).

### UI 모드 (`ui_mode`)

- 필수, `visual | hearing | developmental` 중 **하나를 반드시 선택**해야 한다 — 기본값 없음.
  시각/청각/발달장애 유형별 UI 모드로, 가입 이후에도 `PUT /users/me/mode`로 변경 가능.

### 필수 동의 (`agreements`)

- `terms`, `privacy`, `ai_notice` 3개 모두 `boolean`이며 **셋 다 `true`가 아니면 400**.
  선택 동의 항목은 없음 — 체크박스 3개 모두 필수로 노출해야 한다.
- `ai_notice`는 외부 AI(자막/설명 생성 등)에 데이터가 전달될 수 있다는 안내 동의다.
  동의 문구 원문은 약관 페이지(FE 자체 콘텐츠)에서 관리하고, 백엔드는 boolean 3개만 받는다.

## 2. 2단계 — 프로필 이미지: `POST /media/images` → `PATCH /users/me`

**presigned URL 방식이 아니다.** 클라이언트가 파일을 직접 백엔드로 멀티파트 업로드하고,
백엔드가 반환한 URL 문자열을 프로필에 저장하는 2번의 호출 구조다.

**① 업로드** — `POST /api/v1/media/images` (인증 필요, `multipart/form-data`, `files` 필드 1장만 사용)

- 허용 타입: `image/jpeg`, `image/png`, `image/gif`, `image/webp` (아니면 400)
- 최대 10MB (초과 시 413)
- 한 번에 최대 3장까지 보낼 수 있는 범용 업로드 API지만(게시물 사진용 공용 엔드포인트),
  프로필 이미지 용도로는 1장만 보내면 된다.

```json
// 응답 201
{ "items": [{ "media_id": "uuid", "url": "/uploads/xxxx.jpg" }] }
```

**② 프로필 반영** — `PATCH /api/v1/users/me`

```json
{ "profile_image_url": "/uploads/xxxx.jpg" }
```

`profile_image_url`은 절대 URL이 아니라 서버가 반환한 경로 문자열을 그대로 저장하면 된다
(이미지 표시 시 API 서버 origin을 붙여서 렌더링).

## 3. 2단계 — 자기소개: `PATCH /api/v1/users/me`

```json
{ "bio": "안녕하세요, 잘 부탁드려요!" }
```

- 선택 입력, 최대 300자.
- **연락처 유도 문구가 포함되면 400으로 거부된다** (전화번호 패턴, 이메일 패턴, "카톡/카카오톡/
  텔레그램/인스타 + id" 패턴). 낯선 사람에게 개인 연락처를 넘기는 것을 막기 위한 정책(§MATCH-02-7)이므로,
  FE에서도 제출 전 동일 패턴으로 프리체크해 UX를 개선하는 것을 권장(서버 검증은 필수이므로 우회 불가하게).

`PATCH /users/me`는 `nickname` / `bio` / `profile_image_url`을 부분 업데이트한다. 세 필드를
한 번에 같이 보내도 되고, 화면마다 나눠 보내도 된다(전달한 필드만 갱신, `null`이 아닌 값만 반영).
닉네임을 여기서 바꾸면 가입 때와 동일한 형식/금칙어/중복 검증이 다시 실행된다.

## 4. 2단계 — 관심사 태그: `GET /tags` → `PUT /users/me/tags`

**① 태그 목록 조회** — `GET /api/v1/tags` (인증 불필요, 마스터 카탈로그)

```json
{ "tags": [{ "code": "movie", "category": "취미", "label": "영화" }, ...] }
```

카테고리별로 그룹핑해 선택 UI를 구성하면 된다. 태그 목록은 서버가 관리하는 마스터 데이터라
FE에서 하드코딩하지 말고 이 API로 매번 가져와야 한다.

**② 선택 저장** — `PUT /api/v1/users/me/tags`

```json
{ "tag_codes": ["movie", "hiking", "coding"] }
```

- 최대 10개까지 선택 가능, 초과 시 400.
- 존재하지 않는 코드가 섞여 있으면 404.
- **PUT이므로 매번 전체 교체**다 — "태그 3개 선택 후 1개 추가"를 하려면 기존 선택값 + 새 코드를
  합쳐서 다시 전체 배열로 보내야 한다(부분 추가 API 없음). 현재 선택된 태그는 `GET /users/me`
  응답의 `tags` 필드로 확인.

## 5. 온보딩 완료 후 상태 확인: `GET /api/v1/users/me`

프로필 꾸미기 화면 진입/이탈 시 현재 저장된 값을 이 API로 조회해 폼 초기값으로 쓰면 된다.

```json
{
  "id": "uuid",
  "nickname": "홍길동",
  "bio": null,
  "profile_image_url": null,
  "ui_mode": "visual",
  "is_minor": false,
  "stranger_requests_allowed": true,
  "mode_settings": {},
  "tags": []
}
```

`bio`/`profile_image_url`이 아직 `null`이어도 정상 상태다 — 둘 다 선택 입력이므로 "프로필 꾸미기"
화면은 스킵 가능한 UX로 설계하면 된다(가입 자체는 1단계만으로 완료됨).

## 6. 에러 케이스 요약

| 단계 | 상황 | 응답 | FE 처리 |
|---|---|---|---|
| 가입 | 닉네임 형식 위반 | 400 | "2~12자 한글·영문·숫자만 가능" 인라인 안내 |
| 가입 | 닉네임 금칙어 | 400 | "사용할 수 없는 닉네임입니다" |
| 가입 | 닉네임 중복 | 409 | "이미 사용 중인 닉네임입니다" |
| 가입 | 약관 미동의 | 400 | 필수 체크박스 3개 모두 선택 안내 |
| 가입 | 만 14세 미만 | 400 | 가입 불가 안내 |
| 프로필 이미지 | 미지원 형식 | 400 | jpeg/png/gif/webp만 허용 안내 |
| 프로필 이미지 | 10MB 초과 | 413 | 파일 크기 축소 안내 |
| 자기소개 | 연락처 포함 | 400 | "자기소개에 연락처를 쓸 수 없습니다" |
| 관심사 태그 | 10개 초과 | 400 | 선택 개수 제한 안내 |
| 관심사 태그 | 존재하지 않는 코드 | 404 | 태그 목록을 다시 불러와 최신 코드로 재요청 |

모든 에러는 `{ "detail": "<한국어 메시지>" }` 형식으로 내려온다. 별도 에러 코드(enum) 없이
`detail` 문자열과 HTTP status로 분기하면 된다.
