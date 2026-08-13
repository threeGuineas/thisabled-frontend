import { useCallback, useEffect, useRef, useState } from 'react'
import getStyles from '../default/DefaultChatRoomScreen.styles'
import typography from '../../styles/typography'
import colors from '../../styles/colors'
import {
  getChatMessages,
  sendChatMessage,
  revealChatMessage,
  type ChatRoom,
  type ChatMessage,
} from '../../services/chat'
import { connectChatSocket } from '../../services/chatSocket'
import { getReplySuggestions, getConversationHints } from '../../services/comm'
import { blockUser } from '../../services/friends'
import { useAiNotice } from '../../hooks/useAiNotice'
import AiNoticeModal from '../../components/AiNoticeModal'
import { avatarUrlFor } from '../../utils/avatar'
import backIcon from '../../assets/images/back.svg'
import sendIcon from '../../assets/images/send.svg'
import sendGIcon from '../../assets/images/send-g.svg'

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

// DEV-01 발달장애 모드 전용 채팅방 — 사진/영상 전송 등 선택지를 줄이고 텍스트 대화에 집중하며,
// COMM-03(답장 추천)·COMM-04(대화 힌트)를 "AI 도움" 버튼으로 기본 노출한다.
export default function DevChatRoomScreen({ room, onBack }: Props) {
  const styles = getStyles('developmental')
  const [currentRoom, setCurrentRoom] = useState<ChatRoom>(room)
  const [messageText, setMessageText] = useState('')

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | null>(null)
  const [revealingId, setRevealingId] = useState<string | null>(null)

  const [blockTarget, setBlockTarget] = useState<{ id: string; nickname: string } | null>(null)
  const [isBlocking, setIsBlocking] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const [showAiPanel, setShowAiPanel] = useState(false)
  const [hints, setHints] = useState<string[] | null>(null)
  const [replySuggestions, setReplySuggestions] = useState<string[] | null>(null)
  const [isLoadingAi, setIsLoadingAi] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const { noticeOpen, runWithNotice, confirmNotice, cancelNotice } = useAiNotice()

  const messageListRef = useRef<HTMLDivElement>(null)

  const nickname = currentRoom.counterpart.nickname
  const avatarUrl = avatarUrlFor(currentRoom.counterpart.profile_image_url, String(currentRoom.counterpart.id ?? nickname))

  const alreadySentInRequest = currentRoom.state === 'request' && messages.some((m) => m.mine)
  const canSendText = currentRoom.state === 'active' || (currentRoom.state === 'request' && !alreadySentInRequest)

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
    const socket = connectChatSocket((event) => {
      if (event.type === 'chat.message' && event.payload.room_id === currentRoom.id) {
        getChatMessages(currentRoom.id, null, PAGE_LIMIT)
          .then((page) => {
            setMessages([...page.items].reverse())
            scrollToBottom()
          })
          .catch(() => {})
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

  const handleReveal = async (message: ChatMessage) => {
    if (revealingId) return
    setRevealingId(message.id)
    try {
      const result = await revealChatMessage(message.id)
      setMessages((prev) => prev.map((m) => (m.id === message.id ? { ...m, blurred: false, content: result.content } : m)))
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
      setBlockError(e.detail ?? '차단에 실패했어요.')
    } finally {
      setIsBlocking(false)
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
      setSendError(e.detail ?? '메시지 전송에 실패했어요.')
    } finally {
      setIsSending(false)
    }
  }

  // COMM-03/04: 버튼을 직접 눌렀을 때만 최근 대화를 바탕으로 힌트·답장 후보를 요청한다(COMM-05)
  const handleOpenAiPanel = () => {
    setShowAiPanel(true)
    if (hints || replySuggestions) return
    runWithNotice(async () => {
      setIsLoadingAi(true)
      setAiError(null)
      try {
        const [hintsResult, repliesResult] = await Promise.all([
          getConversationHints(currentRoom.id),
          getReplySuggestions(currentRoom.id),
        ])
        setHints(hintsResult.hints)
        setReplySuggestions(repliesResult.suggestions)
      } catch (err: unknown) {
        const e = err as { detail?: string }
        setAiError(e.detail ?? 'AI 도움을 불러오지 못했어요.')
      } finally {
        setIsLoadingAi(false)
      }
    })
  }

  // 후보를 선택하면 입력창에 채우기만 하고, 사용자가 확인 후 직접 전송한다(COMM-03)
  const applySuggestion = (text: string) => {
    setMessageText(text)
    setShowAiPanel(false)
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
        {currentRoom.counterpart.id && (
          <button
            type="button"
            onClick={() => setBlockTarget({ id: currentRoom.counterpart.id!, nickname })}
            className={[typography.sm, typography.semibold, colors.text.gray02, 'px-3 py-2'].join(' ')}
          >
            차단
          </button>
        )}
      </div>

      {currentRoom.restricted_sender && (
        <div className={styles.restrictionBanner}>
          <span className={styles.restrictionText}>{nickname}님 — 위험할 수 있는 메시지가 반복되어 전송을 제한했어요.</span>
        </div>
      )}

      {currentRoom.state === 'request' && (
        <div className={styles.pendingBanner}>
          <span className={styles.pendingText}>
            {alreadySentInRequest ? '상대의 수락을 기다리는 중이에요.' : '상대가 수락하면 계속 대화할 수 있어요.'}
          </span>
        </div>
      )}

      <div className={styles.messageList} ref={messageListRef}>
        {isLoading ? (
          <div className={styles.loadingMoreRow}>
            <span className={styles.loadingMoreText}>메시지를 불러오는 중이에요...</span>
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
                      <div className={styles.blurredBubble} role="group" aria-label="주의가 필요한 메시지입니다.">
                        <span className={styles.blurredText} aria-hidden="true">주의가 필요한 메시지예요.</span>
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
                      <div className={styles.blurredBubble} role="group" aria-label="주의가 필요한 메시지입니다.">
                        <span className={styles.blurredText} aria-hidden="true">주의가 필요한 메시지예요.</span>
                        <button type="button" onClick={() => handleReveal(msg)} disabled={revealingId === msg.id} className={styles.revealButton}>
                          {revealingId === msg.id ? '확인 중...' : '내용 보기'}
                        </button>
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

      {blockTarget && (
        <>
          <div className={styles.confirmOverlay} onClick={() => (!isBlocking ? setBlockTarget(null) : undefined)} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>{blockTarget.nickname}님을 차단할까요?</p>
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

      {/* COMM-03/04 AI 도움 패널 */}
      {showAiPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowAiPanel(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white px-6 pt-6 pb-10 shadow-2xl">
            <p className={[typography.lg, typography.bold, 'text-black text-center mb-1'].join(' ')}>AI 도움</p>
            <p className={[typography.sm, typography.regular, colors.text.gray01, 'text-center mb-5'].join(' ')}>
              눌러서 입력창에 채워 넣을 수 있어요. 내용은 보내기 전에 다시 확인해요.
            </p>

            {isLoadingAi ? (
              <p className={[typography.base, typography.medium, colors.text.gray01, 'text-center py-6'].join(' ')}>생각하는 중이에요...</p>
            ) : aiError ? (
              <p className={[typography.sm, typography.medium, 'text-red-500 text-center py-6'].join(' ')}>{aiError}</p>
            ) : (
              <div className="flex flex-col gap-5">
                {hints && hints.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className={[typography.sm, typography.bold, colors.text.green].join(' ')}>대화 힌트</span>
                    {hints.map((hint, i) => (
                      <div key={i} className={[colors.bg.green01, 'rounded-2xl px-4 py-3', typography.base, typography.medium, 'text-black'].join(' ')}>
                        {hint}
                      </div>
                    ))}
                  </div>
                )}

                {replySuggestions && replySuggestions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <span className={[typography.sm, typography.bold, colors.text.green].join(' ')}>답장 후보</span>
                    {replySuggestions.map((suggestion, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => applySuggestion(suggestion)}
                        className={['w-full text-left rounded-2xl border-2', colors.border.gray03, 'px-4 py-3.5 active:opacity-80'].join(' ')}
                      >
                        <span className={[typography.base, typography.medium, 'text-black leading-relaxed'].join(' ')}>{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {noticeOpen && <AiNoticeModal onConfirm={confirmNotice} onCancel={cancelNotice} />}

      {canSendText ? (
        <div className={styles.inputBarWrapper}>
          {sendError && <p className={styles.sendError}>{sendError}</p>}
          <div className={styles.inputBar}>
            <button
              type="button"
              onClick={handleOpenAiPanel}
              className={[colors.bg.green01, 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'].join(' ')}
              aria-label="AI 도움 받기"
            >
              <span className={[typography.xs, typography.bold, colors.text.green].join(' ')}>AI</span>
            </button>
            <div className={styles.textInputWrapper}>
              <textarea
                rows={1}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
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
