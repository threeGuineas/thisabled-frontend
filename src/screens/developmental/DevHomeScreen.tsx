import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './DevHomeScreen.styles'
import BottomNav from '../../components/BottomNav'
import DevPostDetailScreen from './DevPostDetailScreen'
import DevWriteScreen from './DevWriteScreen'
import DevMyScreen from './DevMyScreen'
import DevChatScreen from './DevChatScreen'
import DevFriendScreen from './DevFriendScreen'
import { useProfileModal } from '../../hooks/useProfileModal'
import { usePersistedTab } from '../../hooks/usePersistedTab'
import type { ProfileModalUser } from '../../components/BlindUserProfileModal'
import { getFeed, likePost, unlikePost, type Post, type Author } from '../../services/posts'
import { getMe, type MeProfile } from '../../services/users'
import { type DisabilityType } from '../../services/auth'
import { resolveImageUrl, avatarUrlFor } from '../../utils/avatar'
import { FILTERS, categoryFor } from '../../utils/category'
import writeIcon from '../../assets/images/write-w.svg'
import heartIcon from '../../assets/images/heart.svg'
import chatIcon from '../../assets/images/chat.svg'

const LIMIT = 20

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
  onLoggedOut: () => void
  onModeChanged: (mode: DisabilityType) => void
}

