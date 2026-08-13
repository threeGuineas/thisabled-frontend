import { authedRequest, IS_MOCK } from './auth'

// AI 소통 코치(COMM-01~04) — 전 UI 모드에서 사용 가능하며 발달장애 모드에서 기본 노출된다.
// 4개 기능 모두 버튼을 직접 눌렀을 때만 호출한다(COMM-05, 자동 분석 금지).
// 실제 백엔드: docs/comm-frontend-integration.md 참고 (요청/응답 스키마, 422/404 조건 등)

// 백엔드가 text를 1~2000자로 제한한다(비어있거나 초과 시 422) — 호출부에서 이 상수로 미리 검증할 것
export const MAX_COMM_TEXT_LENGTH = 2000

export interface SimplifyResult {
  result: string
  original: string
}

export interface SuggestionsResult {
  suggestions: string[]
}

export interface HintsResult {
  hints: string[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const mockComm = {
  async simplify(text: string): Promise<SimplifyResult> {
    await sleep(500)
    const sentences = text.split(/(?<=[.!?。])\s*/).filter(Boolean)
    const result = sentences.length > 0
      ? sentences.map((s) => s.trim().replace(/[,、]/g, '').slice(0, 24)).join(' ')
      : text
    return { result: `${result} (쉬운 문장 예시입니다)`, original: text }
  },
  async complete(text: string): Promise<SuggestionsResult> {
    await sleep(500)
    return {
      suggestions: [
        `${text} 함께 해요.`,
        `${text} 어떻게 생각하세요?`,
      ],
    }
  },
  async replies(): Promise<SuggestionsResult> {
    await sleep(500)
    return { suggestions: ['네, 좋아요!', '조금 더 생각해볼게요.', '저도 반가워요.'] }
  },
  async hints(): Promise<HintsResult> {
    await sleep(500)
    return { hints: ['먼저 인사로 시작해 보세요', '궁금한 점을 물어봐도 좋아요', '부담되면 거절해도 괜찮아요'] }
  },
}

// 백엔드 422(text 1~2000자)를 무의미한 왕복 없이 미리 걸러낸다 — 실패 시 authedRequest와 동일한 {status, detail} 형태로 던진다
function assertValidCommText(text: string): void {
  if (!text.trim()) throw { status: 422, detail: '내용을 입력해주세요.' }
  if (text.length > MAX_COMM_TEXT_LENGTH) throw { status: 422, detail: `${MAX_COMM_TEXT_LENGTH}자를 넘을 수 없어요.` }
}

// COMM-01: 긴 게시물/복잡한 문장을 쉬운 문장으로 변환.
// 입력은 이미 작성된 게시물 본문(사용자가 직접 줄일 수 없음)이므로, 길이 초과 시 에러 대신 잘라서 보낸다.
export function simplifyText(text: string): Promise<SimplifyResult> {
  const trimmed = text.length > MAX_COMM_TEXT_LENGTH ? text.slice(0, MAX_COMM_TEXT_LENGTH) : text
  if (!trimmed.trim()) throw { status: 422, detail: '변환할 내용이 없어요.' }
  if (IS_MOCK) return mockComm.simplify(trimmed)
  return authedRequest<SimplifyResult>('/api/v1/comm/simplify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: trimmed }),
  })
}

// COMM-02: 쓰다 만 문장의 완성본 후보 제안 — 서버가 자동으로 입력창에 채우거나 게시하지 않는다
export function completeText(text: string): Promise<SuggestionsResult> {
  assertValidCommText(text)
  if (IS_MOCK) return mockComm.complete(text)
  return authedRequest<SuggestionsResult>('/api/v1/comm/complete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
}

// COMM-03: 1:1 채팅 답장 후보 제안 (채팅방 참여자만 호출 가능)
export function getReplySuggestions(roomId: string): Promise<SuggestionsResult> {
  if (IS_MOCK) return mockComm.replies()
  return authedRequest<SuggestionsResult>('/api/v1/comm/replies', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId }),
  })
}

// COMM-04: 현재 대화 맥락 기반 인사·질문·거절 등 소통 힌트 (상대 의도를 단정하지 않는 제안형 문구)
export function getConversationHints(roomId: string): Promise<HintsResult> {
  if (IS_MOCK) return mockComm.hints()
  return authedRequest<HintsResult>('/api/v1/comm/hints', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_id: roomId }),
  })
}
