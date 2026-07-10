import { authedRequest, IS_MOCK } from './auth'
import type { Author } from './posts'
import { mockFriendsStore, mockBlocksStore } from './friends'

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
  accepted_at: string | null
  created_at: string
}

export interface ChatRoomPage {
  items: ChatRoom[]
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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_ME_ID = 'mock-me'

// ── Mock store ──────────────────────────────────────────────────────────
// 방마다 메시지를 오래된 순으로 저장 (실제 API 응답은 최신순이라 조회 시 뒤집는다)
const mockRoomsStore = new Map<string, ChatRoom>()
const mockMessagesStore = new Map<string, ChatMessage[]>()
// 미디어 설명/자막이 processing → done으로 전환되는 시각 (posts.ts의 mockDescriptionReadyAt과 동일한 패턴)
const mockMediaReadyAt = new Map<string, number>()
// 블러 메시지의 실제 원문 — content는 reveal 전까지 null로 내려가므로 별도 보관해두었다가 reveal 시 복원한다
const mockHiddenContent = new Map<string, string>()

function findRoomByCounterpart(userId: string): ChatRoom | undefined {
  return [...mockRoomsStore.values()].find((r) => r.counterpart.id === userId)
}

function findMessageById(messageId: string): { room: ChatRoom; message: ChatMessage } | undefined {
  for (const room of mockRoomsStore.values()) {
    const message = (mockMessagesStore.get(room.id) ?? []).find((m) => m.id === messageId)
    if (message) return { room, message }
  }
  return undefined
}

function seedIncomingRequest(id: string, nickname: string, content: string, flagged: boolean) {
  const now = new Date().toISOString()
  const room: ChatRoom = {
    id: crypto.randomUUID(),
    state: 'request',
    counterpart: { id, nickname, profile_image_url: null },
    requested_by: id,
    restricted_sender: false,
    accepted_at: null,
    created_at: now,
  }
  const messageId = crypto.randomUUID()
  if (flagged) mockHiddenContent.set(messageId, content)
  mockRoomsStore.set(room.id, room)
  mockMessagesStore.set(room.id, [
    {
      id: messageId,
      room_id: room.id,
      sender: { id, nickname, profile_image_url: null },
      mine: false,
      type: 'text',
      content: flagged ? null : content,
      blurred: flagged,
      safety_status: flagged ? 'flagged' : 'safe',
      media_url: null,
      description: null,
      description_status: 'none',
      caption: null,
      caption_status: 'none',
      created_at: now,
    },
  ])
}

// 개발 중 요청함/수락/전송 제한 해제/블러 플로우를 확인할 수 있도록 초기 상태를 시드한다
let seeded = false
function ensureSeeded() {
  if (seeded) return
  seeded = true
  seedIncomingRequest('mock-user-201', '작은우산', '안녕하세요! 대화하고 싶어서 연락드려요.', false)
  seedIncomingRequest('mock-user-202', '노란은행잎', '(주의 판정을 시뮬레이션한 블러 메시지)', true)

  // 전송 제한(SAFE-05) 배너 데모 — 달빛여행 방과 겹치지 않도록 다른 친구로 분리
  const restrictedFriend = mockFriendsStore[1]
  if (restrictedFriend?.id) {
    const now = new Date().toISOString()
    const room: ChatRoom = {
      id: crypto.randomUUID(),
      state: 'active',
      counterpart: restrictedFriend,
      requested_by: null,
      restricted_sender: true,
      accepted_at: now,
      created_at: now,
    }
    mockRoomsStore.set(room.id, room)
    mockMessagesStore.set(room.id, [])
  }

  // 채팅방 안에서 블러 처리(주의 판정)가 실제로 어떻게 보이는지 확인할 수 있도록 시드
  const blurDemoFriend = mockFriendsStore[0]
  if (blurDemoFriend?.id) {
    const now = new Date().toISOString()
    const room: ChatRoom = {
      id: crypto.randomUUID(),
      state: 'active',
      counterpart: blurDemoFriend,
      requested_by: null,
      restricted_sender: false,
      accepted_at: now,
      created_at: now,
    }
    mockRoomsStore.set(room.id, room)
    const flaggedId = crypto.randomUUID()
    mockHiddenContent.set(flaggedId, '이 근처로 한번 놀러오실래요? 주소 알려드릴게요.')
    mockMessagesStore.set(room.id, [
      {
        id: crypto.randomUUID(),
        room_id: room.id,
        sender: blurDemoFriend,
        mine: false,
        type: 'text',
        content: '오늘 날씨가 정말 좋네요!',
        blurred: false,
        safety_status: 'safe',
        media_url: null,
        description: null,
        description_status: 'none',
        caption: null,
        caption_status: 'none',
        created_at: now,
      },
      {
        id: flaggedId,
        room_id: room.id,
        sender: blurDemoFriend,
        mine: false,
        type: 'text',
        content: null,
        blurred: true,
        safety_status: 'flagged',
        media_url: null,
        description: null,
        description_status: 'none',
        caption: null,
        caption_status: 'none',
        created_at: now,
      },
    ])
  }
}

const mockChat = {
  async createOrGetRoom(userId: string): Promise<ChatRoom> {
    ensureSeeded()
    await sleep(400)
    if (userId === MOCK_ME_ID) throw { status: 400, detail: '자기 자신과는 채팅할 수 없습니다' }
    // 차단 관계·연령 보호 정책 등으로 요청이 막히는 경우는 사유를 구분하지 않고 동일한 메시지로 응답한다
    if (mockBlocksStore.some((b) => b.id === userId)) {
      throw { status: 404, detail: '요청을 보낼 수 없는 상대입니다' }
    }
    const existing = findRoomByCounterpart(userId)
    if (existing) return existing
    const now = new Date().toISOString()
    const knownFriend = mockFriendsStore.find((f) => f.id === userId)
    // 친구면 즉시 active, 친구가 아니면 request로 생성되고 내가 요청자가 된다(§1 문서 동일)
    const room: ChatRoom = knownFriend
      ? {
          id: crypto.randomUUID(),
          state: 'active',
          counterpart: knownFriend,
          requested_by: null,
          restricted_sender: false,
          accepted_at: now,
          created_at: now,
        }
      : {
          id: crypto.randomUUID(),
          state: 'request',
          counterpart: { id: userId, nickname: `상대방${userId.slice(-4)}`, profile_image_url: null },
          requested_by: MOCK_ME_ID,
          restricted_sender: false,
          accepted_at: null,
          created_at: now,
        }
    mockRoomsStore.set(room.id, room)
    mockMessagesStore.set(room.id, [])
    return room
  },
  async getRooms(): Promise<ChatRoomPage> {
    ensureSeeded()
    await sleep(400)
    const items = [...mockRoomsStore.values()]
      .filter((r) => r.state === 'active')
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { items }
  },
  async getRequests(): Promise<ChatRoomPage> {
    ensureSeeded()
    await sleep(400)
    const items = [...mockRoomsStore.values()]
      .filter((r) => r.state === 'request' && r.requested_by !== MOCK_ME_ID)
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
    return { items }
  },
  async acceptRequest(roomId: string): Promise<ChatRoom> {
    ensureSeeded()
    await sleep(400)
    const room = mockRoomsStore.get(roomId)
    if (!room || room.state !== 'request' || room.requested_by === MOCK_ME_ID) {
      throw { status: 400, detail: '수락할 수 없는 요청입니다' }
    }
    const updated: ChatRoom = { ...room, state: 'active', accepted_at: new Date().toISOString() }
    mockRoomsStore.set(roomId, updated)
    return updated
  },
  async sendMessage(roomId: string, content: string): Promise<ChatMessage> {
    ensureSeeded()
    await sleep(400)
    const room = mockRoomsStore.get(roomId)
    if (!room) throw { status: 404, detail: '존재하지 않는 채팅방입니다' }
    const list = mockMessagesStore.get(roomId) ?? []
    if (room.state === 'request' && room.requested_by === MOCK_ME_ID && list.some((m) => m.mine)) {
      throw { status: 400, detail: '요청이 수락되기 전에는 메시지를 1건만 보낼 수 있습니다' }
    }
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      room_id: roomId,
      sender: { id: MOCK_ME_ID, nickname: '나', profile_image_url: null },
      mine: true,
      type: 'text',
      content,
      blurred: false,
      safety_status: null,
      media_url: null,
      description: null,
      description_status: 'none',
      caption: null,
      caption_status: 'none',
      created_at: new Date().toISOString(),
    }
    list.push(message)
    mockMessagesStore.set(roomId, list)
    return message
  },
  async sendMedia(roomId: string, file: File, type: MessageType): Promise<ChatMessage> {
    ensureSeeded()
    await sleep(600)
    const room = mockRoomsStore.get(roomId)
    if (!room) throw { status: 404, detail: '존재하지 않는 채팅방입니다' }
    const list = mockMessagesStore.get(roomId) ?? []
    const message: ChatMessage = {
      id: crypto.randomUUID(),
      room_id: roomId,
      sender: { id: MOCK_ME_ID, nickname: '나', profile_image_url: null },
      mine: true,
      type,
      content: null,
      blurred: false,
      safety_status: 'unanalyzed',
      media_url: URL.createObjectURL(file),
      description: null,
      description_status: type === 'image' ? 'processing' : 'none',
      caption: null,
      caption_status: type === 'video' ? 'processing' : 'none',
      created_at: new Date().toISOString(),
    }
    mockMediaReadyAt.set(message.id, Date.now() + 3000)
    list.push(message)
    mockMessagesStore.set(roomId, list)
    return message
  },
  async getMessages(roomId: string, cursor: string | null, limit: number): Promise<ChatMessagePage> {
    await sleep(400)
    const stored = (mockMessagesStore.get(roomId) ?? []).map((m) => {
      const readyAt = mockMediaReadyAt.get(m.id)
      if (!readyAt || Date.now() < readyAt) return m
      mockMediaReadyAt.delete(m.id)
      return {
        ...m,
        description_status: m.description_status === 'processing' ? ('done' as const) : m.description_status,
        description: m.description_status === 'processing' ? '사진 속 풍경을 담은 이미지입니다.' : m.description,
        caption_status: m.caption_status === 'processing' ? ('done' as const) : m.caption_status,
        caption: m.caption_status === 'processing' ? [{ start: 0, end: 3, text: '영상 자막 예시입니다.' }] : m.caption,
      }
    })
    mockMessagesStore.set(roomId, stored)
    const desc = [...stored].reverse()
    const offset = cursor ? Number(cursor) : 0
    const items = desc.slice(offset, offset + limit)
    const nextOffset = offset + items.length
    return { items, next_cursor: nextOffset < desc.length ? String(nextOffset) : null }
  },
  async revealMessage(messageId: string): Promise<RevealResult> {
    ensureSeeded()
    await sleep(300)
    const found = findMessageById(messageId)
    if (!found || !found.message.blurred) {
      throw { status: 400, detail: '블러 처리된 메시지가 아닙니다' }
    }
    found.message.blurred = false
    found.message.content = mockHiddenContent.get(messageId) ?? found.message.content ?? ''
    mockHiddenContent.delete(messageId)
    return { id: found.message.id, content: found.message.content }
  },
  async releaseRestriction(senderId: string): Promise<ReleaseResult> {
    ensureSeeded()
    await sleep(300)
    const room = [...mockRoomsStore.values()].find((r) => r.counterpart.id === senderId && r.restricted_sender)
    if (!room) throw { status: 404, detail: '해제할 전송 제한이 없습니다' }
    room.restricted_sender = false
    return { released: true }
  },
}

