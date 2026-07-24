import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './DefaultChatScreen.styles'
import BottomNav, { type Tab } from '../components/BottomNav'
import DefaultChatRoomScreen from './DefaultChatRoomScreen'
import {
  createOrGetRoom,
  getRooms,
  getChatRequests,
  acceptChatRequest,
  getChatMessages,
  revealChatMessage,
  type ChatRoom,
  type ChatMessage,
} from '../services/chat'
import { connectChatSocket } from '../services/chatSocket'
import { blockUser } from '../services/friends'
import { avatarUrlFor } from '../utils/avatar'
import searchIcon from '../assets/images/search.svg'
import backIcon from '../assets/images/back.svg'

interface RoomListItem extends ChatRoom {
  lastMessageAt: string
}

interface RequestListItem extends ChatRoom {
  previewMessage: ChatMessage | null
}

type ScreenView = 'list' | 'requests'

export interface ChatTargetUser {
  id: string
  nickname: string
  avatarUrl: string
}

interface Props {
  onTabChange: (tab: Tab) => void
  targetUser: ChatTargetUser | null
  onTargetUserConsumed: () => void
}

function formatListTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const isSameDay = d.toDateString() === now.toDateString()
  if (isSameDay) {
    const hours = d.getHours()
    const minutes = d.getMinutes()
    const ampm = hours >= 12 ? '오후' : '오전'
    const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
    return `${ampm} ${h}:${String(minutes).padStart(2, '0')}`
  }
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (d.toDateString() === yesterday.toDateString()) return '어제'
  return `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? '오후' : '오전'
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${ampm} ${h}:${String(minutes).padStart(2, '0')}`
}

