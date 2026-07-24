import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './DefaultChatRoomScreen.styles'
import {
  getChatMessages,
  sendChatMessage,
  sendChatMedia,
  revealChatMessage,
  releaseChatRestriction,
  type ChatRoom,
  type ChatMessage,
} from '../services/chat'
import { connectChatSocket } from '../services/chatSocket'
import { blockUser } from '../services/friends'
import { avatarUrlFor, resolveImageUrl } from '../utils/avatar'
import backIcon from '../assets/images/back.svg'
import callIcon from '../assets/images/call.svg'
import videoIcon from '../assets/images/video.svg'
import imageIcon from '../assets/images/image.svg'
import sendIcon from '../assets/images/send.svg'
import sendGIcon from '../assets/images/send-g.svg'

const PAGE_LIMIT = 30

interface Props {
  room: ChatRoom
  onBack: () => void
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hours = d.getHours()
  const minutes = d.getMinutes()
  const ampm = hours >= 12 ? '오후' : '오전'
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${ampm} ${h}:${String(minutes).padStart(2, '0')}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
}

export default function DefaultChatRoomScreen({ room, onBack }: Props) {
  const [currentRoom, setCurrentRoom] = useState<ChatRoom>(room)

  const [messageText, setMessageText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [isSendingMedia, setIsSendingMedia] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [revealingId, setRevealingId] = useState<string | null>(null)
  const [isReleasing, setIsReleasing] = useState(false)
  const [blockTarget, setBlockTarget] = useState<{ id: string; nickname: string } | null>(null)
  const [isBlocking, setIsBlocking] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const messageListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const prevScrollHeightRef = useRef<number | null>(null)

  const nickname = currentRoom.counterpart.nickname
  const avatarUrl = avatarUrlFor(currentRoom.counterpart.profile_image_url, String(currentRoom.counterpart.id ?? nickname))

  // 요청(비친구) 방에서는 내가 요청자일 때만 이 화면을 볼 수 있고, 수락 전에는 1건만 보낼 수 있다
  const alreadySentInRequest = currentRoom.state === 'request' && messages.some((m) => m.mine)
  const canSendText = currentRoom.state === 'active' || (currentRoom.state === 'request' && !alreadySentInRequest)
  const canSendMedia = currentRoom.state === 'active'

  const scrollToBottom = () => {
    setTimeout(() => {
      const el = messageListRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 50)
  }

  const loadInitialMessages = useCallback(async () => {
    setIsLoading(true)
    try {
      const page = await getChatMessages(currentRoom.id, null, PAGE_LIMIT)
      setMessages([...page.items].reverse())
      setNextCursor(page.next_cursor)
      setHasMore(page.next_cursor !== null)
      scrollToBottom()
    } catch {
      // 실패 시 빈 목록으로 두고, 방을 나갔다 들어오면 재조회됨
    } finally {
      setIsLoading(false)
    }
  }, [currentRoom.id])

  useEffect(() => {
    loadInitialMessages()
  }, [loadInitialMessages])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  // 위로 스크롤해 과거 메시지를 더 불러온 뒤에도 보던 위치가 유지되도록 스크롤 높이를 보정
  useEffect(() => {
    const el = messageListRef.current
    if (el && prevScrollHeightRef.current !== null) {
      el.scrollTop = el.scrollHeight - prevScrollHeightRef.current
      prevScrollHeightRef.current = null
    }
  }, [messages])

  const loadMoreMessages = async () => {
    if (!hasMore || isLoadingMore || !nextCursor) return
    setIsLoadingMore(true)
    prevScrollHeightRef.current = messageListRef.current?.scrollHeight ?? null
    try {
      const page = await getChatMessages(currentRoom.id, nextCursor, PAGE_LIMIT)
      setMessages((prev) => [...[...page.items].reverse(), ...prev])
      setNextCursor(page.next_cursor)
      setHasMore(page.next_cursor !== null)
    } catch {
      prevScrollHeightRef.current = null
    } finally {
      setIsLoadingMore(false)
    }
  }

  const handleScroll = () => {
    const el = messageListRef.current
    if (el && el.scrollTop < 80) loadMoreMessages()
  }

  useEffect(() => {
    const socket = connectChatSocket((event) => {
      if (event.type === 'chat.message' && event.payload.room_id === currentRoom.id) {
        getChatMessages(currentRoom.id, null, PAGE_LIMIT)
          .then((page) => {
            setMessages([...page.items].reverse())
            setNextCursor(page.next_cursor)
            setHasMore(page.next_cursor !== null)
            scrollToBottom()
          })
          .catch(() => {})
      } else if (event.type === 'chat.read' && event.payload.room_id === currentRoom.id) {
        setMessages((prev) =>
          prev.map((m) => (m.mine ? { ...m, is_read: m.id === event.payload.message_id } : m)),
        )
      } else if (event.type === 'notification') {
        if (event.payload.type === 'chat.flagged' && event.payload.room_id === currentRoom.id) {
          getChatMessages(currentRoom.id, null, PAGE_LIMIT)
            .then((page) => setMessages([...page.items].reverse()))
            .catch(() => {})
        } else if (event.payload.type === 'chat.restricted' && event.payload.room_id === currentRoom.id) {
          setCurrentRoom((prev) => ({ ...prev, restricted_sender: true }))
        }
      }
    })
    return () => socket.close()
  }, [currentRoom.id])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(URL.createObjectURL(file))
    setPendingFile(file)
    setMediaError(null)
    setShowConfirmModal(true)
    e.target.value = ''
  }

  const handleConfirmSend = async () => {
    if (!pendingFile || isSendingMedia) return
    setIsSendingMedia(true)
    setMediaError(null)
    try {
      const message = await sendChatMedia(currentRoom.id, pendingFile, 'image')
      setMessages((prev) => [...prev, message])
      setShowConfirmModal(false)
      if (imagePreview) URL.revokeObjectURL(imagePreview)
      setImagePreview(null)
      setPendingFile(null)
      scrollToBottom()
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setMediaError(e.detail ?? '사진 전송에 실패했습니다.')
    } finally {
      setIsSendingMedia(false)
    }
  }

  const handleCancelSend = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setPendingFile(null)
    setMediaError(null)
    setShowConfirmModal(false)
  }

  const handleReveal = async (message: ChatMessage) => {
    if (revealingId) return
    setRevealingId(message.id)
    try {
      const result = await revealChatMessage(message.id)
      setMessages((prev) =>
        prev.map((m) => (m.id === message.id ? { ...m, blurred: false, content: result.content } : m)),
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
      setBlockTarget(null)
      onBack()
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setBlockError(e.detail ?? '차단에 실패했습니다.')
    } finally {
      setIsBlocking(false)
    }
  }

  const handleReleaseRestriction = async () => {
    if (isReleasing || !currentRoom.counterpart.id) return
    setIsReleasing(true)
    try {
      await releaseChatRestriction(currentRoom.counterpart.id)
      setCurrentRoom((prev) => ({ ...prev, restricted_sender: false }))
    } catch {
      // 실패 시 배너를 그대로 유지
    } finally {
      setIsReleasing(false)
    }
  }

  const handleSendText = async () => {
    const trimmed = messageText.trim()
    if (!trimmed || isSending || !canSendText) return
    setIsSending(true)
    setSendError(null)
    try {
      const message = await sendChatMessage(currentRoom.id, trimmed)
      setMessages((prev) => [...prev, message])
      setMessageText('')
      scrollToBottom()
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSendError(e.detail ?? '메시지 전송에 실패했습니다.')
    } finally {
      setIsSending(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendText()
    }
  }

  const canSubmit = messageText.trim().length > 0 && !isSending && canSendText

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.backIcon} />
        </button>
        <img src={avatarUrl} alt={`${nickname} 프로필`} className={styles.avatar} />
        <span className={styles.userName}>{nickname}</span>
        <div className={styles.headerActions}>
          <button type="button" className={styles.headerActionButton} aria-label="음성 통화">
            <img src={callIcon} alt="" className={styles.headerActionIcon} />
          </button>
          <button type="button" className={styles.headerActionButton} aria-label="영상 통화">
            <img src={videoIcon} alt="" className={styles.headerActionIcon} />
          </button>
        </div>
      </div>

      {currentRoom.restricted_sender && (
        <div className={styles.restrictionBanner}>
          <span className={styles.restrictionText}>
            {nickname}님 — 위험 가능성이 있는 메시지가 반복되어 전송을 제한했어요.
          </span>
          <button
            type="button"
            onClick={handleReleaseRestriction}
            disabled={isReleasing}
            className={styles.restrictionButton}
          >
            {isReleasing ? '해제 중...' : '해제하기'}
          </button>
        </div>
      )}

      {currentRoom.state === 'request' && (
        <div className={styles.pendingBanner}>
          <span className={styles.pendingText}>
            {alreadySentInRequest ? '상대의 수락을 기다리는 중이에요.' : '상대가 수락하면 계속 대화할 수 있어요.'}
          </span>
        </div>
      )}

      {messages.length > 0 && (
        <div className={styles.dateDivider}>
          <span className={styles.dateText}>{formatDate(messages[0].created_at)}</span>
        </div>
      )}

      <div className={styles.messageList} ref={messageListRef} onScroll={handleScroll}>
        {isLoadingMore && (
          <div className={styles.loadingMoreRow}>
            <span className={styles.loadingMoreText}>이전 메시지 불러오는 중...</span>
          </div>
        )}

        {isLoading ? (
          <div className={styles.loadingMoreRow}>
            <span className={styles.loadingMoreText}>메시지를 불러오는 중...</span>
          </div>
        ) : (
          messages.map((msg) => {
            if (msg.mine) {
              return (
                <div key={msg.id} className={styles.myRow}>
                  <div className={styles.myGroup}>
                    <div className={styles.myMetaCol}>
                      {msg.is_read && <span className={styles.myReadText}>읽음</span>}
                      <span className={styles.myTime}>{formatTime(msg.created_at)}</span>
                    </div>
                    {msg.blurred ? (
                      <div
                        className={styles.blurredBubble}
                        role="group"
                        aria-label="주의가 필요한 메시지입니다."
                      >
                        <span className={styles.blurredText} aria-hidden="true">주의가 필요한 메시지입니다.</span>
                      </div>
                    ) : msg.type === 'image' && msg.media_url ? (
                      <div className={styles.myBubble}>
                        <img src={resolveImageUrl(msg.media_url)} alt="전송한 사진" className={styles.messageImage} />
                      </div>
                    ) : msg.type === 'video' && msg.media_url ? (
                      <div className={styles.myBubble}>
                        <video src={resolveImageUrl(msg.media_url)} controls className={styles.messageVideo} />
                      </div>
                    ) : (
                      <div className={styles.myBubble}>
                        <span className={styles.myText}>{msg.content}</span>
                      </div>
                    )}
                  </div>
                </div>
              )
            }

            return (
              <div key={msg.id} className={styles.otherRow}>
                <img src={avatarUrl} alt="" className={styles.otherAvatar} />
                <div className={styles.otherCol}>
                  <span className={styles.otherName}>{nickname}</span>
                  <div className={styles.otherBubbleRow}>
                    {msg.blurred ? (
                      <div
                        className={styles.blurredBubble}
                        role="group"
                        aria-label="주의가 필요한 메시지입니다."
                      >
                        <span className={styles.blurredText} aria-hidden="true">주의가 필요한 메시지입니다.</span>
                        <div className={styles.blurredActions}>
                          <button
                            type="button"
                            onClick={() => handleReveal(msg)}
                            disabled={revealingId === msg.id}
                            className={styles.revealButton}
                          >
                            {revealingId === msg.id ? '확인 중...' : '내용 보기'}
                          </button>
                          {msg.sender.id && (
                            <button
                              type="button"
                              onClick={() => setBlockTarget({ id: msg.sender.id!, nickname: msg.sender.nickname })}
                              className={styles.blockButton}
                              aria-label={`${msg.sender.nickname}님 차단하기`}
                            >
                              차단
                            </button>
                          )}
                        </div>
                      </div>
                    ) : msg.type === 'image' && msg.media_url ? (
                      <div className={styles.otherBubble}>
                        <img src={resolveImageUrl(msg.media_url)} alt="전송한 사진" className={styles.messageImage} />
                      </div>
                    ) : msg.type === 'video' && msg.media_url ? (
                      <div className={styles.otherBubble}>
                        <video src={resolveImageUrl(msg.media_url)} controls className={styles.messageVideo} />
                      </div>
                    ) : (
                      <div className={styles.otherBubble}>
                        <span className={styles.otherText}>{msg.content}</span>
                      </div>
                    )}
                    <span className={styles.otherTime}>{formatTime(msg.created_at)}</span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        aria-label="이미지 파일 선택"
        className="hidden"
        onChange={handleImageSelect}
      />

      {showConfirmModal && imagePreview && (
        <>
          <div className={styles.confirmOverlay} onClick={handleCancelSend} />
          <div className={styles.confirmModal}>
            <img src={imagePreview} alt="전송할 사진" className={styles.confirmImage} />
            <p className={styles.confirmText}>사진을 전송하시겠습니까?</p>
            {mediaError && <p className={styles.confirmError}>{mediaError}</p>}
            <div className={styles.confirmButtons}>
              <button type="button" onClick={handleCancelSend} disabled={isSendingMedia} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" onClick={handleConfirmSend} disabled={isSendingMedia} className={styles.confirmYesButton}>
                {isSendingMedia ? '전송 중...' : '네'}
              </button>
            </div>
          </div>
        </>
      )}

      {blockTarget && (
        <>
          <div className={styles.confirmOverlay} onClick={() => (!isBlocking ? setBlockTarget(null) : undefined)} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>{blockTarget.nickname}님을 차단하시겠습니까?</p>
            {blockError && <p className={styles.confirmError}>{blockError}</p>}
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

      {canSendText ? (
        <div className={styles.inputBarWrapper}>
          {sendError && <p className={styles.sendError}>{sendError}</p>}
          <div className={styles.inputBar}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={!canSendMedia}
              className={styles.attachButton}
              aria-label={canSendMedia ? '사진 전송' : '친구와의 채팅에서만 사진을 보낼 수 있어요'}
            >
              <img src={imageIcon} alt="" className={styles.attachIcon} />
            </button>
            <div className={styles.textInputWrapper}>
              <textarea
                rows={1}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="메시지 보내기"
                className={styles.textInput}
                disabled={isSending}
              />
            </div>
            <button
              type="button"
              onClick={handleSendText}
              disabled={!canSubmit}
              className={canSubmit ? styles.sendButtonActive : styles.sendButton}
              aria-label="전송하기"
            >
              <img src={canSubmit ? sendIcon : sendGIcon} alt="" className={styles.sendIcon} />
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.pendingBannerFixed}>
          <span className={styles.pendingText}>상대의 수락을 기다리는 중이에요.</span>
        </div>
      )}
    </div>
  )
}
