import { tokenStorage } from './auth'

export type ChatSocketEvent =
  | { type: 'chat.message'; payload: { room_id: string; message_id: string } }
  | { type: 'chat.read'; payload: { room_id: string; message_id: string } }
  | { type: 'notification'; payload: { type: 'chat.request'; room_id: string; sender_nickname: string } }
  | { type: 'notification'; payload: { type: 'chat.flagged'; room_id: string; message_id: string; retroactive?: boolean } }
  | { type: 'notification'; payload: { type: 'chat.restricted'; room_id: string; sender_id: string; message: string } }

export interface ChatSocketHandle {
  close: () => void
}

// dev: vite proxy가 /api를 ws:true로 백엔드에 전달하므로 현재 origin 기준 상대 경로 사용.
// prod: 정적 빌드엔 프록시가 없으므로 백엔드 주소를 ws(s)://로 변환해 직접 연결.
export function wsUrl(): string {
  if (import.meta.env.PROD) {
    const backend = import.meta.env.VITE_BACKEND_URL as string
    return backend.replace(/^http/, 'ws')
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${protocol}//${window.location.host}`
}

// 액세스 토큰이 유효하지 않으면 서버가 연결을 수락한 뒤 close code 4401로 끊는다.
export function connectChatSocket(onEvent: (event: ChatSocketEvent) => void, onAuthExpired?: () => void): ChatSocketHandle {
  const token = tokenStorage.get()
  const ws = new WebSocket(`${wsUrl()}/api/v1/ws?token=${encodeURIComponent(token ?? '')}`)

  ws.onmessage = (e) => {
    try {
      onEvent(JSON.parse(e.data) as ChatSocketEvent)
    } catch {
      // 알 수 없는 프레임은 무시
    }
  }
  ws.onclose = (e) => {
    if (e.code === 4401) onAuthExpired?.()
  }

  return { close: () => ws.close() }
}