// DEV-01: 검색창·카테고리 필터 없이 "글쓰기" 하나만 강조하는 발달장애 모드 홈 화면.
export default function DevHomeScreen({ onLoggedOut, onModeChanged }: Props) {
  const [activeTab, setActiveTab] = usePersistedTab()
  const [activeFilter, setActiveFilter] = useState('전체')
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [showWrite, setShowWrite] = useState(false)

  const [me, setMe] = useState<MeProfile | null>(null)
  const [chatTarget, setChatTarget] = useState<{ id: string; nickname: string; avatarUrl: string } | null>(null)

  const openChatWith = (id: string | null, nickname: string, avatarUrl: string) => {
    if (!id) return
    setChatTarget({ id, nickname, avatarUrl })
    setActiveTab('chat')
  }

  const { profileModal } = useProfileModal(
    (user: ProfileModalUser) => openChatWith(user.id, user.nickname, user.avatarUrl),
    'developmental',
  )

  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (currentCursor: string | null, replace: boolean) => {
    if (replace) {
      setIsLoading(true)
      setFetchError(null)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const page = await getFeed(currentCursor, LIMIT)
      setPosts((prev) => (replace ? page.items : [...prev, ...page.items]))
      setCursor(page.next_cursor)
      setHasMore(page.next_cursor !== null)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setFetchError(e.detail ?? '글 목록을 불러오지 못했어요.')
    } finally {
      if (replace) setIsLoading(false)
      else setIsLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    getMe().then(setMe).catch(() => {})
  }, [])

  useEffect(() => {
    loadPosts(null, true)
  }, [loadPosts])

  // 첫 진입(마운트) 시에만 스크롤을 맨 위로 — 탭 전환마다 매번 초기화하지는 않는다
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadPosts(cursor, false)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, cursor, loadPosts])

  const toggleLike = async (post: Post) => {
    const wasLiked = post.liked_by_me
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? { ...p, liked_by_me: !wasLiked, like_count: p.like_count + (wasLiked ? -1 : 1) }
          : p,
      ),
    )
    try {
      const result = wasLiked ? await unlikePost(post.id) : await likePost(post.id)
      setPosts((prev) =>
        prev.map((p) => (p.id === post.id ? { ...p, liked_by_me: result.liked, like_count: result.like_count } : p)),
      )
    } catch {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? post : p)))
    }
  }

  if (activeTab === 'friend') {
    return (
      <DevFriendScreen
        onTabChange={setActiveTab}
        onOpenChat={(friend: Author) =>
          openChatWith(friend.id, friend.nickname, avatarUrlFor(friend.profile_image_url))
        }
      />
    )
  }

  if (activeTab === 'chat') {
    return (
      <DevChatScreen
        onTabChange={setActiveTab}
        targetUser={chatTarget}
        onTargetUserConsumed={() => setChatTarget(null)}
      />
    )
  }

  if (activeTab === 'my') {
    return <DevMyScreen onTabChange={setActiveTab} onLoggedOut={onLoggedOut} onModeChanged={onModeChanged} />
  }

  if (showWrite) {
    return (
      <DevWriteScreen
        onBack={() => {
          setShowWrite(false)
          loadPosts(null, true)
        }}
      />
    )
  }

  const activePost = activePostId ? posts.find((p) => p.id === activePostId) ?? null : null
  if (activePost) {
    return (
      <DevPostDetailScreen
        post={activePost}
        me={me}
        onBack={() => setActivePostId(null)}
        onToggleLike={() => toggleLike(activePost)}
        onCommentCountChange={(count: number) =>
          setPosts((prev) => prev.map((p) => (p.id === activePost.id ? { ...p, comment_count: count } : p)))
        }
        onMessage={(user: ProfileModalUser) => {
          setActivePostId(null)
          openChatWith(user.id, user.nickname, user.avatarUrl)
        }}
      />
    )
  }

  const visiblePosts = activeFilter === '전체' ? posts : posts.filter((post) => categoryFor(post.category) === activeFilter)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>홈</span>
      </div>

      <button type="button" onClick={() => setShowWrite(true)} className={styles.writeButton}>
        <img src={writeIcon} alt="" className={styles.writeButtonIcon} />
        <span className={styles.writeButtonText}>글쓰기</span>
      </button>

      <div className={styles.filterContainer}>
        <div className={styles.filterInner}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setActiveFilter(f)}
              className={f === activeFilter ? styles.filterActive : styles.filterInactive}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>글을 불러오는 중이에요...</span>
        </div>
      ) : fetchError ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>{fetchError}</span>
          <button type="button" onClick={() => loadPosts(null, true)} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>
            {activeFilter === '전체' ? '아직 글이 없어요.\n첫 번째 글을 써보세요!' : `'${activeFilter}' 글이 아직 없어요.`}
          </span>
        </div>
      ) : (
        <div className={styles.list}>
          {visiblePosts.map((post) => {
            const media = post.media[0]
            const isVideo = media?.media_type === 'video'
            return (
              <div key={post.id} className={styles.row} onClick={() => setActivePostId(post.id)}>
                <span className={styles.rowCategory}>{categoryFor(post.category)}</span>
                <div className={styles.rowTopRow}>
                  {media && (
                    <div className={styles.rowThumbWrapper}>
                      {isVideo ? (
                        <video
                          src={resolveImageUrl(media.url)}
                          muted
                          playsInline
                          preload="metadata"
                          className={styles.rowThumb}
                        />
                      ) : (
                        <img src={resolveImageUrl(media.url)} alt="" className={styles.rowThumb} />
                      )}
                      {isVideo && (
                        <span className={styles.rowThumbPlayBadge}>
                          <svg viewBox="0 0 24 24" className={styles.rowThumbPlayIcon} fill="white">
                            <path d="M8 5.5v13l11-6.5z" />
                          </svg>
                        </span>
                      )}
                    </div>
                  )}
                  <p className={styles.rowBody}>{post.content.trim()}</p>
                </div>
                <div className={styles.rowMeta}>
                  <span className={styles.rowTime}>{timeAgo(post.created_at)}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleLike(post)
                    }}
                    className={styles.rowMetaButton}
                    aria-label="공감"
                  >
                    <img src={heartIcon} alt="" className={post.liked_by_me ? styles.rowMetaIconActive : styles.rowMetaIcon} />
                    <span className={post.liked_by_me ? styles.rowMetaTextActive : styles.rowMetaText}>{post.like_count}</span>
                  </button>
                  <span className={styles.rowMetaButton}>
                    <img src={chatIcon} alt="" className={styles.rowMetaIcon} />
                    <span className={styles.rowMetaText}>{post.comment_count}</span>
                  </span>
                </div>
              </div>
            )
          })}

          <div ref={sentinelRef} className="py-2">
            {isLoadingMore && <p className={styles.loadingMoreText}>불러오는 중...</p>}
            {!hasMore && posts.length > 0 && <p className={styles.loadingMoreText}>마지막 글이에요.</p>}
          </div>
        </div>
      )}

      <BottomNav variant="developmental" active={activeTab} onChange={setActiveTab} />

      {profileModal}
    </div>
  )
}
