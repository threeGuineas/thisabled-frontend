import { useState } from 'react'
import styles from './BlindUserProfileModal.styles'
import { sendFriendRequest, blockUser } from '../services/friends'

export interface ProfileModalUser {
  id: string | null
  nickname: string
  // null: 자기소개를 비워둔 것으로 확인됨 → "아직 자기소개가 없어요" 표시
  // undefined: 이 화면에서 자기소개를 조회하지 않음(API 미제공) → 영역 자체를 숨김
  bio: string | null | undefined
  avatarUrl: string
}

interface Props {
  user: ProfileModalUser
  variant?: 'add' | 'friend'
  onClose: () => void
  onMessage?: () => void
  onUnfriend?: () => void
  onBlock?: () => void
}

export default function BlindUserProfileModal({ user, variant = 'add', onClose, onMessage, onUnfriend, onBlock }: Props) {
  const [requestSent, setRequestSent] = useState(false)
  const [isSendingRequest, setIsSendingRequest] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const [confirmBlock, setConfirmBlock] = useState(false)
  const [isBlocking, setIsBlocking] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)

  const handleSendRequest = async () => {
    if (!user.id || isSendingRequest) return
    setIsSendingRequest(true)
    setRequestError(null)
    try {
      await sendFriendRequest(user.id)
      setRequestSent(true)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setRequestError(e.detail ?? '친구 요청에 실패했습니다.')
    } finally {
      setIsSendingRequest(false)
    }
  }

  const handleBlock = async () => {
    if (!user.id || isBlocking) return
    setIsBlocking(true)
    setBlockError(null)
    try {
      await blockUser(user.id)
      onClose()
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setBlockError(e.detail ?? '차단에 실패했습니다.')
    } finally {
      setIsBlocking(false)
    }
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {!confirmBlock && (
          <button type="button" aria-label="닫기" onClick={onClose} className={styles.closeButton}>
            ✕
          </button>
        )}

        {confirmBlock ? (
          <div className="pt-2">
            <p className={styles.confirmText}>{user.nickname}님을 차단하시겠습니까?</p>
            <p className={styles.confirmSubText}>차단하면 서로의 게시물과 댓글을 볼 수 없어요.</p>
            {blockError && <p className="mt-2 text-center text-xs text-red-400">{blockError}</p>}
            <div className={styles.confirmButtons}>
              <button
                type="button"
                onClick={() => setConfirmBlock(false)}
                disabled={isBlocking}
                className={styles.confirmNoButton}
              >
                아니오
              </button>
              <button type="button" onClick={handleBlock} disabled={isBlocking} className={styles.confirmYesButton}>
                {isBlocking ? '처리 중...' : '차단하기'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className={styles.avatarWrapper}>
              <img src={user.avatarUrl} alt={`${user.nickname} 프로필`} className={styles.avatar} />
              <span className={styles.nickname}>{user.nickname}</span>
              {user.bio !== undefined && <p className={styles.bio}>{user.bio ?? '아직 자기소개가 없어요.'}</p>}
            </div>

            <div className={styles.actions}>
              {variant === 'add' ? (
                <>
                  <button
                    type="button"
                    onClick={handleSendRequest}
                    disabled={requestSent || isSendingRequest || !user.id}
                    className={requestSent ? styles.requestButtonSent : styles.requestButton}
                    aria-label={`${user.nickname}님에게 친구 요청 보내기`}
                  >
                    {requestSent ? '친구 요청 완료' : isSendingRequest ? '요청 보내는 중...' : '친구 요청'}
                  </button>
                  {requestError && <p className="text-center text-xs text-red-400">{requestError}</p>}
                  {onMessage && (
                    <button
                      type="button"
                      onClick={onMessage}
                      className={styles.messageButton}
                      aria-label={`${user.nickname}님에게 메시지 보내기`}
                    >
                      메시지 보내기
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setConfirmBlock(true)}
                    className={styles.blockButton}
                    aria-label={`${user.nickname}님 차단하기`}
                  >
                    차단하기
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={onUnfriend}
                    className={styles.messageButton}
                    aria-label={`${user.nickname}님과 친구 끊기`}
                  >
                    친구 끊기
                  </button>
                  <button
                    type="button"
                    onClick={onBlock}
                    className={styles.blockButton}
                    aria-label={`${user.nickname}님 차단하기`}
                  >
                    차단하기
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
