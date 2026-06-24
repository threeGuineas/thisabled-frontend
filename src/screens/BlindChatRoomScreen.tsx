import { useEffect, useRef, useState } from 'react'
import styles from './BlindChatRoomScreen.styles'
import { useVoiceInput } from '../hooks/useVoiceInput'
import backGIcon from '../assets/images/back-g.svg'
import callYIcon from '../assets/images/call-y.svg'
import videoYIcon from '../assets/images/video-y.svg'
import imageWIcon from '../assets/images/image-w.svg'
import micWIcon from '../assets/images/mic-w.svg'
import sendIcon from '../assets/images/send.svg'
import sendGIcon from '../assets/images/send-g.svg'

interface Message {
  id: number
  isMe: boolean
  content: string
  time: string
  image?: string
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, isMe: false, content: '안녕하세요! 오늘 날씨가 정말 좋네요.', time: '오후 2:30' },
  { id: 2, isMe: true, content: '맞아요! 산책하기 딱 좋은 날씨예요.', time: '오후 2:31' },
  { id: 3, isMe: false, content: '혹시 이번 주말에 같이 공원 나들이 어떠세요?', time: '오후 2:33' },
  { id: 4, isMe: true, content: '좋아요! 어느 공원으로 갈까요?', time: '오후 2:34' },
  {
    id: 5,
    isMe: false,
    content: '근처 올림픽 공원은 어떨까요? 꽃도 많이 피어 있을 것 같아요.',
    time: '오후 2:36',
  },
]

export interface ChatUser {
  id: number
  nickname: string
  avatar: string
  isActive: boolean
}

interface Props {
  chat: ChatUser
  onBack: () => void
}

function getNowTime() {
  const now = new Date()
  const hours = now.getHours()
  const minutes = now.getMinutes()
  const ampm = hours >= 12 ? '오후' : '오전'
  const h = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours
  return `${ampm} ${h}:${String(minutes).padStart(2, '0')}`
}

