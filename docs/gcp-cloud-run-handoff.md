# ThisAbled Cloud Run 배포 인수인계

최종 갱신: 2026-08-28

## 1. 프론트엔드 전달사항

### 접속 주소

- API origin: `https://thisabled-api-356864902103.asia-northeast3.run.app`
- Swagger UI: `https://thisabled-api-356864902103.asia-northeast3.run.app/docs`
- 모든 REST API prefix: `/api/v1`
- WebSocket: `wss://thisabled-api-356864902103.asia-northeast3.run.app/api/v1/ws?token=<access_token>`
- 업로드 응답의 `/uploads/...` 상대 경로는 위 API origin을 붙여 절대 URL로 변환한다.

프론트 환경변수 이름은 프론트 저장소 규칙을 따르되, API base 값에는 위 API origin을 사용한다. 비밀키나 GCP 인증정보는 프론트 환경변수에 넣지 않는다.

### 인증 연동

1. `GET /api/v1/auth/{provider}/authorize`의 `authorize_url`로 브라우저를 이동한다. `provider`는 `google` 또는 `kakao`다.
2. OAuth callback은 백엔드가 처리하고 프론트로 302 이동한다.
   - 기존 회원: `?is_new_user=false&access_token=...`
   - 신규 회원: `?is_new_user=true&signup_token=...`
   - 실패·거부: `?error={provider}_failed`
3. 보호 API에는 `Authorization: Bearer <access_token>`을 보낸다.
4. refresh/logout은 httpOnly refresh cookie를 쓰므로 `fetch`에 `credentials: "include"`가 필수다.
5. 401이면 refresh를 한 번만 호출하고 원 요청을 한 번 재시도한다.
6. 앱 시작 시 `GET /api/v1/users/me`로 사용자·UI 모드를 서버 정본과 동기화한다.

Google 실 OAuth는 테스트 계정으로 callback과 프론트 복귀까지 확인했다. 현재 Google OAuth 앱은 **Testing** 상태이므로 등록된 테스트 사용자만 로그인할 수 있다. 전체 공개 전 프론트에 공개 접근 가능한 개인정보처리방침 페이지를 만들고 OAuth 동의 화면에 URL을 등록해야 한다. Kakao 실 로그인은 별도 최종 점검이 필요하다.

### CORS와 프론트 배포

- 현재 허용 origin: `https://thisabled.vercel.app`
- Vercel preview URL이나 localhost는 현재 운영 API CORS에 포함되지 않는다.
- 새 origin이 필요하면 정확한 HTTPS origin을 백엔드 담당자에게 전달한다. 쿠키 인증 때문에 `*` 허용은 사용하지 않는다.

### 비동기·실시간 처리

- 영상 자막과 일부 AI 작업은 비동기다. 상태는 `none | processing | done | failed`다.
- `failed`를 무한 폴링하지 말고 `failure_message`를 표시한다.
- WebSocket 인증 실패 코드는 `4401`이다. access token refresh 후 새 연결을 만든다.
- WebSocket 이벤트에는 원문 대신 ID가 오는 경우가 있으므로 REST로 서버 정본을 다시 조회한다.
- 세부 응답·오류·이벤트 계약은 Swagger와 `docs/api.md`를 기준으로 구현한다.

### 현재 제약

- Cloud Run HTTP/1 요청 본문 한계 때문에 32MB를 넘는 영상 직접 업로드는 현재 운영 경로에서 실패할 수 있다. 기능명세의 200MB를 지원하려면 추후 GCS signed URL 직접 업로드 계약이 필요하다.
- `/uploads/...` 미디어는 현재 공개 URL이다. 민감 미디어 접근 제어가 필요해지면 별도 API 계약 변경이 필요하다.

## 2. 백엔드·AI 팀 전달사항

### 배포 구성

- GCP project: `thisabled-backend`
- region: `asia-northeast3` (서울)
- 공개 서비스: `thisabled-api`
- 비공개 서비스: `thisabled-worker`, `thisabled-safety`, `thisabled-match`
- DB: Cloud SQL PostgreSQL `thisabled-postgres`
- Redis: Upstash Redis
- 파일: Cloud Storage `thisabled-backend-uploads-356864902103`
- 비동기 실행: Cloud Tasks + Cloud Scheduler → 비공개 worker
- 컨테이너: Artifact Registry `asia-northeast3/thisabled`

