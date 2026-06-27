# 음성 인식 (STT) API 가이드

> OpenAI Whisper 기반 음성 → 텍스트 전사  
> 관련 명세: F02_S05 (음성 댓글 / 자막)

---

## 개요

오디오 파일을 서버에 전송하면 한국어 텍스트로 변환해 반환합니다.  
내부적으로 OpenAI **Whisper** 모델을 사용합니다.

**현재 방식:** 녹음 파일 업로드 → 텍스트 반환 (파일 업로드 방식)  
**S2 예정:** WebSocket 실시간 스트리밍 방식 추가

---

## 엔드포인트

### `POST /api/v1/stt/transcribe`

| 항목 | 내용 |
|------|------|
| 인증 | 필요 (`Authorization: Bearer <token>`) |
| 요청 형식 | `multipart/form-data` |
| 응답 형식 | `application/json` |

### 지원 파일 형식

| MIME 타입 | 확장자 |
|-----------|--------|
| `audio/mpeg` | `.mp3` |
| `audio/mp3` | `.mp3` |
| `audio/wav`, `audio/x-wav` | `.wav` |
| `audio/webm` | `.webm` |
| `audio/mp4` | `.mp4` |
| `audio/m4a`, `audio/x-m4a` | `.m4a` |
| `audio/ogg` | `.ogg` |

**최대 파일 크기:** 25MB

---

## 요청

Form 필드 `file`에 오디오 파일을 첨부합니다.

```http
POST /api/v1/stt/transcribe
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <오디오 파일>
```

---

## 응답

### 성공 `200`

```json
{
  "text": "안녕하세요 오늘 날씨가 좋네요",
  "duration_ms": 2456
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `text` | string | 전사된 한국어 텍스트 |
| `duration_ms` | int | 전사 소요 시간(ms) |

빈 오디오거나 무음인 경우 `text`는 빈 문자열(`""`)이 반환될 수 있습니다.

### 에러

| 코드 | 원인 | `detail` 예시 |
|------|------|----------------|
| `401` | 인증 토큰 없음/만료 | `"Not authenticated"` |
| `413` | 파일 25MB 초과 | `"오디오가 25 MB 제한을 초과합니다"` |
| `415` | 지원하지 않는 파일 형식 | `"지원 형식: audio/mp3, audio/ogg, ..."` |

---

## 사용 예시

### JavaScript (Web)

```typescript
async function transcribeAudio(file: File, accessToken: string): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/v1/stt/transcribe', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      // Content-Type은 FormData 사용 시 직접 설정하지 마세요
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail);
  }

  const { text } = await res.json();
  return text;
}
```

### 마이크 녹음 후 바로 전송 (MediaRecorder)

```typescript
let mediaRecorder: MediaRecorder;
let chunks: Blob[] = [];

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

  mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
  mediaRecorder.onstop = async () => {
    const audioBlob = new Blob(chunks, { type: 'audio/webm' });
    const file = new File([audioBlob], 'voice.webm', { type: 'audio/webm' });

    const text = await transcribeAudio(file, accessToken);
    console.log('전사 결과:', text);
    chunks = [];
  };

  mediaRecorder.start();
}

function stopRecording() {
  mediaRecorder.stop();
}
```

### curl

```bash
curl -X POST http://localhost:8000/api/v1/stt/transcribe \
  -H "Authorization: Bearer <access_token>" \
  -F "file=@recording.mp3"
```

---

## 주요 활용 시나리오

| 모드 | 활용 |
|------|------|
| 시각장애 (`visual`) | 마이크로 음성 댓글 녹음 → 텍스트 변환 후 게시글/댓글 작성 |
| 청각장애 (`hearing`) | 상대방 발화 → 자막 표시 (S2에서 실시간 업그레이드 예정) |

---

## 주의사항

- **언어 고정:** 서버에서 `language="ko"`로 고정 전송합니다. 다른 언어 지원이 필요하면 백엔드에 요청하세요.
- **캐싱 없음:** 음성 댓글은 매번 고유 오디오이므로 캐시를 적용하지 않습니다.
- **OPENAI_API_KEY 필수:** 서버에 키가 설정되지 않으면 `500` 에러가 발생합니다. 로컬 개발 시 `.env`에 키를 추가해야 합니다.
- **실시간 스트리밍 미지원:** 현재는 파일 업로드 후 결과를 반환하는 방식입니다. 실시간 자막이 필요한 경우 S2 WebSocket 구현 이후에 가능합니다.
