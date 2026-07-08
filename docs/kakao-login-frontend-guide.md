# 카카오 로그인 — 프론트엔드 연동 가이드

백엔드의 소셜 로그인은 카카오/구글/mock(dev) 제공자를 동일한 흐름으로 처리한다.
이 문서는 프론트엔드가 **카카오 로그인 연동 시 알아야 할 것**만 정리한다.
전체 API 스펙은 [docs/api.md](api.md#auth-acc-0102), 백엔드 키 발급 절차는
[docs/oauth-setup.md](oauth-setup.md) 참고.

## 1. 전체 흐름

```
[1] FE → GET  /api/v1/auth/kakao/authorize          (백엔드 호출, fetch)
        ← { authorize_url }
[2] FE → location.href = authorize_url               (브라우저 리다이렉트, fetch 아님!)
        → 카카오 로그인 페이지 → 사용자 로그인/동의
[3] 카카오 → GET {OAUTH_REDIRECT_BASE}/api/v1/auth/kakao/callback?code=...&state=...
        (브라우저가 자동으로 이동 — 이 요청은 백엔드가 직접 받는다)
[4] 백엔드가 처리 후 응답
    - 기가입자: { is_new_user: false, access_token, user_id } + refresh 쿠키
    - 신규가입자: { is_new_user: true, signup_token }
[5] (신규가입자만) FE → POST /api/v1/auth/signup { signup_token, nickname, birth_date, ui_mode, agreements }
        ← { access_token, user_id, stranger_requests_allowed } + refresh 쿠키
```

핵심: **[2]는 API 호출이 아니라 브라우저 주소 이동**이다. `authorize_url`을
`fetch`로 호출하면 안 되고, `window.location.href = authorize_url` 같은 방식으로
브라우저 자체를 카카오 로그인 페이지로 보내야 한다. 카카오 로그인이 끝나면
카카오가 **백엔드의 callback URL**로 직접 리다이렉트하므로, FE가 `/callback`을
호출할 필요도 없다 — 다만 콜백 응답을 FE 페이지가 받아서 처리할 수 있도록
백엔드/FE 라우팅을 맞춰야 한다 (아래 3번 참고).

## 2. 콜백 응답을 FE가 받는 방법

`GET /auth/kakao/callback`은 백엔드 API 엔드포인트이며 JSON을 반환한다.
브라우저가 카카오에서 리다이렉트되어 이 URL로 직접 들어오기 때문에, 실제 서비스에서는
보통 아래 둘 중 하나로 처리한다 (현재 백엔드는 **JSON 직접 응답** 방식):

- 백엔드가 콜백에서 바로 JSON을 반환 → FE가 이 API를 프록시하거나, 콜백 URL 자체를
  FE 도메인의 라우트로 두고 FE가 code를 받아 별도 API로 넘기는 구조로 바꿔야 한다면
  **백엔드 변경이 필요**하다 (현재는 `OAUTH_REDIRECT_BASE` = 백엔드 서버 주소로 고정).
- 즉 지금 구조에서는 **카카오 로그인 완료 → 사용자는 백엔드가 반환한 JSON 화면을 보게 됨**.
  SPA에서 자연스러운 UX를 원하면, FE와 협의해 콜백 처리 방식(리다이렉트 후 프론트 라우트로
  다시 이동시키는 방식 등)을 백엔드에 요청해야 한다. 현재 스펙대로 붙이려면 이 부분을
  기획/BE와 먼저 확인할 것.

## 3. 엔드포인트 요약

| 메서드·경로 | 인증 | 설명 |
|---|---|---|
| `GET /api/v1/auth/kakao/authorize` | — | 카카오 인가 URL 반환. 응답을 그대로 브라우저 이동에 사용 |
| `GET /api/v1/auth/kakao/callback?code=...` | — | 카카오가 리다이렉트로 호출 (FE가 직접 호출할 일 없음) |
| `POST /api/v1/auth/signup` | `signup_token` (body) | 신규가입자 추가 정보 제출 |
| `POST /api/v1/auth/refresh` | refresh 쿠키 (자동) | access_token 재발급 |
| `POST /api/v1/auth/logout` | refresh 쿠키 (자동) | 로그아웃, 쿠키 폐기 |

## 4. 토큰 처리

- **access_token**: 응답 body로 내려온다. FE가 저장(메모리/스토리지)하고, 이후 모든
  인증 필요 API에 `Authorization: Bearer <access_token>` 헤더로 첨부한다.
  만료 24시간 (`ACCESS_TOKEN_EXPIRE_MINUTES = 60*24`).
- **refresh_token**: FE가 직접 다루지 않는다. `httpOnly` 쿠키로 자동 설정되며
  (`Path=/api/v1/auth`), 만료 30일. `/auth/refresh`, `/auth/logout` 호출 시
  브라우저가 자동으로 쿠키를 실어 보낸다 — **FE는 body에 refresh_token을 넣지 않는다.**
- **CORS 필수 설정**: FE 도메인과 BE 도메인이 다르면 쿠키 기반 refresh/logout이
  동작하려면 요청 시 반드시 `credentials: 'include'` (fetch) 또는
  `withCredentials: true` (axios)를 설정해야 한다. 백엔드도 이에 맞춰 CORS
  `allow_credentials=true` + 명시적 origin이 필요하다 (와일드카드 `*` 불가).
- 운영(HTTPS, 크로스사이트)에서는 쿠키가 `SameSite=None; Secure`로 내려간다
  (`COOKIE_SECURE=true`일 때). 로컬 HTTP 개발 시에는 `SameSite=Lax`로 동작하므로
  FE가 BE와 다른 origin(포트만 다른 것 포함)이면 쿠키가 안 실리는 경우가 있을 수 있다 —
  이 경우 BE 담당자와 `OAUTH_REDIRECT_BASE`/`COOKIE_SECURE` 설정 확인.

## 5. 신규가입자 처리 (`is_new_user: true`)

콜백 응답에 `signup_token`(30분 유효)만 오고 `access_token`은 없다.
FE는 아래 정보를 추가 입력받아 `POST /auth/signup`으로 제출해야 가입이 완료된다.

```json
{
  "signup_token": "...",
  "nickname": "2~12자",
  "birth_date": "YYYY-MM-DD",
  "ui_mode": "visual | hearing | developmental",
  "agreements": { "terms": true, "privacy": true, "ai_notice": true }
}
```

- `ui_mode`는 셋 중 하나 **필수 선택** (기본값 없음). 시각/청각/발달 장애 유형별 UI 모드.
- `agreements` 3종 모두 `true`가 아니면 400.
- 만 14세 미만이면 400 (가입 불가).
- 카카오에서 생년월일을 받아오지 않는다 — **FE 가입 화면에서 직접 입력받아야 하는 필수 항목**이다.
- 동일 소셜 계정으로 탈퇴 후 30일 이내 재가입 시 403.
- `signup_token`이 30분 지나 만료되면 401 → 처음부터(authorize) 재시도 안내.
- 성공 시 `stranger_requests_allowed`가 응답에 포함됨 (미성년은 `false`로 시작 — §4.5).

## 6. 에러 케이스 (FE에서 분기 필요)

| 상황 | 응답 | FE 처리 |
|---|---|---|
| code 만료/재사용 | 400 | "다시 시도해 주세요" → authorize부터 재시작 |
| 카카오 서버 연결 불가 | 502 | 일시적 오류 안내, 재시도 유도 |
| signup_token 만료(30분 초과) | 401 (signup 시) | 처음부터(authorize) 재시도 안내 |
| 약관 미동의 | 400 (signup 시) | 필수 약관 체크 안내 |
| 만 14세 미만 | 400 (signup 시) | 가입 불가 안내 |
| 탈퇴 후 30일 이내 재가입 | 403 (signup 시) | 재가입 제한 안내 |
| 이미 가입된 소셜 계정 | 409 (signup 시) | 로그인 페이지로 안내 (콜백에서 이미 처리됐어야 하는 케이스) |
| refresh_token 없음/만료 | 401 (refresh 시) | 로그인 화면으로 이동 |

## 7. 개발 환경(mock) 참고

로컬 dev 백엔드는 기본적으로 `OAUTH_MOCK=true`로 동작한다 — 이 상태에서는 실제
카카오 로그인 화면 없이 `authorize_url`이 `?code=mock:<state>` 형태를 그대로
포함해서 내려온다. 즉 **FE가 실제 카카오 키 없이도 로그인 흐름을 테스트**할 수 있다.
단, 이 경우 브라우저 리다이렉트 없이 바로 그 URL을 호출(fetch)해도 콜백이 동작한다.
실제 카카오 연동 테스트가 필요하면 BE가 실키를 투입한 환경(`OAUTH_MOCK=false`)에서
확인해야 한다 (docs/oauth-setup.md 참고).

## 8. 로그아웃

`POST /api/v1/auth/logout` 호출 (credentials 포함) → refresh 쿠키 삭제, 204 반환.
FE는 이와 별개로 저장해둔 access_token을 클라이언트 측에서 함께 제거해야 한다
(백엔드가 access_token을 무효화하지는 않음 — 만료까지는 유효한 stateless JWT).
