import { useEffect, useState } from 'react'
import styles from './DevPostDetailScreen.styles'
import typography from '../../styles/typography'
import colors from '../../styles/colors'
import {
  getComments,
  createComment,
  type Comment,
  type Post,
} from '../../services/posts'
import { simplifyText, getCommentSuggestions } from '../../services/comm'
import type { MeProfile } from '../../services/users'
import { useProfileModal } from '../../hooks/useProfileModal'
import type { ProfileModalUser } from '../../components/BlindUserProfileModal'
import { useAiNotice } from '../../hooks/useAiNotice'
import AiNoticeModal from '../../components/AiNoticeModal'
import { avatarUrlFor, resolveImageUrl } from '../../utils/avatar'
import backIcon from '../../assets/images/back.svg'
import heartIcon from '../../assets/images/heart.svg'
import heartBIcon from '../../assets/images/heart-b.svg'
import chatIcon from '../../assets/images/chat.svg'
import sendIcon from '../../assets/images/send.svg'
import sendGIcon from '../../assets/images/send-g.svg'

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
  post: Post
  me: MeProfile | null
  onBack: () => void
  onToggleLike: () => void
  onCommentCountChange: (count: number) => void
  onMessage: (user: ProfileModalUser) => void
}

// DEV-01: 화면 하나에 주요 행동(댓글 등록)을 강조하고, COMM-01(쉬운 문장 변환)·COMM-03(댓글 추천)을 기본 노출한다.
export default function DevPostDetailScreen({ post, me, onBack, onToggleLike, onCommentCountChange, onMessage }: Props) {
  const { openProfile, profileModal } = useProfileModal(onMessage, 'developmental')
  const { noticeOpen, runWithNotice, confirmNotice, cancelNotice } = useAiNotice()

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [commentText, setCommentText] = useState('')
  const [confirmingComment, setConfirmingComment] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // COMM-01 — 쉬운 문장 변환 결과와 원문을 전환해 볼 수 있고, AI 변환 결과임을 표시한다
  const [showSimplified, setShowSimplified] = useState(false)
  const [simplifiedText, setSimplifiedText] = useState<string | null>(null)
  const [isSimplifying, setIsSimplifying] = useState(false)
  const [simplifyError, setSimplifyError] = useState<string | null>(null)

  // COMM-03 — 게시물 맥락 기반 댓글 후보 제안. 선택해도 입력창에 채우기만 하고 자동 게시하지 않는다.
  const [showCommentAiPanel, setShowCommentAiPanel] = useState(false)
  const [commentSuggestions, setCommentSuggestions] = useState<string[] | null>(null)
  const [isLoadingCommentAi, setIsLoadingCommentAi] = useState(false)
  const [commentAiError, setCommentAiError] = useState<string | null>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    setIsLoading(true)
    setFetchError(null)
    getComments(post.id)
      .then((page) => {
        setComments(page.items)
        onCommentCountChange(page.items.length)
      })
      .catch((err: unknown) => {
        const e = err as { detail?: string }
        setFetchError(e.detail ?? '댓글을 불러오지 못했어요.')
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id])

  const handleSimplify = () => {
    if (showSimplified) {
      setShowSimplified(false)
      return
    }
    if (simplifiedText) {
      setShowSimplified(true)
      return
    }
    runWithNotice(async () => {
      setIsSimplifying(true)
      setSimplifyError(null)
      try {
        const result = await simplifyText(post.content)
        setSimplifiedText(result.result)
        setShowSimplified(true)
      } catch (err: unknown) {
        const e = err as { detail?: string }
        setSimplifyError(e.detail ?? '쉬운 문장으로 바꾸지 못했어요.')
      } finally {
        setIsSimplifying(false)
      }
    })
  }

  // COMM-03: 버튼을 직접 눌렀을 때만 게시물 맥락을 바탕으로 댓글 후보를 요청한다(COMM-05)
  const handleOpenCommentAiPanel = () => {
    setShowCommentAiPanel(true)
    if (commentSuggestions) return
    runWithNotice(async () => {
      setIsLoadingCommentAi(true)
      setCommentAiError(null)
      try {
        const result = await getCommentSuggestions(post.id)
        setCommentSuggestions(result.suggestions)
      } catch (err: unknown) {
        const e = err as { detail?: string }
        setCommentAiError(e.detail ?? 'AI 추천을 불러오지 못했어요.')
      } finally {
        setIsLoadingCommentAi(false)
      }
    })
  }

  // 후보를 선택하면 입력창에 채우기만 하고, 사용자가 확인 후 직접 등록한다(COMM-03)
  const applyCommentSuggestion = (text: string) => {
    setCommentText(text)
    setShowCommentAiPanel(false)
  }

  const handleSubmitComment = async () => {
    if (!commentText.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const created = await createComment(post.id, commentText.trim())
      setComments((prev) => {
        const next = [...prev, created]
        onCommentCountChange(next.length)
        return next
      })
      setCommentText('')
      setConfirmingComment(false)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSubmitError(e.detail ?? '댓글 등록에 실패했어요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const isAuthorMine = !!(me && post.author.id && String(post.author.id) === String(me.id))
  const authorNickname = isAuthorMine ? me!.nickname : post.author.nickname
  const authorAvatarUrl = avatarUrlFor(post.author.profile_image_url, String(post.author.id ?? post.id))
  const handleOpenAuthorProfile = () => {
    if (isAuthorMine) return
    openProfile({ id: post.author.id, nickname: authorNickname, bio: undefined, avatarUrl: authorAvatarUrl })
  }

  const canSend = commentText.trim().length > 0 && !isSubmitting

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.backIcon} />
        </button>
        <span className={styles.headerTitle}>게시글</span>
      </div>

      <div className={styles.body}>
        <div className={styles.userInfo}>
          <button
            type="button"
            onClick={handleOpenAuthorProfile}
            disabled={isAuthorMine}
            aria-label={isAuthorMine ? undefined : `${authorNickname}님 프로필 보기`}
          >
            {!post.author.profile_image_url && isAuthorMine ? (
              <div className={`${styles.avatarFallback} bg-[#22B07D] text-white`}>
                {authorNickname[0].toUpperCase()}
              </div>
            ) : (
              <img src={authorAvatarUrl} alt="" className={styles.avatar} />
            )}
          </button>
          <button
            type="button"
            onClick={handleOpenAuthorProfile}
            disabled={isAuthorMine}
            className={styles.userMeta}
            aria-label={isAuthorMine ? undefined : `${authorNickname}님 프로필 보기`}
          >
            <span className={styles.nickname}>{authorNickname}</span>
            <span className={styles.time}>{timeAgo(post.created_at)}</span>
          </button>
        </div>

        {!showSimplified && <p className={styles.content}>{post.content}</p>}

        <div className={styles.commmSection}>
          <div className={styles.commmToggleRow}>
            <button type="button" onClick={handleSimplify} disabled={isSimplifying} className={styles.commmToggleButton}>
              <span className={styles.commmToggleText}>
                {isSimplifying ? '바꾸는 중...' : showSimplified ? '원래 글 보기' : '쉬운 문장으로 보기'}
              </span>
            </button>
            {showSimplified && <span className={styles.commmBadge}>AI 변환 결과</span>}
          </div>
          {simplifyError && <p className={styles.commmErrorText}>{simplifyError}</p>}
          {showSimplified && simplifiedText && (
            <p className={styles.commmResultText}>{simplifiedText}</p>
          )}
          {!showSimplified && !simplifiedText && !isSimplifying && (
            <p className={styles.commmLoadingText}>어려운 문장을 쉬운 문장으로 바꿔볼 수 있어요.</p>
          )}
        </div>

        {post.media.length > 0 && (
          <div className={styles.mediaList}>
            {post.media.map((media) =>
              media.media_type === 'video' ? (
                <video key={media.id} src={resolveImageUrl(media.url)} controls className={styles.mediaImage} />
              ) : (
                <img
                  key={media.id}
                  src={resolveImageUrl(media.url)}
                  alt={media.description ?? ''}
                  className={styles.mediaImage}
                />
              ),
            )}
          </div>
        )}

        <div className={styles.statsRow}>
          <button type="button" onClick={onToggleLike} className={styles.statButton} aria-label="공감">
            <img
              src={post.liked_by_me ? heartBIcon : heartIcon}
              alt=""
              className={post.liked_by_me ? styles.statIconActive : styles.statIcon}
            />
            <span className={post.liked_by_me ? styles.statTextActive : styles.statText}>{post.like_count}</span>
          </button>
          <div className={styles.statButton}>
            <img src={chatIcon} alt="" className={styles.statIcon} />
            <span className={styles.statText}>{post.comment_count}</span>
          </div>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.commentsSection}>
        <div className="flex items-center justify-between gap-3">
          <span className={styles.commentsHeader}>
            댓글 <span className={styles.commentsHeaderCount}>{comments.length}</span>
          </span>
          <button
            type="button"
            onClick={handleOpenCommentAiPanel}
            className={[colors.bg.green01, 'flex items-center gap-1.5 rounded-full px-3.5 py-2 active:opacity-80'].join(' ')}
          >
            <img src={chatIcon} alt="" className="w-4 h-4" />
            <span className={[typography.sm, typography.bold, colors.text.green].join(' ')}>댓글 추천 받기</span>
          </button>
        </div>

        {isLoading ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>댓글을 불러오는 중이에요...</span>
          </div>
        ) : fetchError ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>{fetchError}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>아직 댓글이 없어요.{'\n'}첫 댓글을 남겨보세요!</span>
          </div>
        ) : (
          <div className={styles.commentList}>
            {comments.map((comment) => {
              const authorId = comment.author.id
              const isMine = !!(me && authorId && String(authorId) === String(me.id))
              const nickname = isMine ? me!.nickname : comment.author.nickname
              const avatarUrl = avatarUrlFor(comment.author.profile_image_url, String(authorId ?? comment.id))
              const handleOpenProfile = () => {
                if (isMine) return
                openProfile({ id: authorId, nickname, bio: undefined, avatarUrl })
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
                        <div className={`${styles.commentAvatarFallback} bg-[#22B07D] text-white`}>
                          {me!.nickname[0].toUpperCase()}
                        </div>
                      ) : (
                        <img src={avatarUrl} alt="" className={styles.commentAvatar} />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      disabled={isMine}
                      className={styles.commentMeta}
                      aria-label={isMine ? undefined : `${nickname}님 프로필 보기`}
                    >
                      <span className={styles.commentNickname}>{nickname}</span>
                      <span className={styles.commentTime}>{timeAgo(comment.created_at)}</span>
                    </button>
                  </div>
                  <p className={styles.commentBody}>{comment.content}</p>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className={styles.inputBar}>
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="댓글을 입력하세요"
          className={styles.textInput}
          disabled={isSubmitting}
          aria-label="댓글 입력"
        />
        <button
          type="button"
          onClick={() => canSend && setConfirmingComment(true)}
          disabled={!canSend}
          className={canSend ? styles.sendButtonActive : styles.sendButtonInactive}
          aria-label="댓글 등록"
        >
          <img src={canSend ? sendIcon : sendGIcon} alt="" className={styles.sendIcon} />
        </button>
      </div>

      {/* DEV-01: 게시(댓글 등록) 전 명확한 확인을 제공한다 */}
      {confirmingComment && (
        <>
          <div className={styles.confirmOverlay} onClick={() => !isSubmitting && setConfirmingComment(false)} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>이 댓글을 올릴까요?</p>
            <p className={styles.confirmPreview}>{commentText.trim()}</p>
            {submitError && <p className={styles.confirmErrorText}>{submitError}</p>}
            <div className={styles.confirmButtons}>
              <button type="button" disabled={isSubmitting} onClick={() => setConfirmingComment(false)} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" disabled={isSubmitting} onClick={handleSubmitComment} className={styles.confirmYesButton}>
                {isSubmitting ? '올리는 중...' : '올리기'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* COMM-03 댓글 추천 AI 패널 */}
      {showCommentAiPanel && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShowCommentAiPanel(false)} />
          <div className="fixed bottom-0 left-0 right-0 z-50 max-h-[70vh] overflow-y-auto rounded-t-3xl bg-white px-6 pt-6 pb-10 shadow-2xl">
            <p className={[typography.lg, typography.bold, 'text-black text-center mb-1'].join(' ')}>댓글 추천 AI</p>
            <p className={[typography.sm, typography.regular, colors.text.gray01, 'text-center mb-5'].join(' ')}>
              눌러서 입력창에 채워 넣을 수 있어요. 내용은 등록 전에 다시 확인해요.
            </p>

            {isLoadingCommentAi ? (
              <p className={[typography.base, typography.medium, colors.text.gray01, 'text-center py-6'].join(' ')}>생각하는 중이에요...</p>
            ) : commentAiError ? (
              <p className={[typography.sm, typography.medium, 'text-red-500 text-center py-6'].join(' ')}>{commentAiError}</p>
            ) : (
              commentSuggestions && commentSuggestions.length > 0 && (
                <div className="flex flex-col gap-2">
                  {commentSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => applyCommentSuggestion(suggestion)}
                      className={['w-full text-left rounded-2xl border-2', colors.border.gray03, 'px-4 py-3.5 active:opacity-80'].join(' ')}
                    >
                      <span className={[typography.base, typography.medium, 'text-black leading-relaxed'].join(' ')}>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )
            )}
          </div>
        </>
      )}

      {noticeOpen && <AiNoticeModal onConfirm={confirmNotice} onCancel={cancelNotice} />}

      {profileModal}
    </div>
  )
}
