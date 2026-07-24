import { useEffect, useState } from 'react'
import styles from './DefaultPostDetailScreen.styles'
import {
  getComments,
  createComment,
  type Comment,
  type Post,
} from '../services/posts'
import type { MeProfile } from '../services/users'
import { useProfileModal } from '../hooks/useProfileModal'
import type { ProfileModalUser } from '../components/BlindUserProfileModal'
import { avatarUrlFor, resolveImageUrl } from '../utils/avatar'
import backIcon from '../assets/images/back.svg'
import heartIcon from '../assets/images/heart.svg'
import heartBIcon from '../assets/images/heart-b.svg'
import chatIcon from '../assets/images/chat.svg'
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
  post: Post
  category: string
  me: MeProfile | null
  onBack: () => void
  onToggleLike: () => void
  onCommentCountChange: (count: number) => void
  onMessage: (user: ProfileModalUser) => void
}

export default function DefaultPostDetailScreen({ post, category, me, onBack, onToggleLike, onCommentCountChange, onMessage }: Props) {
  const { openProfile, profileModal } = useProfileModal(onMessage, 'default')

  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [commentText, setCommentText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

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
        setFetchError(e.detail ?? '댓글을 불러오지 못했습니다.')
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [post.id])

  const handleSubmit = async () => {
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
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSubmitError(e.detail ?? '댓글 등록에 실패했습니다.')
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
      </div>

      <div className={styles.body}>
        <span className={styles.category}>{category}</span>

        <div className={styles.userInfo}>
          <button
            type="button"
            onClick={handleOpenAuthorProfile}
            disabled={isAuthorMine}
            aria-label={isAuthorMine ? undefined : `${authorNickname}님 프로필 보기`}
          >
            {!post.author.profile_image_url && isAuthorMine ? (
              <div className={`${styles.avatarFallback} bg-[#FFD60A]`}>
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

        <p className={styles.content}>{post.content}</p>

        {post.media.length > 0 && (
          <div className={styles.mediaList}>
            {post.media.map((media) => (
              <img
                key={media.id}
                src={resolveImageUrl(media.url)}
                alt={media.description ?? ''}
                className={styles.mediaImage}
              />
            ))}
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
        <span className={styles.commentsHeader}>
          댓글 <span className={styles.commentsHeaderCount}>{comments.length}</span>
        </span>

        {isLoading ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>댓글을 불러오는 중...</span>
          </div>
        ) : fetchError ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>{fetchError}</span>
          </div>
        ) : comments.length === 0 ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyStateText}>아직 댓글이 없어요. 첫 댓글을 남겨보세요!</span>
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
                        <div className={`${styles.commentAvatarFallback} bg-[#FFD60A]`}>
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
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit()
          }}
        />
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className={`${styles.sendButton} ${canSend ? styles.sendButtonActive : styles.sendButtonInactive}`}
          aria-label="댓글 등록"
        >
          <img src={sendIcon} alt="" className={canSend ? styles.sendIcon : styles.sendIconInactive} />
        </button>
      </div>

      {submitError && (
        <p className="fixed bottom-16 left-0 right-0 px-5 text-center text-xs text-red-500">{submitError}</p>
      )}

      {profileModal}
    </div>
  )
}
