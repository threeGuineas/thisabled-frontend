import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './DefaultHomeScreen.styles'
import BottomNav, { type Tab } from '../../components/BottomNav'
import DefaultPostDetailScreen from './DefaultPostDetailScreen'
import DefaultWriteScreen from './DefaultWriteScreen'
import DefaultMyScreen from './DefaultMyScreen'
import DefaultChatScreen from './DefaultChatScreen'
import DefaultFriendScreen from './DefaultFriendScreen'
import { useProfileModal } from '../../hooks/useProfileModal'
import type { ProfileModalUser } from '../../components/BlindUserProfileModal'
import { getFeed, likePost, unlikePost, type Post } from '../../services/posts'
import { getMe, type MeProfile } from '../../services/users'
import { type DisabilityType } from '../../services/auth'
import { resolveImageUrl } from '../../utils/avatar'
import { FILTERS, categoryFor } from '../../utils/category'
import searchIcon from '../../assets/images/search.svg'
import writeIcon from '../../assets/images/write.svg'
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

export default function DefaultHomeScreen({ onLoggedOut, onModeChanged }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [activeFilter, setActiveFilter] = useState('전체')
  const [searchQuery, setSearchQuery] = useState('')
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
    'default',
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
      setPosts(prev => replace ? page.items : [...prev, ...page.items])
      setCursor(page.next_cursor)
      setHasMore(page.next_cursor !== null)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setFetchError(e.detail ?? '피드를 불러오지 못했습니다.')
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
      setPosts((prev) => (prev.map((p) => (p.id === post.id ? post : p))))
    }
  }

  if (activeTab === 'friend') {
    return <DefaultFriendScreen onTabChange={setActiveTab} />
  }

  if (activeTab === 'chat') {
    return (
      <DefaultChatScreen
        onTabChange={setActiveTab}
        targetUser={chatTarget}
        onTargetUserConsumed={() => setChatTarget(null)}
      />
    )
  }

  if (activeTab === 'my') {
    return <DefaultMyScreen onTabChange={setActiveTab} onLoggedOut={onLoggedOut} onModeChanged={onModeChanged} />
  }

  if (showWrite) {
    return (
      <DefaultWriteScreen
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
      <DefaultPostDetailScreen
        post={activePost}
        category={categoryFor(activePost.id)}
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

  const visiblePosts = posts.filter((post) => {
    if (activeFilter !== '전체' && categoryFor(post.id) !== activeFilter) return false
    if (searchQuery.trim() && !post.content.toLowerCase().includes(searchQuery.trim().toLowerCase())) return false
    return true
  })

  return (
    <div className={styles.container}>
      <div className={styles.searchWrapper}>
        <div className={styles.searchBox}>
          <img src={searchIcon} alt="" className={styles.searchIcon} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="검색어를 입력하세요"
            className={styles.searchInput}
            aria-label="게시글 검색"
          />
        </div>
      </div>

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
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="text-black/40 text-sm">피드를 불러오는 중...</span>
        </div>
      ) : fetchError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <span className="text-black/40 text-sm">{fetchError}</span>
          <button
            type="button"
            onClick={() => loadPosts(null, true)}
            className="rounded-xl bg-white shadow-sm px-5 py-3 text-black text-sm"
          >
            다시 시도
          </button>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="text-black/40 text-sm">아직 게시글이 없어요.</span>
        </div>
      ) : (
        <div className={styles.list}>
          {visiblePosts.map((post) => {
            const image = post.media[0]
            const category = categoryFor(post.id)
            return (
              <div key={post.id} className={styles.row} onClick={() => setActivePostId(post.id)}>
                <div className={styles.rowMain}>
                  <span className={styles.rowCategory}>{category}</span>
                  <p className={styles.rowBody}>{post.content.trim()}</p>
                  <div className={styles.rowMeta}>
                    <span className={styles.rowMetaText}>{timeAgo(post.created_at)}</span>
                    <span className={styles.rowMetaDot}>·</span>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); toggleLike(post) }}
                      className={styles.rowMetaButton}
                      aria-label="공감"
                    >
                      <img src={heartIcon} alt="" className={post.liked_by_me ? styles.rowMetaIconActive : styles.rowMetaIcon} />
                      <span className={post.liked_by_me ? styles.rowMetaTextActive : styles.rowMetaText}>{post.like_count}</span>
                    </button>
                    <span className={styles.rowMetaDot}>·</span>
                    <span className={styles.rowMetaButton}>
                      <img src={chatIcon} alt="" className={styles.rowMetaIcon} />
                      <span className={styles.rowMetaText}>{post.comment_count}</span>
                    </span>
                  </div>
                </div>

                {image && (
                  <img
                    src={resolveImageUrl(image.url)}
                    alt=""
                    className={styles.rowThumb}
                  />
                )}
              </div>
            )
          })}

          <div ref={sentinelRef} className="py-2">
            {isLoadingMore && (
              <p className="text-center text-black/30 text-sm py-4">불러오는 중...</p>
            )}
            {!hasMore && visiblePosts.length > 0 && (
              <p className="text-center text-black/20 text-sm py-4">마지막 게시글이에요.</p>
            )}
          </div>
        </div>
      )}

      <button type="button" onClick={() => setShowWrite(true)} className={styles.fab} aria-label="글 쓰기">
        <img src={writeIcon} alt="" className={styles.fabIcon} />
      </button>

      <BottomNav variant="default" active={activeTab} onChange={setActiveTab} />

      {profileModal}
    </div>
  )
}
