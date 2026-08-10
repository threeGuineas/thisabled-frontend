import { authedRequest, tokenStorage, IS_MOCK } from './auth'
import { wsUrl } from './chatSocket'

// 백엔드 알림 종류(§16) — friend/chat은 friend-frontend-guide.md·chat-frontend-guide.md,
// media는 caption-frontend-integration.md에 명시. post.liked/post.commented는 좋아요·댓글 시
// "작성자에게 알림이 간다"고만 문서화돼 있고 정확한 type 문자열은 명세에 없어 동일 컨벤션으로 추정한 것.
export interface NotificationPayloadMap {
  'friend.request': { request_id: string; sender_nickname: string }
  'friend.accepted': { request_id: string; receiver_nickname: string }
  'chat.request': { room_id: string; sender_nickname: string }
  'chat.flagged': { room_id: string; message_id: string; retroactive?: boolean }
  'chat.restricted': { room_id: string; sender_id: string; message: string }
  'media.caption_done': { post_id: string; media_id: string }
  'media.caption_failed': { post_id: string; media_id: string }
  'post.liked': { post_id: string; liker_nickname: string }
  'post.commented': { post_id: string; commenter_nickname: string }
}

export type NotificationType = keyof NotificationPayloadMap

export type NotificationRecord = {
  [K in NotificationType]: {
    id: string
    type: K
    payload: NotificationPayloadMap[K]
    is_read: boolean
    created_at: string
  }
}[NotificationType]

export interface NotificationsPage {
  items: NotificationRecord[]
  next_cursor: string | null
}

export interface NotificationSocketHandle {
  close: () => void
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function makeRecord<T extends NotificationType>(type: T, payload: NotificationPayloadMap[T], createdAt: string, isRead: boolean): NotificationRecord {
  return { id: crypto.randomUUID(), type, payload, is_read: isRead, created_at: createdAt } as NotificationRecord
}

const now = Date.now()
const minutesAgo = (minutes: number) => new Date(now - minutes * 60000).toISOString()

const mockStore: NotificationRecord[] = [
  makeRecord('media.caption_done', { post_id: 'mock-post-caption', media_id: 'mock-media-1' }, minutesAgo(2), false),
  makeRecord('chat.request', { room_id: 'mock-room-1', sender_nickname: '작은우산' }, minutesAgo(5), false),
  makeRecord('friend.request', { request_id: 'mock-request-1', sender_nickname: '노란은행잎' }, minutesAgo(9), false),
  makeRecord('post.commented', { post_id: 'mock-post-comment', commenter_nickname: '봄바람' }, minutesAgo(40), true),
  makeRecord('media.caption_failed', { post_id: 'mock-post-fail', media_id: 'mock-media-2' }, minutesAgo(65), true),
  makeRecord('friend.accepted', { request_id: 'mock-request-2', receiver_nickname: '하늘산책' }, minutesAgo(130), true),
  makeRecord('post.liked', { post_id: 'mock-post-like', liker_nickname: '초록잎' }, minutesAgo(200), true),
  makeRecord('chat.flagged', { room_id: 'mock-room-2', message_id: 'mock-message-1' }, minutesAgo(1500), true),
]

const mockNotifications = {
  async getNotifications(): Promise<NotificationsPage> {
    await sleep(400)
    return { items: [...mockStore].sort((a, b) => b.created_at.localeCompare(a.created_at)), next_cursor: null }
  },
  async markRead(ids: string[]): Promise<void> {
    await sleep(200)
    for (const item of mockStore) {
      if (ids.includes(item.id)) item.is_read = true
    }
  },
  // 실제 백엔드가 없는 mock 모드에서도 "실시간으로 알림이 도착하는" 흐름을 보여주기 위한 시뮬레이션 —
  // 몇 초 뒤 새 친구 요청 알림 하나가 도착한 것처럼 store에 추가하고 그대로 반환한다.
  pushSimulated(): NotificationRecord {
    const record = makeRecord('friend.request', { request_id: crypto.randomUUID(), sender_nickname: '달빛여행' }, new Date().toISOString(), false)
    mockStore.unshift(record)
    return record
  },
}

export function getNotifications(cursor: string | null = null, limit = 30): Promise<NotificationsPage> {
  if (IS_MOCK) return mockNotifications.getNotifications()
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return authedRequest<NotificationsPage>(`/api/v1/notifications?${params}`)
}

export function markNotificationsRead(ids: string[]): Promise<void> {
  if (IS_MOCK) return mockNotifications.markRead(ids)
  return authedRequest<void>('/api/v1/notifications/read', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids }),
  })
}

// WS /api/v1/ws?token= 은 채팅과 동일한 커넥션에서 `{type:"notification", payload:{type, ...}}` 프레임으로 온다(§16).
export function connectNotificationSocket(onEvent: (record: NotificationRecord) => void, onAuthExpired?: () => void): NotificationSocketHandle {
  if (IS_MOCK) {
    const timer = setTimeout(() => onEvent(mockNotifications.pushSimulated()), 6000)
    return { close: () => clearTimeout(timer) }
  }

  const token = tokenStorage.get()
  const ws = new WebSocket(`${wsUrl()}/api/v1/ws?token=${encodeURIComponent(token ?? '')}`)

  ws.onmessage = (e) => {
    try {
      const frame = JSON.parse(e.data) as { type: string; payload?: { type: NotificationType } & Record<string, unknown> }
      if (frame.type !== 'notification' || !frame.payload) return
      const { type, ...payload } = frame.payload
      onEvent(makeRecord(type, payload as NotificationPayloadMap[typeof type], new Date().toISOString(), false))
    } catch {
      // 알 수 없는 프레임은 무시
    }
  }
  ws.onclose = (e) => {
    if (e.code === 4401) onAuthExpired?.()
  }

  return { close: () => ws.close() }
}
