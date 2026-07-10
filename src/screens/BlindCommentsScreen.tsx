import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './BlindCommentsScreen.styles'
import { useVoiceInput } from '../hooks/useVoiceInput'
import {
  getComments,
  createComment,
  updateComment,
  deleteComment,
  type Comment,
} from '../services/posts'
import { getMe, type MeProfile } from '../services/users'
import { useProfileModal } from '../hooks/useProfileModal'
import { avatarUrlFor } from '../utils/avatar'
import backGIcon from '../assets/images/back-g.svg'
import chatIcon from '../assets/images/chat.svg'
import micWIcon from '../assets/images/mic-w.svg'
import sendGIcon from '../assets/images/send-g.svg'
import sendIcon from '../assets/images/send.svg'

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

interface Props {
  postId: string
  authorNickname: string
  onBack: () => void
  onCommentCountChange: (count: number) => void
  onMessage: () => void
}

export default function BlindCommentsScreen({ postId, authorNickname, onBack, onCommentCountChange, onMessage }: Props) {
  const [me, setMe] = useState<MeProfile | null>(null)
  const { openProfile, profileModal } = useProfileModal(onMessage)

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [showSheet, setShowSheet] = useState(false)
  const [editingComment, setEditingComment] = useState<Comment | null>(null)
  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const onCommentCountChangeRef = useRef(onCommentCountChange)
  useEffect(() => { onCommentCountChangeRef.current = onCommentCountChange }, [onCommentCountChange])

  const { voiceState, voiceError, toggleRecording, stopRecording } = useVoiceInput((text) => {
    setCommentText(prev => prev ? `${prev} ${text}` : text)
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    getMe().then(setMe).catch(() => {})
  }, [])

  const loadComments = useCallback(async () => {
    setIsLoading(true)
    setFetchError(null)
    try {
      const page = await getComments(postId)
      setComments(page.items)
      onCommentCountChangeRef.current(page.items.length)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setFetchError(e.detail ?? '댓글을 불러오지 못했습니다.')
    } finally {
      setIsLoading(false)
    }
  }, [postId])

  useEffect(() => {
    loadComments()
  }, [loadComments])

  const handleOpenAdd = () => {
    setEditingComment(null)
    setCommentText('')
    setSubmitError(null)
    setShowSheet(true)
  }

  const handleOpenEdit = (comment: Comment) => {
    setEditingComment(comment)
    setCommentText(comment.content)
    setSubmitError(null)
    setShowSheet(true)
  }

  const handleCloseSheet = () => {
    stopRecording()
    setShowSheet(false)
    setEditingComment(null)
    setCommentText('')
    setSubmitError(null)
  }

  const handleSubmit = async () => {
    if (!commentText.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      if (editingComment) {
        const updated = await updateComment(editingComment.id, commentText.trim())
        setComments(prev => prev.map(c => (c.id === updated.id ? updated : c)))
      } else {
        const created = await createComment(postId, commentText.trim())
        setComments(prev => {
          const next = [...prev, created]
          onCommentCountChangeRef.current(next.length)
          return next
        })
      }
      setShowSheet(false)
      setEditingComment(null)
      setCommentText('')
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSubmitError(e.detail ?? (editingComment ? '댓글 수정에 실패했습니다.' : '댓글 등록에 실패했습니다.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (comment: Comment) => {
    if (!window.confirm('댓글을 삭제할까요? 삭제한 댓글은 복구할 수 없어요.')) return
    setActionError(null)
    setDeletingId(comment.id)
    try {
      await deleteComment(comment.id)
      setComments(prev => {
        const next = prev.filter(c => c.id !== comment.id)
        onCommentCountChangeRef.current(next.length)
        return next
      })
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setActionError(e.detail ?? '댓글 삭제에 실패했습니다.')
    } finally {
      setDeletingId(null)
    }
  }

  const voiceButtonClass =
    voiceState === 'recording' ? styles.voiceButtonRecording
    : voiceState === 'transcribing' ? styles.voiceButtonTranscribing
    : styles.voiceButton

  const voiceIconClass =
    voiceState === 'recording' ? styles.voiceIconRecording : styles.voiceIcon

  const voiceLabel =
    voiceState === 'recording' ? '녹음 중...'
    : voiceState === 'transcribing' ? '인식 중...'
    : voiceState === 'error' ? '다시 시도'
    : '음성 입력'

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton}>
          <img src={backGIcon} alt="뒤로 가기" className={styles.backIcon} />
        </button>
        <div className={styles.headerTextGroup}>
          <span className={styles.headerTitle}>
            댓글 <span className={styles.headerCount}>{comments.length}개</span>
          </span>
          <span className={styles.headerSubtitle}>{authorNickname} 님의 글</span>
        </div>
      </div>

      <div className={styles.divider} />

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="text-white/50 text-sm">댓글을 불러오는 중...</span>
        </div>
      ) : fetchError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <span className="text-white/50 text-sm">{fetchError}</span>
          <button
            type="button"
            onClick={loadComments}
            className="rounded-xl bg-[#1F1F1F] px-5 py-3 text-white text-sm"
          >
            다시 시도
          </button>
        </div>
      ) : (
        <div className={styles.commentList}>
          {actionError && (
            <p className="text-red-400 text-xs">{actionError}</p>
          )}

          {comments.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-20">
              <span className="text-white/50 text-sm">아직 댓글이 없어요. 첫 댓글을 남겨보세요!</span>
            </div>
          ) : (
            comments.map((comment) => {
              const authorId = comment.author.id
              const isMine = !!(me && authorId && String(authorId) === String(me.id))
              const nickname = isMine ? me!.nickname : comment.author.nickname
              const avatarUrl = avatarUrlFor(comment.author.profile_image_url, String(authorId ?? comment.id))
              const handleOpenProfile = () => {
                if (isMine) return
                openProfile({ id: authorId, nickname, bio: null, avatarUrl })
              }

              return (
                <div key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentTop}>
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      disabled={isMine}
                      aria-label={isMine ? undefined : `${nickname}님 프로필 보기`}
                    >
                      {!comment.author.profile_image_url && isMine ? (
                        <div className={`${styles.avatar} bg-[#FFD60A] flex items-center justify-center text-black font-bold text-base`}>
                          {me!.nickname[0].toUpperCase()}
                        </div>
                      ) : (
                        <img src={avatarUrl} alt="" className={styles.avatar} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      disabled={isMine}
                      className={styles.commentMeta}
                      aria-label={isMine ? undefined : `${nickname}님 프로필 보기`}
                    >
                      <span className={styles.nickname}>{nickname}</span>
                      <span className={styles.time}>{timeAgo(comment.created_at)}</span>
                    </button>
                  </div>
                  <p className={styles.commentBody}>
                    {comment.content}
                    {comment.updated_at && <span className={styles.editedTag}>(수정됨)</span>}
                  </p>
                  {isMine && (
                    <div className={styles.commentActions}>
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(comment)}
                        disabled={deletingId === comment.id}
                        className={styles.commentActionButton}
                      >
                        수정
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(comment)}
                        disabled={deletingId === comment.id}
                        className={styles.commentActionButtonDanger}
                      >
                        {deletingId === comment.id ? '삭제 중...' : '삭제'}
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      <button type="button" onClick={handleOpenAdd} className={styles.floatingButton}>
        <img src={chatIcon} alt="댓글 달기" className={styles.chatIcon} />
        <span className={styles.addCommentText}>댓글 달기</span>
      </button>

      {/* 오버레이 */}
      {showSheet && (
        <div className={styles.overlay} onClick={handleCloseSheet} />
      )}

      {/* 바텀시트 */}
      <div className={`${styles.bottomSheet} ${showSheet ? styles.bottomSheetOpen : styles.bottomSheetClosed}`}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>{editingComment ? '댓글 수정' : '댓글 달기'}</span>
          <button type="button" onClick={handleCloseSheet} className={styles.sheetCancelButton}>
            취소
          </button>
        </div>

        <textarea
          className={styles.sheetTextarea}
          placeholder="댓글을 입력하세요. 아래 마이크로 음성 입력도 가능해요."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          disabled={isSubmitting}
        />

        {voiceError && (
          <p className="mt-1 text-xs text-red-400">{voiceError}</p>
        )}

        {submitError && (
          <p className="mt-1 text-xs text-red-400">{submitError}</p>
        )}

        <div className={styles.sheetFooter}>
          <button
            type="button"
            onClick={toggleRecording}
            disabled={voiceState === 'transcribing' || isSubmitting}
            className={voiceButtonClass}
          >
            <img src={micWIcon} alt="" className={voiceIconClass} />
            <span className={styles.voiceText}>{voiceLabel}</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!commentText.trim() || isSubmitting}
            className={commentText.trim() && !isSubmitting ? styles.submitButtonActive : styles.submitButtonInactive}
          >
            <img
              src={commentText.trim() && !isSubmitting ? sendIcon : sendGIcon}
              alt=""
              className={styles.submitIcon}
            />
            <span className={commentText.trim() && !isSubmitting ? styles.submitTextActive : styles.submitTextInactive}>
              {isSubmitting ? '처리 중...' : editingComment ? '수정 완료' : '댓글 달기'}
            </span>
          </button>
        </div>
      </div>

      {profileModal}
    </div>
  )
}
