import { authedRequest, tokenStorage, IS_MOCK } from './auth'
import { wsUrl } from './chatSocket'

// 백엔드 알림 종류·필드 — docs/notification-frontend-integration.md 기준(app/services/notify.py).
// type은 DB에 enum 제약이 없는 자유 문자열이라 프론트가 모르는 값도 올 수 있다 — 아래 유니언은
// 알려진 값에 대한 타입 힌트일 뿐이고, 실제 파싱(toNotificationItem)은 unknown type에 대한
// fallback을 반드시 둔다.
export interface NotificationPayloadMap {
  'friend.request': { request_id: string; sender_nickname: string }
  'friend.accepted': { request_id: string; receiver_nickname: string }
  'post.like': { post_id: string; by_nickname: string }
  'post.comment': { post_id: string; comment_id: string; by_nickname: string }
  'post.published': { post_id: string }
  'chat.request': { room_id: string; sender_nickname: string }
  'chat.flagged': { room_id: string; message_id: string; retroactive?: boolean }
  'chat.restricted': { room_id: string; sender_id: string; message: string }
  'media.caption_done': { post_id: string; media_id: string }
  'media.caption_failed': { post_id: string; media_id: string }
  'media.description_done': { post_id: string; media_id: string }
  'media.description_failed': { post_id: string; media_id: string }
}

export type NotificationType = keyof NotificationPayloadMap

// 알려지지 않은 type 문자열도 서버가 보낼 수 있으므로 payload는 string으로 넓혀 안전하게 받는다.
export interface NotificationRecord {
  id: string
  type: NotificationType | (string & {})
  payload: Record<string, unknown>
  read_at: string | null
  created_at: string
}

export interface NotificationsPage {
  items: NotificationRecord[]
}

export interface NotificationSocketHandle {
  close: () => void
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function makeRecord<T extends NotificationType>(type: T, payload: NotificationPayloadMap[T], createdAt: string, readAt: string | null): NotificationRecord {
  return { id: crypto.randomUUID(), type, payload, read_at: readAt, created_at: createdAt }
}

const now = Date.now()
const minutesAgo = (minutes: number) => new Date(now - minutes * 60000).toISOString()

const mockStore: NotificationRecord[] = [
  makeRecord('media.caption_done', { post_id: 'mock-post-caption', media_id: 'mock-media-1' }, minutesAgo(2), null),
  makeRecord('chat.request', { room_id: 'mock-room-1', sender_nickname: '작은우산' }, minutesAgo(5), null),
  makeRecord('friend.request', { request_id: 'mock-request-1', sender_nickname: '노란은행잎' }, minutesAgo(9), null),
  makeRecord('post.comment', { post_id: 'mock-post-comment', comment_id: 'mock-comment-1', by_nickname: '봄바람' }, minutesAgo(40), minutesAgo(35)),
  makeRecord('media.caption_failed', { post_id: 'mock-post-fail', media_id: 'mock-media-2' }, minutesAgo(65), minutesAgo(60)),
  makeRecord('friend.accepted', { request_id: 'mock-request-2', receiver_nickname: '하늘산책' }, minutesAgo(130), minutesAgo(120)),
  makeRecord('post.like', { post_id: 'mock-post-like', by_nickname: '초록잎' }, minutesAgo(200), minutesAgo(190)),
  makeRecord('chat.flagged', { room_id: 'mock-room-2', message_id: 'mock-message-1' }, minutesAgo(1500), minutesAgo(1400)),
]

const mockNotifications = {
  async getNotifications(): Promise<NotificationsPage> {
    await sleep(400)
    return { items: [...mockStore].sort((a, b) => b.created_at.localeCompare(a.created_at)) }
  },
  async markRead(ids: string[]): Promise<void> {
    await sleep(200)
    for (const item of mockStore) {
      if (ids.includes(item.id) && item.read_at === null) item.read_at = new Date().toISOString()
    }
  },
  // 실제 백엔드가 없는 mock 모드에서도 "실시간으로 알림이 도착하는" 흐름을 보여주기 위한 시뮬레이션 —
  // 몇 초 뒤 새 친구 요청 알림 하나가 도착한 것처럼 store에 추가하고 그대로 반환한다.
  pushSimulated(): NotificationRecord {
    const record = makeRecord('friend.request', { request_id: crypto.randomUUID(), sender_nickname: '달빛여행' }, new Date().toISOString(), null)
    mockStore.unshift(record)
    return record
  },
}

// limit: 1~100(기본 50). cursor 파라미터는 백엔드에 구현되어 있지 않아(무시됨) 보내지 않는다.
export function getNotifications(limit = 50): Promise<NotificationsPage> {
  if (IS_MOCK) return mockNotifications.getNotifications()
  const params = new URLSearchParams({ limit: String(limit) })
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

// WS /api/v1/ws?token= 프레임은 최상위 type이 notification/chat.message/chat.read 3종뿐이며,
// notification일 때만 payload.type으로 알림 종류를 2차 분기한다. WS 프레임에는 REST의
// id/read_at/created_at이 없으므로 여기서 새로 채워 넣는다(목록은 여전히 REST로 재조회).
export function connectNotificationSocket(onEvent: (record: NotificationRecord) => void, onAuthExpired?: () => void): NotificationSocketHandle {
  if (IS_MOCK) {
    const timer = setTimeout(() => onEvent(mockNotifications.pushSimulated()), 6000)
    return { close: () => clearTimeout(timer) }
  }

  const token = tokenStorage.get()
  const ws = new WebSocket(`${wsUrl()}/api/v1/ws?token=${encodeURIComponent(token ?? '')}`)

  ws.onmessage = (e) => {
    try {
      const frame = JSON.parse(e.data) as { type: string; payload?: Record<string, unknown> }
      if (frame.type !== 'notification' || !frame.payload) return
      const { type, ...payload } = frame.payload
      if (typeof type !== 'string') return
      onEvent(makeRecord(type as NotificationType, payload as NotificationPayloadMap[NotificationType], new Date().toISOString(), null))
    } catch {
      // 알 수 없는 프레임은 무시
    }
  }
  ws.onclose = (e) => {
    if (e.code === 4401) onAuthExpired?.()
  }

  return { close: () => ws.close() }
}
