<div align="center">

<img src="src/assets/images/logo.svg" width="160" alt="ThisAbled logo" />

# ThisAbled — Frontend

**장애 유형별로 UI가 달라지는 적응형(adaptive) 소셜 커뮤니티 플랫폼**

<p>
  <img alt="React" src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-6-3178C6?logo=typescript&logoColor=white" />
  <img alt="Vite" src="https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white" />
  <img alt="Tailwind CSS" src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white" />
  <img alt="Zustand" src="https://img.shields.io/badge/Zustand-5-000000" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-5A0FC8?logo=pwa&logoColor=white" />
</p>

</div>

---

## 서비스 소개

ThisAbled는 **시각장애 · 청각장애 · 발달장애** 당사자와 비장애인이 함께 사용하는 커뮤니티 서비스입니다.
회원가입 시 선택한 이용 모드(`ui_mode`)에 따라 **같은 기능을 서로 다른 화면 구성으로 제공**하는 것이 핵심입니다.

| 모드 | 대상 | 화면 설계 방향 |
| --- | --- | --- |
| `visual` (blind) | 시각장애 | 스크린리더 우선, 큰 터치 영역, 음성 입력, 강한 대비·햅틱 피드백 |
| `hearing` | 청각장애 | 영상 자막 자동 재생, 시각적 알림, 텍스트 중심 안내 |
| `developmental` | 발달장애 | 쉬운 말·아이콘 위주, 단계 축소, 명확한 피드백 |
| `default` | 비장애인 | 일반적인 소셜 피드 UI |

### 주요 기능

- **적응형 UI** — 하나의 앱에서 모드별 화면 세트(`screens/blind`, `screens/hearing`, `screens/developmental`, `screens/default`)를 분리 구현
- **소셜 피드** — 글/사진/영상 게시, 좋아요, 댓글, 관심 태그 기반 추천
- **영상 + 자동 자막** — 업로드 영상의 자막(VTT)을 서버가 생성, `VideoCaptionPlayer`로 재생
- **실시간 채팅 / DM** — WebSocket 기반 채팅방, 친구 요청·수락
- **음성 입력** — `useVoiceInput` 훅으로 글쓰기·검색을 음성으로
- **접근성 유틸** — 햅틱(`utils/haptics`), 대비/포커스 처리(`utils/accessibility`)
- **알림** — 인앱 배너 + 상세 화면, 청각 모드 시각 알림
- **카카오 소셜 로그인** 및 만 14세·약관 동의 검증 온보딩
- **PWA** — 설치형 웹앱, 오프라인 셸

---

## 화면

`src/screens/` 아래에 인증 공통 화면과 4개 모드별 화면 세트가 있습니다.

### 공통 · 인증 (`screens/auth`)

| 화면 | 설명 |
| --- | --- |
| `OnboardingScreen` | 이용 모드 선택 |
| `LoginScreen` | 로그인 / 카카오 로그인 진입 |
| `KakaoSignupScreen` | 카카오 신규 가입(닉네임·생년월일·약관) |
| `InterestTagsScreen` | 관심 태그 선택(최대 10개) |
| `NotificationDetailScreen` | 알림 상세 |

### 모드별 화면 (`blind` / `hearing` / `developmental` / `default`)

각 모드는 아래 화면을 모드 특성에 맞게 구현합니다. (모드에 따라 일부만 존재)

| 화면 | 설명 |
| --- | --- |
| `HomeScreen` | 피드 홈 |
| `WriteScreen` | 글/사진/영상 작성 |
| `PostDetailScreen` | 게시글 상세 |
| `CommentsScreen` | 댓글 |
| `ChatScreen` | 채팅 목록 |
| `ChatRoomScreen` | 1:1 채팅방 |
| `FriendScreen` | 친구 목록·요청 |
| `MyScreen` | 마이페이지 · 모드 전환 · 로그아웃 |

> 개발 모드에서는 우측 `DEV` 버튼으로 `TestScreen`에 진입해 각 화면으로 바로 이동할 수 있습니다.

---

## 시작하기

