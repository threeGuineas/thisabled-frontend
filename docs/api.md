# ThisAbled API 명세 요약 (v2.2)

> **정본은 FastAPI OpenAPI**(`/docs`, `/api/v1/openapi.json`)이다. 이 문서는 프론트 온보딩용 요약.
> 기준 명세: `docs/ThisAbled_기능명세서_v2_2.md` / 설계: `docs/superpowers/specs/2026-07-05-v2_1-refactor-design.md`

공통: prefix `/api/v1` · 인증 `Authorization: Bearer <access_token>` · 에러 `{"detail": "..."}` · 시간 UTC ISO-8601 · ID는 UUID.

## auth (ACC-01/02)

| 메서드·경로 | 인증 | 동작 |
| --- | --- | --- |
| `GET /auth/{provider}/authorize` | — | 제공자 인가 URL 반환. provider: `kakao`\|`google`\|`mock`(dev) |
| `GET /auth/{provider}/callback?code=` | — | 기가입자: access_token + refresh 쿠키, `is_new_user:false` / 신규: `signup_token`(30분), `is_new_user:true` |
| `POST /auth/signup` | signup_token | `{signup_token, nickname, birth_date, ui_mode, agreements:{terms,privacy,ai_notice}}` → 201. 검증: 약관 3종 필수(400) → 만14세(400) → 30일 재가입 제한(403) → 닉네임 2~12자·금칙어(400)·중복(409). 미성년이면 `stranger_requests_allowed=false`로 시작 |
| `POST /auth/refresh` | refresh 쿠키 | access_token 재발급 |
| `POST /auth/logout` | ✓ | refresh 쿠키 폐기 |

## users (ACC-03 · TAG-01 · §15)

| 메서드·경로 | 동작 |
| --- | --- |
| `GET /users/me` | 내 프로필+태그+설정+파생 `is_minor` |
| `PATCH /users/me` | nickname/bio/profile_image_url. bio 연락처 패턴(전화·이메일·카톡ID) 400 (MATCH-02-7) |
| `GET /tags` | TAG-01 카탈로그 (인증 불요) |
| `PUT /users/me/tags` | `{tag_codes:[...]}` 전체 교체, 최대 10개 |
| `PATCH /users/me/settings` | `{stranger_requests_allowed?, mode_settings?}` |
| `PUT /users/me/mode` | `{ui_mode}` — user_mode_history 기록 |
| `GET /users/{id}` | 타인 프로필(닉네임·bio·태그·이미지). ui_mode·생년월일 비노출(ACC-03). 차단 관계 404 |
| `DELETE /users/me` | 탈퇴 — `{posts_action:"anonymize"\|"delete"}`. 채팅 익명화, unlink, 30일 재가입 제한(§15) |

## posts / feed (FEED-01 · POST-01~03)

| 메서드·경로 | 동작 |
| --- | --- |
| `GET /feed?cursor=&limit=` | published만·차단 상호 제외·최신순 커서 |
| `POST /posts` | 텍스트·사진 게시물 `{content, media_ids?}` → 즉시 published. 사진 최대 3장 |
| `GET /posts/{id}` / `PATCH` / `DELETE` | 상세·수정·삭제(작성자만) |
| `POST /posts/{id}/publish` | 영상 드래프트 게시. 자막 done→공개(+사진 설명 생성 시점). failed면 `{allow_no_caption:true}` 필요(자막 없음 라벨) |
| `POST /posts/{id}/like` / `DELETE .../like` | 멱등 좋아요 |
| `GET /posts/{id}/comments` / `POST` / `PATCH /comments/{id}` / `DELETE` | 댓글 CRUD |

## media (VISION-01 · CAPTION-01 · VIS-03)

| 메서드·경로 | 동작 |
| --- | --- |
| `POST /media/images` | multipart ≤3장 → `[{media_id, url}]` |
| `POST /media/videos` | 1개 ≤200MB·≤3분 → processing 드래프트 post 생성 + 자막 시작(일 5회 차감, 실패 시 복원) → `{post_id, media_id, caption_status}` |
| `GET /posts/{id}/caption-status` | 드래프트 자막 상태 폴링 |
| `POST /media/transcribe` | VIS-03 음성 입력 — 오디오 → `{text}` (자동 게시 없음) |