SAFE·MATCH는 외부 공개하지 않고 API가 Google 발급 ID token으로 호출한다. worker 역시 공개 호출을 막고 Cloud Tasks/Scheduler 인증 호출만 받는다.

### 배포 후 확인 명령

아래 명령은 로그인된 gcloud 환경에서 실행한다.

```bash
gcloud run services describe thisabled-api \
  --project=thisabled-backend --region=asia-northeast3

curl -fsS \
  https://thisabled-api-356864902103.asia-northeast3.run.app/api/v1/health
```

정상 health 응답은 다음과 같다.

```json
{"status":"ok","db":"ok","redis":"ok"}
```

### 비밀정보 관리 규칙

- 운영 비밀값은 GCP Secret Manager 또는 Upstash 콘솔에서만 관리한다.
- `.env`, OAuth client secret, JWT secret, DB/Redis URL, OpenAI/Hugging Face token을 Git·문서·메신저·프론트 빌드 변수에 복사하지 않는다.
- Cloud Run에는 평문 비밀값 대신 Secret Manager version 참조만 설정한다.
- 비밀 유출이 의심되면 해당 공급자에서 먼저 폐기·재발급하고 Secret Manager에 새 version을 추가한 뒤 Cloud Run revision을 갱신한다.
- 콘솔 화면이나 로그를 공유할 때 query string, `Authorization`, cookie, signup/access token을 가린다.

## 3. 현재 보안·비용 방어 상태

### 적용됨

- API만 공개하고 worker·SAFE·MATCH는 IAM 인증 없이는 호출할 수 없다.
- 런타임은 전용 최소권한 서비스 계정을 사용한다.
- 사용하지 않는 기본 Compute 서비스 계정의 프로젝트 `Editor` 권한을 제거했다.
- DB는 authorized network가 없고 Cloud SQL connector로 접근한다.
- 버킷은 Uniform bucket-level access와 Public Access Prevention을 사용한다.
- 운영 비밀값은 Secret Manager 참조이며 서비스별 accessor 권한을 분리했다.
- CORS는 운영 프론트 origin 하나로 제한했다.
- API는 scale-to-zero, 요청 기반 과금, 최대 인스턴스 1개로 제한했다.
- worker·모델 서비스도 scale-to-zero와 최대 인스턴스 1개를 사용한다.
- 월 예산 70,000원과 50%·80%·100% 알림을 설정했다.
- Artifact Registry는 7일 지난 이미지를 정리하되 패키지별 최신 3개를 보존한다.
- AI 기능에는 사용자별 일/분 한도와 결과 캐시가 적용되어 있다.

### 남은 위험과 운영 판단

- GCP 예산은 **알림**이며 결제를 자동 차단하지 않는다.
- Cloud Run 최대 인스턴스는 비용 폭주를 크게 제한하지만 Google 정책상 순간적으로 초과될 수 있어 절대 상한은 아니다.
- 최대 인스턴스 1개는 비용에 유리하지만 장애·배포 중 가용성과 동시 처리량은 낮다. 실제 사용자 증가 시 2개 이상으로 올린다.
- 전역 요청 rate limit은 아직 없다. 이를 추가하면 초과 요청에 새 `429` 오류 계약이 생기므로 프론트 협의와 API 계약 승인이 선행되어야 한다.
- Cloud Armor를 붙이면 L7 DDoS/WAF 방어가 강화되지만 외부 Application Load Balancer 구성이 필요하고 고정비·운영 복잡도가 늘어난다. 현재 저비용 데모 단계에는 적용하지 않았다.
- OAuth access/signup token 및 WebSocket access token이 URL query에 실리는 현재 계약은 브라우저 기록·로그 노출 위험이 있다. 공개 서비스 전에는 일회용 code 교환 또는 안전한 쿠키 방식으로 바꾸는 것을 권장한다.

## 4. 공개 전 필수 체크리스트

- [ ] 프론트에 `/privacy` 또는 동등한 공개 개인정보처리방침 페이지 배포
- [ ] Google OAuth 동의 화면에 개인정보처리방침 URL 등록 후 Production 게시
- [ ] Kakao 실 로그인 신규·기존 회원 흐름 검증
- [ ] 32MB 초과 영상용 GCS signed URL 직접 업로드 계약 승인·구현
- [ ] 전역 429 rate limit 계약 합의
- [ ] URL query token을 일회용 code/쿠키 방식으로 교체하는 인증 계약 합의
- [ ] 실제 트래픽이 생기면 Cloud Armor 또는 CDN/WAF 비용 대비 재검토