### 요구 사항

- Node.js 20+
- npm

### 설치 & 실행

```bash
git clone https://github.com/threeGuineas/thisabled-frontend.git
cd thisabled-frontend
npm install
npm run dev
```

개발 서버는 `vite-plugin-mkcert`로 **HTTPS**로 뜹니다(카카오 로그인·PWA·음성 API 요구사항). 접속 주소는 터미널 출력을 확인하세요.

### 환경 변수

`.env.example`를 복사해 `.env.development` / `.env.production` 을 만듭니다. (실제 env 파일은 gitignore 대상)

```bash
cp .env.example .env.development
```

| 변수 | 설명 | 예시 |
| --- | --- | --- |
| `VITE_BACKEND_URL` | 백엔드 API 주소. dev는 Vite proxy(`/api`, `/uploads`)의 target, prod는 fetch base URL | `https://api.example.com` |
| `VITE_MOCK_API` | `true`면 백엔드 없이 목(mock) 데이터로 동작 | `false` |

- **dev**: `/api` 요청은 Vite dev server가 `VITE_BACKEND_URL`로 프록시 (CORS 우회, WebSocket 포함)
- **prod**: 정적 빌드에는 프록시가 없으므로 `VITE_BACKEND_URL`을 직접 호출
- 목 모드는 브라우저 콘솔에서 `localStorage.setItem('mock_api','true')` 로도 토글 가능

---

## 스크립트

| 명령 | 설명 |
| --- | --- |
| `npm run dev` | Vite 개발 서버(HMR, HTTPS, API 프록시) |
| `npm run build` | 타입 체크(`tsc -b`) 후 프로덕션 번들 빌드 → `dist/` |
| `npm run preview` | 빌드 결과를 로컬에서 정적 서빙 |
| `npm run lint` | ESLint 검사 |

---

## 기술 스택

| 영역 | 사용 기술 |
| --- | --- |
| UI | React 19, TypeScript 6 |
| 빌드 | Vite 8, `@vitejs/plugin-react` |
| 스타일 | Tailwind CSS 4 (`@tailwindcss/vite`) |
| 상태 관리 | Zustand 5 |
| PWA | `vite-plugin-pwa` |
| 로컬 HTTPS | `vite-plugin-mkcert` |
| 실시간 | 네이티브 WebSocket (`services/chatSocket.ts`) |
| 테스트/스냅샷 | Playwright |
| 린트 | ESLint 10, `typescript-eslint`, react-hooks / react-refresh 플러그인 |

### 폴더 구조

```
src/
├── screens/        # auth + 모드별(blind·hearing·developmental·default) 화면
├── components/     # 공용 컴포넌트 (BottomNav, Toast, VideoCaptionPlayer, ErrorBoundary ...)
├── hooks/          # useVoiceInput, useNotifications, useVideoPost, useAiNotice ...
├── services/       # API 클라이언트 (auth, posts, chat, friends, media, notifications ...)
├── utils/          # accessibility, haptics, vtt, category, tags, avatar ...
├── styles/         # colors, typography 토큰
├── App.tsx         # 화면 전환 라우팅 (모드에 따라 홈 결정)
└── main.tsx        # 엔트리 + ErrorBoundary
```

---

## 웹 배포

**Vercel**로 배포합니다. (SPA 정적 호스팅)

| 설정 | 값 |
| --- | --- |
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| 환경 변수 | `VITE_BACKEND_URL`, `VITE_MOCK_API` (Production/Preview 각각 설정) |

배포 절차:

```bash
npm i -g vercel
vercel            # 프리뷰 배포
vercel --prod     # 프로덕션 배포
```

- `main` 브랜치에 push하면 Vercel이 자동으로 프로덕션 빌드/배포합니다.
- SPA이므로 모든 경로를 `index.html`로 fallback하도록 rewrite가 필요합니다. (Vercel Vite 프리셋 기본 처리)
- 백엔드는 별도 서버에서 운영되며, 프론트는 `VITE_BACKEND_URL`을 통해 API를 호출합니다.