export default function DefaultChatScreen({ onTabChange, targetUser, onTargetUserConsumed }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [view, setView] = useState<ScreenView>('list')
  const [searchQuery, setSearchQuery] = useState('')

  const [rooms, setRooms] = useState<RoomListItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [roomsError, setRoomsError] = useState<string | null>(null)

  const [requests, setRequests] = useState<RequestListItem[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [requestsError, setRequestsError] = useState<string | null>(null)
  const [acceptingId, setAcceptingId] = useState<string | null>(null)
  const [revealingId, setRevealingId] = useState<string | null>(null)

  const [blockTarget, setBlockTarget] = useState<{ id: string; nickname: string } | null>(null)
  const [isBlocking, setIsBlocking] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null)
  const [targetUserError, setTargetUserError] = useState<string | null>(null)

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  const loadRooms = useCallback(async () => {
    setIsLoadingRooms(true)
    setRoomsError(null)
    try {
      const page = await getRooms()
      // 방 목록 조회 자체는 메시지를 읽음 처리하지 않도록 미리보기용 메시지 조회는 하지 않는다
      const withTimes = page.items
        .map((room): RoomListItem => ({ ...room, lastMessageAt: room.accepted_at ?? room.created_at }))
        .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      setRooms(withTimes)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setRoomsError(e.detail ?? '채팅 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoadingRooms(false)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setIsLoadingRequests(true)
    setRequestsError(null)
    try {
      const page = await getChatRequests()
      const withPreview = await Promise.all(
        page.items.map(async (room): Promise<RequestListItem> => {
          try {
            const latest = await getChatMessages(room.id, null, 1)
            return { ...room, previewMessage: latest.items[0] ?? null }
          } catch {
            return { ...room, previewMessage: null }
          }
        }),
      )
      setRequests(withPreview)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setRequestsError(e.detail ?? '채팅 요청을 불러오지 못했습니다.')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    loadRooms()
    loadRequests()
  }, [loadRooms, loadRequests])

  useEffect(() => {
    const socket = connectChatSocket((event) => {
      if (event.type === 'chat.message') {
        loadRooms()
      } else if (event.type === 'notification') {
        if (event.payload.type === 'chat.request') loadRequests()
        else if (event.payload.type === 'chat.restricted' || event.payload.type === 'chat.flagged') loadRooms()
      }
    })
    return () => socket.close()
  }, [loadRooms, loadRequests])

  const onTargetUserConsumedRef = useRef(onTargetUserConsumed)
  useEffect(() => { onTargetUserConsumedRef.current = onTargetUserConsumed }, [onTargetUserConsumed])

  useEffect(() => {
    if (!targetUser) return
    let cancelled = false
    setTargetUserError(null)
    createOrGetRoom(targetUser.id)
      .then((room) => { if (!cancelled) setSelectedRoom(room) })
      .catch((err: unknown) => {
        if (cancelled) return
        const e = err as { detail?: string }
        setTargetUserError(e.detail ?? '채팅을 시작할 수 없습니다.')
      })
      .finally(() => { if (!cancelled) onTargetUserConsumedRef.current() })
    return () => { cancelled = true }
  }, [targetUser])

  const handleAccept = async (room: ChatRoom) => {
    if (acceptingId) return
    setAcceptingId(room.id)
    setRequestsError(null)
    try {
      const updated = await acceptChatRequest(room.id)
      setRequests((prev) => prev.filter((r) => r.id !== room.id))
      setRooms((prev) => [{ ...updated, lastMessageAt: updated.accepted_at ?? updated.created_at }, ...prev])
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setRequestsError(e.detail ?? '요청 수락에 실패했습니다.')
    } finally {
      setAcceptingId(null)
    }
  }

  const handleRevealRequest = async (room: RequestListItem) => {
    if (!room.previewMessage || revealingId) return
    setRevealingId(room.previewMessage.id)
    try {
      const result = await revealChatMessage(room.previewMessage.id)
      setRequests((prev) =>
        prev.map((r) =>
          r.id === room.id && r.previewMessage
            ? { ...r, previewMessage: { ...r.previewMessage, blurred: false, content: result.content } }
            : r,
        ),
      )
    } catch {
      // 실패 시 버튼이 그대로 남아 재시도할 수 있다
    } finally {
      setRevealingId(null)
    }
  }

  const handleConfirmBlock = async () => {
    if (!blockTarget || isBlocking) return
    setIsBlocking(true)
    setBlockError(null)
    try {
      await blockUser(blockTarget.id)
      setRequests((prev) => prev.filter((r) => r.counterpart.id !== blockTarget.id))
      setBlockTarget(null)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setBlockError(e.detail ?? '차단에 실패했습니다.')
    } finally {
      setIsBlocking(false)
    }
  }

  const filteredRooms = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return rooms
    return rooms.filter((room) => room.counterpart.nickname.toLowerCase().includes(query))
  }, [rooms, searchQuery])

  if (selectedRoom) {
    return (
      <DefaultChatRoomScreen
        room={selectedRoom}
        onBack={() => {
          setSelectedRoom(null)
          loadRooms()
          loadRequests()
        }}
      />
    )
  }

  if (view === 'requests') {
    return (
      <div className={styles.container}>
        <div className={styles.subHeader}>
          <button type="button" onClick={() => setView('list')} className={styles.backButton} aria-label="뒤로 가기">
            <img src={backIcon} alt="" className={styles.backIcon} />
          </button>
          <span className={styles.subHeaderTitle}>채팅 요청</span>
        </div>

        {isLoadingRequests ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>요청을 불러오는 중...</span>
          </div>
        ) : requestsError ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>{requestsError}</span>
            <button type="button" onClick={loadRequests} className={styles.retryButton}>
              다시 시도
            </button>
          </div>
        ) : requests.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>받은 채팅 요청이 없어요.</span>
          </div>
        ) : (
          <div className={styles.requestList}>
            {requests.map((room) => {
              const nickname = room.counterpart.nickname
              const avatarUrl = avatarUrlFor(room.counterpart.profile_image_url, String(room.counterpart.id ?? nickname))
              const preview = room.previewMessage
              const wasFlagged = preview?.safety_status === 'flagged'
              return (
                <div key={room.id} className={styles.requestItem}>
                  <div className={styles.requestTop}>
                    <div className={styles.avatarWrapper}>
                      <img src={avatarUrl} alt={`${nickname} 프로필`} className={styles.avatar} />
                    </div>
                    <div className={styles.requestInfo}>
                      <span className={styles.requestNickname}>{nickname}</span>
                      <span className={styles.requestTime}>{formatTime(room.created_at)}</span>
                    </div>
                  </div>

                  {preview && (
                    preview.blurred ? (
                      <div
                        className={styles.requestPreviewBlurred}
                        role="group"
                        aria-label="주의가 필요한 메시지입니다."
                      >
                        <span className={styles.requestPreviewBlurredText} aria-hidden="true">
                          주의가 필요한 메시지예요.
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRevealRequest(room)}
                          disabled={revealingId === preview.id}
                          className={styles.requestRevealButton}
                        >
                          {revealingId === preview.id ? '확인 중...' : '내용 보기'}
                        </button>
                      </div>
                    ) : (
                      <span className={styles.requestPreviewText}>{preview.content}</span>
                    )
                  )}

                  <div className={styles.requestActions}>
                    <button
                      type="button"
                      onClick={() => handleAccept(room)}
                      disabled={acceptingId === room.id}
                      className={styles.acceptButton}
                      aria-label={`${nickname}님의 채팅 요청 수락`}
                    >
                      {acceptingId === room.id ? '수락 중...' : '수락'}
                    </button>
                    {wasFlagged && room.counterpart.id && (
                      <button
                        type="button"
                        onClick={() => setBlockTarget({ id: room.counterpart.id!, nickname })}
                        className={styles.requestBlockButton}
                        aria-label={`${nickname}님 차단하기`}
                      >
                        차단
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {blockTarget && (
          <>
            <div className={styles.confirmOverlay} onClick={() => (!isBlocking ? setBlockTarget(null) : undefined)} />
            <div className={styles.confirmModal}>
              <p className={styles.confirmText}>{blockTarget.nickname}님을 차단하시겠습니까?</p>
              {blockError && <p className={styles.confirmErrorText}>{blockError}</p>}
              <div className={styles.confirmButtons}>
                <button type="button" onClick={() => setBlockTarget(null)} disabled={isBlocking} className={styles.confirmNoButton}>
                  아니오
                </button>
                <button type="button" onClick={handleConfirmBlock} disabled={isBlocking} className={styles.confirmYesButton}>
                  {isBlocking ? '처리 중...' : '차단하기'}
                </button>
              </div>
            </div>
          </>
        )}

        <BottomNav variant="default" active={activeTab} onChange={handleTabChange} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>채팅</span>
      </div>

      <div className={styles.searchBar}>
        <img src={searchIcon} alt="" className={styles.searchIcon} />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="이름으로 검색"
          className={styles.searchInput}
          aria-label="채팅 상대 이름으로 검색"
        />
        {searchQuery && (
          <button type="button" onClick={() => setSearchQuery('')} className={styles.searchClearButton} aria-label="검색어 지우기">
            ✕
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => setView('requests')}
        className={styles.requestBanner}
        aria-label={`친구가 아닌 사람이 보낸 채팅 ${requests.length}건 보기`}
      >
        <div className={styles.requestBannerLeft}>
          <span className={styles.requestBannerText}>채팅 요청</span>
          {requests.length > 0 && <span className={styles.requestBadge}>{requests.length}</span>}
        </div>
        <span className={styles.requestBannerChevron}>›</span>
      </button>

      {targetUserError && (
        <div className={styles.errorBanner} role="alert">
          <span className={styles.errorBannerText}>{targetUserError}</span>
          <button
            type="button"
            onClick={() => setTargetUserError(null)}
            className={styles.errorBannerClose}
            aria-label="알림 닫기"
          >
            ✕
          </button>
        </div>
      )}

      {isLoadingRooms ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>채팅 목록을 불러오는 중...</span>
        </div>
      ) : roomsError ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>{roomsError}</span>
          <button type="button" onClick={loadRooms} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      ) : filteredRooms.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>
            {searchQuery ? '검색 결과가 없어요.' : '아직 채팅이 없어요.'}
          </span>
        </div>
      ) : (
        <div className={styles.chatList}>
          {filteredRooms.map((room) => {
            const nickname = room.counterpart.nickname
            const avatarUrl = avatarUrlFor(room.counterpart.profile_image_url, String(room.counterpart.id ?? nickname))
            const unreadCount = room.unread_count
            const unreadLabel = unreadCount > 99 ? '99+' : String(unreadCount)
            return (
              <button key={room.id} type="button" className={styles.chatItem} onClick={() => setSelectedRoom(room)}>
                <div className={styles.avatarWrapper}>
                  <img src={avatarUrl} alt={`${nickname} 프로필`} className={styles.avatar} />
                </div>

                <div className={styles.chatContent}>
                  <div className={styles.chatTopRow}>
                    <span className={styles.chatNickname}>{nickname}</span>
                  </div>
                  {room.restricted_sender && (
                    <div className={styles.chatMetaRow}>
                      <span className={styles.restrictedText}>전송 제한됨</span>
                    </div>
                  )}
                </div>

                <div className={styles.chatRight}>
                  <span className={styles.chatTime}>{formatListTime(room.lastMessageAt)}</span>
                  {unreadCount > 0 && <span className={styles.unreadBadge}>{unreadLabel}</span>}
                </div>
              </button>
            )
          })}
        </div>
      )}

      <BottomNav variant="default" active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
