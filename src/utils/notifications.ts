import chatIcon from '../assets/images/chat.svg'
import checkIcon from '../assets/images/check-b.svg'
import errorIcon from '../assets/images/error.svg'
import friendIcon from '../assets/images/friend.svg'
import heartBIcon from '../assets/images/heart.svg'
import type { NotificationRecord } from '../services/notifications'
import type { Tab } from '../components/BottomNav'

export interface NotificationTarget {
  tab: Tab
  postId?: string
}

export interface NotificationItem {
  id: string
  message: string
  detail: string
  icon: string
  iconBg: string
  isRead: boolean
  createdAt: string
  target: NotificationTarget
}

const CHECK_BG = '#28C76F'
const ERROR_BG = '#FDEBEB'
const DEFAULT_BG = '#C2DCFF'

// payload는 type마다 필드 구성이 달라 자유 형식(Record<string, unknown>)으로 오므로,
// 문자열이 아닌 값이 섞여 있어도 크래시하지 않도록 항상 이 헬퍼를 거쳐 접근한다.
const str = (v: unknown): string => (typeof v === 'string' ? v : '')

export function toNotificationItem(record: NotificationRecord): NotificationItem {
  const base = { id: record.id, isRead: record.read_at !== null, createdAt: record.created_at }
  const payload = record.payload ?? {}

  switch (record.type) {
    case 'friend.request':
      return {
        ...base,
        message: '친구 요청',
        detail: `${str(payload.sender_nickname)}님이 친구 요청을 보냈어요.`,
        icon: friendIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'friend' },
      }
    case 'friend.accepted':
      return {
        ...base,
        message: '친구 요청 수락',
        detail: `${str(payload.receiver_nickname)}님이 친구 요청을 수락했어요.`,
        icon: friendIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'friend' },
      }
    case 'chat.request':
      return {
        ...base,
        message: '메시지 요청 도착',
        detail: `${str(payload.sender_nickname)}님이 메시지를 보냈어요.`,
        icon: chatIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'chat' },
      }
    case 'chat.flagged':
      return {
        ...base,
        message: '주의 메시지 도착',
        detail: '받은 메시지에 주의가 필요해서 블러 처리됐어요.',
        icon: errorIcon,
        iconBg: ERROR_BG,
        target: { tab: 'chat' },
      }
    case 'chat.restricted':
      return {
        ...base,
        message: '전송 제한 안내',
        detail: str(payload.message) || '위험 가능성이 있는 메시지가 반복되어 전송을 제한했어요',
        icon: errorIcon,
        iconBg: ERROR_BG,
        target: { tab: 'chat' },
      }
    case 'media.caption_done':
      return {
        ...base,
        message: '영상 자막 생성 완료',
        detail: '요청하신 영상의 자막 생성이 완료됐어요.',
        icon: checkIcon,
        iconBg: CHECK_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    case 'media.caption_failed':
      return {
        ...base,
        message: '영상 자막 생성 실패',
        detail: '영상 자막 생성에 실패했어요. 다시 시도해주세요.',
        icon: errorIcon,
        iconBg: ERROR_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    // 코드상 상수만 정의돼 있고 아직 notify()에 연결되지 않아 실전에서는 오지 않지만, 대비해서 분기해둔다.
    case 'media.description_done':
      return {
        ...base,
        message: '사진 설명 생성 완료',
        detail: '요청하신 사진의 설명 생성이 완료됐어요.',
        icon: checkIcon,
        iconBg: CHECK_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    case 'media.description_failed':
      return {
        ...base,
        message: '사진 설명 생성 실패',
        detail: '사진 설명 생성에 실패했어요. 다시 시도해주세요.',
        icon: errorIcon,
        iconBg: ERROR_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    case 'post.like':
      return {
        ...base,
        message: '공감 알림',
        detail: `${str(payload.by_nickname)}님이 회원님의 게시글에 공감했어요.`,
        icon: heartBIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    case 'post.comment':
      return {
        ...base,
        message: '댓글 알림',
        detail: `${str(payload.by_nickname)}님이 새 댓글을 남겼어요.`,
        icon: chatIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    case 'post.published':
      return {
        ...base,
        message: '게시글 등록 완료',
        detail: '게시글이 정상적으로 등록됐어요.',
        icon: checkIcon,
        iconBg: CHECK_BG,
        target: { tab: 'home', postId: str(payload.post_id) || undefined },
      }
    default:
      // type은 DB에 enum 제약이 없는 자유 문자열 — 프론트가 모르는 값이 와도 깨지지 않게 fallback.
      return {
        ...base,
        message: '새 알림',
        detail: '새로운 알림이 도착했어요.',
        icon: checkIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'home' },
      }
  }
}