한도: vision 20/일·5/분(이미지 1장=1회, 게시물·채팅 합산), caption 5/일. 동일 해시 캐싱. 드래프트 24h 미게시 자동 삭제.

## friends / blocks (FRIEND-01/02 · BLOCK-01)

| 메서드·경로 | 동작 |
| --- | --- |
| `POST /friends/requests` | `{receiver_id}`. 차단·정책 사유는 통일 404 `요청을 보낼 수 없는 상대입니다` |
| `POST /friends/requests/{id}/accept`/`decline`/`cancel` | 수락=양방향 친구. 거절=responded_at(30일 추천 제외) |
| `GET /friends` / `GET /friends/requests?box=` / `DELETE /friends/{user_id}` | 목록·해제 |
| `POST /blocks` / `DELETE /blocks/{user_id}` / `GET /blocks` | 차단=친구 해제+상호 접점 제거 |

## chat (CHAT-01~03 · SAFE-01~05)

| 메서드·경로 | 동작 |
| --- | --- |
| `GET /chat/rooms` / `GET /chat/requests` | active 방 / 요청함(request 방). 각 방의 `unread_count`, 응답 전체의 `unread_total` 포함 |
| `POST /chat/rooms` | `{user_id}` — 친구=active, 비친구=request(수신자 허용 설정·미성년 보호 검증, 사유 비노출 404) |
| `POST /chat/rooms/{id}/messages` | 텍스트 전송 — SAFE 동기 분석 후 저장·전달. 발신자 응답에 판정 없음. request 방은 수락 전 1건 제한. SAFE-05 제한 중 403 `메시지를 보낼 수 없습니다` |
| `POST /chat/rooms/{id}/media` | 사진·영상 — 친구 방만, 미성년-성인 403(§4.5). 즉시 전달 후 설명·자막 비동기 부착 |
| `GET /chat/rooms/{id}/messages?cursor=` | 수신자 관점: flagged & 미열람 → `content:null, blurred:true`. 최신 페이지 조회는 표시 가능한 수신 메시지를 읽음 처리하며, 발신자 메시지 중 상대의 마지막 읽음 메시지만 `is_read:true` |
| `POST /chat/messages/{id}/reveal` | 내용 보기(수신자만) → 원문 반환 |
| `POST /chat/requests/{room_id}/accept` | 요청 수락 → active |
| `POST /chat/restrictions/{sender_id}/release` | 수신자의 전송 제한 해제(카운터 리셋) |

실시간 `chat.read` 이벤트는 `{room_id, message_id}`만 포함하며 채팅 원문은 전송하지 않는다.
SAFE `pending` 메시지가 재분석 완료되어 표시 가능해지면 `chat.message` 이벤트를 다시 보내며, 이 시각부터 미읽음으로 계산한다.

SAFE 장애 시(§18.3): 친구 텍스트=`unanalyzed`로 전달, 비친구=`pending` 보류. 복구 후 재분석·소급 블러.

## recommendations (MATCH)

| 메서드·경로 | 동작 |
| --- | --- |
| `GET /recommendations` | 후보 제외(자신·친구·차단·거절 30일·미성년↔성인)는 백엔드 강제, 점수·사유는 match-model. 사유에 모드·장애 비노출. 부족 시 `추천 정보가 부족합니다` |

## comm (COMM-01~05)

| 메서드·경로 | 동작 |
| --- | --- |
| `POST /comm/simplify` / `POST /comm/complete` | `{text}` → 쉬운 문장·문장 완성 후보 |
| `POST /comm/replies` / `POST /comm/hints` | `{room_id}` — 참여자만. 최근 10개 텍스트만 외부 LLM 전달(COMM-05), flagged 미열람 메시지 제외 |

## notifications (§16) / ws

| 메서드·경로 | 동작 |
| --- | --- |
| `GET /notifications?cursor=` / `POST /notifications/read` | 목록·읽음 |
| `WS /api/v1/ws?token=` | 실시간 푸시 `{type, payload}` — chat.message, notification 등 |
