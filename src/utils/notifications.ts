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

export function toNotificationItem(record: NotificationRecord): NotificationItem {
  const base = { id: record.id, isRead: record.is_read, createdAt: record.created_at }

  switch (record.type) {
    case 'friend.request':
      return {
        ...base,
        message: '친구 요청',
        detail: `${record.payload.sender_nickname}님이 친구 요청을 보냈어요.`,
        icon: friendIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'friend' },
      }
    case 'friend.accepted':
      return {
        ...base,
        message: '친구 요청 수락',
        detail: `${record.payload.receiver_nickname}님이 친구 요청을 수락했어요.`,
        icon: friendIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'friend' },
      }
    case 'chat.request':
      return {
        ...base,
        message: '메시지 요청 도착',
        detail: `${record.payload.sender_nickname}님이 메시지를 보냈어요.`,
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
        detail: record.payload.message,
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
        target: { tab: 'home', postId: record.payload.post_id },
      }
    case 'media.caption_failed':
      return {
        ...base,
        message: '영상 자막 생성 실패',
        detail: '영상 자막 생성에 실패했어요. 다시 시도해주세요.',
        icon: errorIcon,
        iconBg: ERROR_BG,
        target: { tab: 'home', postId: record.payload.post_id },
      }
    case 'post.liked':
      return {
        ...base,
        message: '공감 알림',
        detail: `${record.payload.liker_nickname}님이 회원님의 게시글에 공감했어요.`,
        icon: heartBIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'home', postId: record.payload.post_id },
      }
    case 'post.commented':
      return {
        ...base,
        message: '댓글 알림',
        detail: `${record.payload.commenter_nickname}님이 새 댓글을 남겼어요.`,
        icon: chatIcon,
        iconBg: DEFAULT_BG,
        target: { tab: 'home', postId: record.payload.post_id },
      }
  }
}
