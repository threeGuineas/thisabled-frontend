import { useState } from 'react'
import styles from './BlindChatScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import BlindChatRoomScreen, { type ChatUser } from './BlindChatRoomScreen'
import searchWIcon from '../assets/images/search-w.svg'
import checkGIcon from '../assets/images/check-g.svg'

const MOCK_CHATS = [
  {
    id: 1,
    nickname: '달빛여행',
    avatar: 'https://i.pravatar.cc/80?img=3',
    isActive: true,
    lastMessage: '근처 올림픽 공원은 어떨까요? 꽃도 많이 피어 있을 것 같아요.',
    isRead: true,
    unreadCount: 0,
    time: '오후 2:36',
  },
  {
    id: 2,
    nickname: '하늘산책',
    avatar: 'https://i.pravatar.cc/80?img=7',
    isActive: true,
    lastMessage: '좋아요! 어느 공원으로 갈까요?',
    isRead: false,
    unreadCount: 3,
    time: '오후 2:34',
  },
  {
    id: 3,
    nickname: '봄날의소리',
    avatar: 'https://i.pravatar.cc/80?img=12',
    isActive: false,
    lastMessage: '혹시 이번 주말에 같이 공원 나들이 어떠세요?',
    isRead: true,
    unreadCount: 0,
    time: '오후 2:33',
  },
  {
    id: 4,
    nickname: '조용한밤',
    avatar: 'https://i.pravatar.cc/80?img=20',
    isActive: false,
    lastMessage: '맞아요! 산책하기 딱 좋은 날씨예요.',
    isRead: false,
    unreadCount: 1,
    time: '오후 2:31',
  },
]

const ACTIVE_COUNT = MOCK_CHATS.filter((c) => c.isActive).length

interface Props {
  onTabChange: (tab: Tab) => void
}

export default function BlindChatScreen({ onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [selectedChat, setSelectedChat] = useState<ChatUser | null>(null)

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  if (selectedChat) {
    return <BlindChatRoomScreen chat={selectedChat} onBack={() => setSelectedChat(null)} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>채팅</span>
          <div className={styles.badgeWrapper}>
            <span className={styles.badgeText}>4</span>
          </div>
        </div>
        <div className={styles.searchIconWrapper}>
          <img src={searchWIcon} alt="검색 창 버튼" className={styles.searchIcon} />
        </div>
      </div>

      <div className={styles.activeRow}>
        <div className={styles.activeDot} />
        <span className={styles.activeText}>활동 중인 대화 상대 {ACTIVE_COUNT}명</span>
      </div>

      <div className={styles.chatList}>
        {MOCK_CHATS.map((chat) => (
          <button key={chat.id} type="button" className={styles.chatItem} onClick={() => setSelectedChat(chat)}>
            <div className={styles.avatarWrapper}>
              <img src={chat.avatar} alt={`${chat.nickname} 프로필`} className={styles.avatar} />
              {chat.isActive && <div className={styles.avatarActiveDot} />}
            </div>

            <div className={styles.chatContent}>
              <div className={styles.chatTopRow}>
                <span className={styles.chatNickname}>{chat.nickname}</span>
                <span className={styles.chatTime}>{chat.time}</span>
              </div>

              <span className={styles.chatMessage}>{chat.lastMessage}</span>

              <div className={styles.chatBottomRow}>
                {chat.isRead ? (
                  <div className={styles.readRow}>
                    <img src={checkGIcon} alt="" className={styles.readCheckIcon} />
                    <span className={styles.readText}>읽음</span>
                  </div>
                ) : (
                  <div className={styles.unreadRow}>
                    <div className={styles.unreadDot} />
                    <span className={styles.unreadText}>읽지 않음 {chat.unreadCount}개</span>
                  </div>
                )}

                {chat.isActive && (
                  <div className={styles.activeStatusRow}>
                    <div className={styles.activeStatusDot} />
                    <span className={styles.activeStatusText}>활동 중</span>
                  </div>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>

      <BlindBottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