// ── Public API ──────────────────────────────────────────────────────────

export function createOrGetRoom(userId: string): Promise<ChatRoom> {
  if (IS_MOCK) return mockChat.createOrGetRoom(userId)
  return authedRequest<ChatRoom>('/api/v1/chat/rooms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId }),
  })
}

export function getRooms(): Promise<ChatRoomPage> {
  if (IS_MOCK) return mockChat.getRooms()
  return authedRequest<ChatRoomPage>('/api/v1/chat/rooms')
}

export function getChatRequests(): Promise<ChatRoomPage> {
  if (IS_MOCK) return mockChat.getRequests()
  return authedRequest<ChatRoomPage>('/api/v1/chat/requests')
}

export function acceptChatRequest(roomId: string): Promise<ChatRoom> {
  if (IS_MOCK) return mockChat.acceptRequest(roomId)
  return authedRequest<ChatRoom>(`/api/v1/chat/requests/${roomId}/accept`, { method: 'POST' })
}

export function sendChatMessage(roomId: string, content: string): Promise<ChatMessage> {
  if (IS_MOCK) return mockChat.sendMessage(roomId, content)
  return authedRequest<ChatMessage>(`/api/v1/chat/rooms/${roomId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

// limit: 1~100(기본 30), cursor는 이전 응답의 next_cursor를 그대로 전달
export function getChatMessages(roomId: string, cursor: string | null = null, limit = 30): Promise<ChatMessagePage> {
  if (IS_MOCK) return mockChat.getMessages(roomId, cursor, limit)
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return authedRequest<ChatMessagePage>(`/api/v1/chat/rooms/${roomId}/messages?${params}`)
}

export function revealChatMessage(messageId: string): Promise<RevealResult> {
  if (IS_MOCK) return mockChat.revealMessage(messageId)
  return authedRequest<RevealResult>(`/api/v1/chat/messages/${messageId}/reveal`, { method: 'POST' })
}

// 이미지: jpeg/png/gif/webp 10MB 이하. 영상: mp4/webm/quicktime 200MB, 3분 이하(durationSeconds)
export function sendChatMedia(roomId: string, file: File, type: MessageType, durationSeconds = 0): Promise<ChatMessage> {
  if (IS_MOCK) return mockChat.sendMedia(roomId, file, type)
  const formData = new FormData()
  formData.append('file', file)
  if (type === 'video') formData.append('duration_seconds', String(durationSeconds))
  return authedRequest<ChatMessage>(`/api/v1/chat/rooms/${roomId}/media`, { method: 'POST', body: formData })
}

// 수신자만 가능 — 상대(senderId)의 SAFE-05 전송 제한 해제
export function releaseChatRestriction(senderId: string): Promise<ReleaseResult> {
  if (IS_MOCK) return mockChat.releaseRestriction(senderId)
  return authedRequest<ReleaseResult>(`/api/v1/chat/restrictions/${senderId}/release`, { method: 'POST' })
}