export default function BlindChatRoomScreen({ chat, onBack }: Props) {
  const [showChatSheet, setShowChatSheet] = useState(false)
  const [chatText, setChatText] = useState('')
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES)
  const messageListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const el = messageListRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [])

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview)
    }
  }, [imagePreview])

  const scrollToBottom = () => {
    setTimeout(() => {
      const el = messageListRef.current
      if (el) el.scrollTop = el.scrollHeight
    }, 50)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    const url = URL.createObjectURL(file)
    setImagePreview(url)
    scrollToBottom()
    setShowConfirmModal(true)
    e.target.value = ''
  }

  const handleConfirmSend = () => {
    if (!imagePreview) return
    setMessages((prev) => [
      ...prev,
      { id: prev.length + 1, isMe: true, content: '', image: imagePreview, time: getNowTime() },
    ])
    setShowConfirmModal(false)
    setImagePreview(null)
    scrollToBottom()
  }

  const handleCancelSend = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview)
    setImagePreview(null)
    setShowConfirmModal(false)
  }

  const { voiceState, voiceError, toggleRecording, stopRecording } = useVoiceInput((text) => {
    setChatText((prev) => (prev ? `${prev} ${text}` : text))
  })

  const handleOpenVoiceSheet = () => {
    setChatText('')
    setShowChatSheet(true)
    toggleRecording()
  }

  const handleCloseSheet = () => {
    stopRecording()
    setShowChatSheet(false)
    setChatText('')
  }

  const handleReRecord = () => {
    if (voiceState === 'idle' || voiceState === 'error') {
      setChatText('')
    }
    toggleRecording()
  }

  const sheetVoiceButtonClass =
    voiceState === 'recording'
      ? styles.sheetVoiceButtonRecording
      : voiceState === 'transcribing'
        ? styles.sheetVoiceButtonTranscribing
        : styles.sheetVoiceButton

  const sheetVoiceIconClass =
    voiceState === 'recording' ? styles.sheetVoiceIconRecording : styles.sheetVoiceIcon

  const sheetVoiceLabel =
    voiceState === 'recording'
      ? '녹음 중...'
      : voiceState === 'transcribing'
        ? '인식 중...'
        : voiceState === 'error'
          ? '다시 시도'
          : '다시 녹음'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerTopRow}>
          <button type="button" onClick={onBack} className={styles.backButton}>
            <img src={backGIcon} alt="뒤로 가기" className={styles.backIcon} />
          </button>
          <div className={styles.avatarWrapper}>
            <img src={chat.avatar} alt={`${chat.nickname} 프로필`} className={styles.avatar} />
            {chat.isActive && <div className={styles.avatarActiveDot} />}
          </div>
          <div className={styles.userInfo}>
            <span className={styles.userName}>{chat.nickname}</span>
            {chat.isActive && (
              <div className={styles.activeRow}>
                <div className={styles.activeDot} />
                <span className={styles.activeText}>지금 활동 중</span>
              </div>
            )}
          </div>
        </div>

        <div className={styles.callRow}>
          <button type="button" className={styles.callButton}>
            <img src={callYIcon} alt="전화" className={styles.callIcon} />
            <span className={styles.callText}>전화</span>
          </button>
          <button type="button" className={styles.videoButton}>
            <img src={videoYIcon} alt="영상 통화" className={styles.videoIcon} />
            <span className={styles.videoText}>영상 통화</span>
          </button>
        </div>
      </div>

      <div className={styles.dateDivider}>
        <span className={styles.dateText}>2026년 6월 24일</span>
      </div>

      <div className={styles.messageList} ref={messageListRef}>
        {messages.map((msg) => (
          <div key={msg.id} className={styles.messageItem}>
            <div className={styles.messageMeta}>
              <span className={msg.isMe ? styles.myName : styles.otherName}>
                {msg.isMe ? '나' : chat.nickname}
              </span>
              <span className={styles.messageTime}>{msg.time}</span>
            </div>
            <div className={styles.messageBubble}>
              <div className={msg.isMe ? styles.myBar : styles.otherBar} />
              {msg.image ? (
                <img src={msg.image} alt="전송한 사진" className={styles.messageImage} />
              ) : (
                <span className={styles.messageContent}>{msg.content}</span>
              )}
            </div>
          </div>
        ))}
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
            <div className={styles.confirmButtons}>
              <button type="button" onClick={handleCancelSend} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" onClick={handleConfirmSend} className={styles.confirmYesButton}>
                네
              </button>
            </div>
          </div>
        </>
      )}

      <div className={styles.bottomSheet}>
        <button type="button" className={styles.photoButton} onClick={() => fileInputRef.current?.click()}>
          <img src={imageWIcon} alt="사진" className={styles.photoIcon} />
          <span className={styles.photoText}>사진 전송</span>
        </button>
        <button type="button" className={styles.voiceButton} onClick={handleOpenVoiceSheet}>
          <img src={micWIcon} alt="음성 입력" className={styles.voiceIcon} />
          <span className={styles.voiceText}>음성으로 입력하기</span>
        </button>
      </div>

      {showChatSheet && (
        <div className={styles.overlay} onClick={handleCloseSheet} />
      )}

      <div className={`${styles.chatSheet} ${showChatSheet ? styles.chatSheetOpen : styles.chatSheetClosed}`}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>채팅하기</span>
          <button type="button" onClick={handleCloseSheet} className={styles.sheetCancelButton}>
            취소
          </button>
        </div>

        <textarea
          className={styles.sheetTextarea}
          placeholder="음성으로 입력하거나 직접 입력하세요."
          value={chatText}
          onChange={(e) => setChatText(e.target.value)}
        />

        {voiceError && (
          <p className={styles.sheetVoiceError}>{voiceError}</p>
        )}

        <div className={styles.sheetFooter}>
          <button
            type="button"
            onClick={handleReRecord}
            disabled={voiceState === 'transcribing'}
            className={sheetVoiceButtonClass}
          >
            <img src={micWIcon} alt="" className={sheetVoiceIconClass} />
            <span className={styles.sheetVoiceText}>{sheetVoiceLabel}</span>
          </button>
          <button
            type="button"
            disabled={!chatText.trim()}
            className={chatText.trim() ? styles.sheetSubmitActive : styles.sheetSubmitInactive}
          >
            <img
              src={chatText.trim() ? sendIcon : sendGIcon}
              alt=""
              className={styles.sheetSubmitIcon}
            />
            <span className={chatText.trim() ? styles.sheetSubmitTextActive : styles.sheetSubmitTextInactive}>
              전송하기
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
