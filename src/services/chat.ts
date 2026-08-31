import { authedRequest } from './auth'
import type { Author } from './posts'

export type RoomState = 'request' | 'active'
export type MessageType = 'text' | 'image' | 'video'
export type SafetyStatus = 'pending' | 'safe' | 'flagged' | 'unanalyzed' | null
export type AsyncMediaStatus = 'none' | 'processing' | 'done' | 'failed'

export interface ChatRoom {
  id: string
  state: RoomState
  counterpart: Author
  requested_by: string | null
  restricted_sender: boolean
  unread_count: number
  accepted_at: string | null
  created_at: string
  // 방의 마지막 메시지 시각(없으면 room.created_at) — 채팅 목록 정렬·시간 표시에 사용
  last_activity_at: string
}

export interface ChatRoomPage {
  items: ChatRoom[]
  unread_total: number
}

export interface ChatMessage {
  id: string
  room_id: string
  sender: Author
  mine: boolean
  type: MessageType
  content: string | null
  blurred: boolean
  safety_status: SafetyStatus
  media_url: string | null
  description: string | null
  description_status: AsyncMediaStatus
  caption: unknown[] | null
  caption_status: AsyncMediaStatus
  // mine:true 메시지에서만 의미 있음 — 상대의 마지막 읽음 메시지에만 true (그 이전 메시지는 false)
  is_read: boolean
  created_at: string
}

export interface ChatMessagePage {
  items: ChatMessage[]
  next_cursor: string | null
}

export interface RevealResult {
  id: string
  content: string
}

export interface ReleaseResult {
  released: boolean
}

// ── Public API ──────────────────────────────────────────────────────────

export function createOrGetRoom(userId: string): Promise<ChatRoom> {
  return authedRequest<ChatRoom>('/api/v1/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
}

export function getRooms(): Promise<ChatRoomPage> {
  return authedRequest<ChatRoomPage>('/api/v1/chat/rooms')
}

export function getChatRequests(): Promise<ChatRoomPage> {
  return authedRequest<ChatRoomPage>('/api/v1/chat/requests')
}

export function acceptChatRequest(roomId: string): Promise<ChatRoom> {
  return authedRequest<ChatRoom>(`/api/v1/chat/requests/${roomId}/accept`, { method: 'POST' })
}

export function sendChatMessage(roomId: string, content: string): Promise<ChatMessage> {
  return authedRequest<ChatMessage>(`/api/v1/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

// limit: 1~100(기본 30), cursor는 이전 응답의 next_cursor를 그대로 전달
export function getChatMessages(roomId: string, cursor: string | null = null, limit = 30): Promise<ChatMessagePage> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return authedRequest<ChatMessagePage>(`/api/v1/chat/rooms/${roomId}/messages?${params}`)
}

export function revealChatMessage(messageId: string): Promise<RevealResult> {
  return authedRequest<RevealResult>(`/api/v1/chat/messages/${messageId}/reveal`, { method: 'POST' })
}

// 이미지: jpeg/png/gif/webp 10MB 이하. 영상: mp4/webm/quicktime 200MB, 3분 이하(durationSeconds)
export function sendChatMedia(roomId: string, file: File, type: MessageType, durationSeconds = 0): Promise<ChatMessage> {
  const formData = new FormData()
  formData.append('file', file)
  if (type === 'video') formData.append('duration_seconds', String(durationSeconds))
  return authedRequest<ChatMessage>(`/api/v1/chat/rooms/${roomId}/media`, { method: 'POST', body: formData })
}

// 수신자만 가능 — 상대(senderId)의 SAFE-05 전송 제한 해제
export function releaseChatRestriction(senderId: string): Promise<ReleaseResult> {
  return authedRequest<ReleaseResult>(`/api/v1/chat/restrictions/${senderId}/release`, { method: 'POST' })
}
