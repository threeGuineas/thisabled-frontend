import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './BlindChatScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import BlindChatRoomScreen from './BlindChatRoomScreen'
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
import searchWIcon from '../assets/images/search-w.svg'
import checkGIcon from '../assets/images/check-g.svg'

interface RoomListItem extends ChatRoom {
  lastMessageAt: string
}

interface RequestListItem extends ChatRoom {
  previewMessage: ChatMessage | null
}

type ListTab = 'all' | 'request'

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

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? '오후' : '오전'
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${ampm} ${h}:${String(minutes).padStart(2, '0')}`
}

// 백엔드에 읽음 여부 데이터가 없어 방 id를 기반으로 화면에만 쓰이는 표시용 값을 만든다(실제 읽음 상태 아님).
function mockReadState(roomId: string): { isRead: boolean; unreadCount: number } {
  let h = 0
  for (let i = 0; i < roomId.length; i++) h = (h * 31 + roomId.charCodeAt(i)) >>> 0
  const isRead = h % 3 !== 0
  return { isRead, unreadCount: isRead ? 0 : (h % 5) + 1 }
}

export default function BlindChatScreen({ onTabChange, targetUser, onTargetUserConsumed }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [listTab, setListTab] = useState<ListTab>('all')

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
      const withTimes = await Promise.all(
        page.items.map(async (room): Promise<RoomListItem> => {
          try {
            const latest = await getChatMessages(room.id, null, 1)
            return { ...room, lastMessageAt: latest.items[0]?.created_at ?? room.created_at }
          } catch {
            return { ...room, lastMessageAt: room.created_at }
          }
        }),
      )
      withTimes.sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
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
      // 주의 판정을 받은 요청 메시지는 요청함에서도 블러 상태로 보여줘야 하므로 미리보기를 함께 가져온다
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

  // 실시간 알림 — 새 메시지/요청/제한 이벤트가 오면 해당 목록만 다시 불러온다(원문은 이벤트에 실리지 않음)
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
        // 차단·연령 보호 정책으로 막힌 경우와 그 외 사유를 구분하지 않고 서버 detail을 그대로 보여준다
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

  if (selectedRoom) {
    return (
      <BlindChatRoomScreen
        room={selectedRoom}
        onBack={() => {
          setSelectedRoom(null)
          loadRooms()
          loadRequests()
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerTitle}>채팅</span>
          {requests.length > 0 && (
            <div className={styles.badgeWrapper}>
              <span className={styles.badgeText}>{requests.length}</span>
            </div>
          )}
        </div>
        <div className={styles.searchIconWrapper}>
          <img src={searchWIcon} alt="검색 창 버튼" className={styles.searchIcon} />
        </div>
      </div>

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

      <div className={styles.segmentRow} role="tablist" aria-label="전체 대화와 받은 요청 전환">
        {/* axe-linter-disable-next-line aria-valid-attr-value */}
        <button
          type="button"
          role="tab"
          aria-selected={listTab === 'all'}
          onClick={() => setListTab('all')}
          className={listTab === 'all' ? styles.segmentButtonActive : styles.segmentButtonInactive}
        >
          전체 {rooms.length}
        </button>
        {/* axe-linter-disable-next-line aria-valid-attr-value */}
        <button
          type="button"
          role="tab"
          aria-selected={listTab === 'request'}
          onClick={() => setListTab('request')}
          className={listTab === 'request' ? styles.segmentButtonActive : styles.segmentButtonInactive}
        >
          받은 요청 {requests.length}
        </button>
      </div>

      {listTab === 'all' ? (
        isLoadingRooms ? (
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
        ) : rooms.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyText}>아직 채팅이 없어요.</span>
          </div>
        ) : (
          <div className={styles.chatList}>
            {rooms.map((room) => {
              const nickname = room.counterpart.nickname
              const avatarUrl = avatarUrlFor(room.counterpart.profile_image_url, String(room.counterpart.id ?? nickname))
              const { isRead, unreadCount } = mockReadState(room.id)
              return (
                <button key={room.id} type="button" className={styles.chatItem} onClick={() => setSelectedRoom(room)}>
                  <div className={styles.avatarWrapper}>
                    <img src={avatarUrl} alt={`${nickname} 프로필`} className={styles.avatar} />
                  </div>

                  <div className={styles.chatContent}>
                    <div className={styles.chatTopRow}>
                      <span className={styles.chatNickname}>{nickname}</span>
                      <span className={styles.chatTime}>{formatTime(room.lastMessageAt)}</span>
                    </div>

                    <div className={styles.chatBottomRow}>
                      {isRead ? (
                        <div className={styles.readRow}>
                          <img src={checkGIcon} alt="" className={styles.readCheckIcon} />
                          <span className={styles.readText}>읽음</span>
                        </div>
                      ) : (
                        <div className={styles.unreadRow}>
                          <div className={styles.unreadDot} />
                          <span className={styles.unreadText}>읽지 않음 {unreadCount}개</span>
                        </div>
                      )}

                      {room.restricted_sender && (
                        <div className={styles.restrictedRow}>
                          <div className={styles.restrictedDot} />
                          <span className={styles.restrictedText}>전송 제한됨</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )
      ) : isLoadingRequests ? (
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
                      aria-label="주의가 필요한 메시지입니다. 내용 보기를 실행하면 읽어드립니다."
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

      <BlindBottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
