import chatIcon from '../assets/images/chat.svg'
import duringIcon from '../assets/images/during.svg'
import checkIcon from '../assets/images/check-b.svg'
import errorIcon from '../assets/images/error.svg'
import friendIcon from '../assets/images/friend.svg'
import heartBIcon from '../assets/images/heart.svg'

export interface NotificationItem {
  message: string
  detail: string
  icon: string
  iconBg: string
  isRead: boolean
  createdAt: string
}

const DURING_BG = '#FFF5E2'
const CHECK_BG = '#28C76F'
const ERROR_BG = '#FDEBEB'
const DEFAULT_BG = '#C2DCFF'

const now = Date.now()
const minutesAgo = (minutes: number) => new Date(now - minutes * 60000).toISOString()

export const NOTIFICATIONS: NotificationItem[] = [
  {
    message: '영상 자막 생성 중',
    detail: 'AI가 영상의 자막을 생성하고 있어요. 완료되면 알려드릴게요.',
    icon: duringIcon,
    iconBg: DURING_BG,
    isRead: false,
    createdAt: minutesAgo(2),
  },
  {
    message: '영상 자막 생성 완료',
    detail: '요청하신 영상의 자막 생성이 완료됐어요.',
    icon: checkIcon,
    iconBg: CHECK_BG,
    isRead: false,
    createdAt: minutesAgo(5),
  },
  {
    message: '메시지 도착',
    detail: '새로운 메시지가 도착했어요. 확인해보세요.',
    icon: chatIcon,
    iconBg: DEFAULT_BG,
    isRead: false,
    createdAt: minutesAgo(9),
  },
  {
    message: '게시글 등록 완료',
    detail: '작성하신 게시글이 정상적으로 등록됐어요.',
    icon: checkIcon,
    iconBg: CHECK_BG,
    isRead: true,
    createdAt: minutesAgo(40),
  },
  {
    message: '게시글 등록 실패',
    detail: '게시글 등록에 실패했어요. 다시 시도해주세요.',
    icon: errorIcon,
    iconBg: ERROR_BG,
    isRead: true,
    createdAt: minutesAgo(65),
  },
  {
    message: '친구 요청',
    detail: '새로운 친구 요청이 도착했어요.',
    icon: friendIcon,
    iconBg: DEFAULT_BG,
    isRead: true,
    createdAt: minutesAgo(130),
  },
  {
    message: '공감 알림',
    detail: '회원님의 게시글에 공감이 달렸어요.',
    icon: heartBIcon,
    iconBg: DEFAULT_BG,
    isRead: true,
    createdAt: minutesAgo(200),
  },
  {
    message: '댓글 알림',
    detail: '회원님의 게시글에 새 댓글이 달렸어요.',
    icon: chatIcon,
    iconBg: DEFAULT_BG,
    isRead: true,
    createdAt: minutesAgo(1500),
  },
]

export const unreadNotificationCount = NOTIFICATIONS.filter((item) => !item.isRead).length
