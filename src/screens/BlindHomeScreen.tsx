import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './BlindHomeScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import BlindCommentsScreen from './BlindCommentsScreen'
import BlindWriteScreen from './BlindWriteScreen'
import BlindMyScreen from './BlindMyScreen'
import BlindChatScreen from './BlindChatScreen'
import BlindFriendScreen from './BlindFriendScreen'
import { useProfileModal } from '../hooks/useProfileModal'
import { getFeed, getPost, likePost, unlikePost, type Post, type PostMediaItem } from '../services/posts'
import { getMe, type MeProfile } from '../services/users'
import { speakText } from '../services/voice'
import { avatarUrlFor, resolveImageUrl } from '../utils/avatar'
import searchWIcon from '../assets/images/search-w.svg'
import plusIcon from '../assets/images/plus.svg'
import heartWIcon from '../assets/images/heart-w.svg'
import heartBIcon from '../assets/images/heart-b.svg'
import chatWIcon from '../assets/images/chat-w.svg'
import micWIcon from '../assets/images/mic-w.svg'

const LIMIT = 20
const DESCRIPTION_FALLBACK_TEXT = '이미지 설명을 아직 준비하지 못했어요.'

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function BlindHomeScreen() {
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [activeFilter, setActiveFilter] = useState('전체')
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [showWrite, setShowWrite] = useState(false)

  const [me, setMe] = useState<MeProfile | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const { openProfile, profileModal } = useProfileModal(() => setActiveTab('chat'))

  const [posts, setPosts] = useState<Post[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [audioState, setAudioState] = useState<{ postId: string; status: 'loading' | 'speaking' } | null>(null)
  const describeRequestRef = useRef(0)

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

  // 현재 로그인 유저 정보 로드 (본인 게시물 닉네임 표시용)
  useEffect(() => {
    getMe().then(setMe).catch(() => {})
  }, [])

  // 초기 로드
  useEffect(() => {
    loadPosts(null, true)
  }, [loadPosts])

  // 무한 스크롤 — sentinel이 뷰포트에 들어오면 다음 페이지 로드
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

  // 설명 생성 중(processing)일 때 재조회로 상태 변화를 확인 — 전용 폴링 API가 없어 GET /posts/{id}로 대체
  const pollForDescription = async (
    postId: string,
    mediaId: string,
    token: number,
  ): Promise<PostMediaItem | null> => {
    for (let attempt = 0; attempt < 10; attempt++) {
      await sleep(2000)
      if (describeRequestRef.current !== token) return null
      try {
        const updated = await getPost(postId)
        if (describeRequestRef.current !== token) return null
        setPosts((prev) => prev.map((p) => (p.id === postId ? updated : p)))
        const media = updated.media.find((m) => m.id === mediaId)
        if (media && media.description_status !== 'processing') return media
      } catch {
        // 일시적 오류는 무시하고 다음 폴링 시도
      }
    }
    return null
  }

  const handleDescribeImage = async (post: Post, image: PostMediaItem) => {
    if (audioState?.postId === post.id) {
      window.speechSynthesis?.cancel()
      describeRequestRef.current += 1
      setAudioState(null)
      return
    }

    const token = (describeRequestRef.current += 1)
    window.speechSynthesis?.cancel()

    if (image.description_status === 'done' && image.description) {
      setAudioState({ postId: post.id, status: 'speaking' })
      speakText(image.description, () => setAudioState(null))
      return
    }

    if (image.description_status !== 'processing') {
      setAudioState({ postId: post.id, status: 'speaking' })
      speakText(DESCRIPTION_FALLBACK_TEXT, () => setAudioState(null))
      return
    }

    setAudioState({ postId: post.id, status: 'loading' })
    const resolved = await pollForDescription(post.id, image.id, token)
    if (describeRequestRef.current !== token) return

    setAudioState({ postId: post.id, status: 'speaking' })
    speakText(
      resolved?.description_status === 'done' && resolved.description
        ? resolved.description
        : DESCRIPTION_FALLBACK_TEXT,
      () => setAudioState(null),
    )
  }

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
      // 실패 시 낙관적 업데이트 롤백
      setPosts((prev) => (prev.map((p) => (p.id === post.id ? post : p))))
    }
  }

  if (activeTab === 'friend') {
    return <BlindFriendScreen onTabChange={setActiveTab} />
  }

  if (activeTab === 'chat') {
    return <BlindChatScreen onTabChange={setActiveTab} />
  }

  if (activeTab === 'my') {
    return <BlindMyScreen onTabChange={setActiveTab} />
  }

  if (showWrite) {
    return (
      <BlindWriteScreen
        onBack={() => {
          setShowWrite(false)
          loadPosts(null, true)
        }}
      />
    )
  }

  const activePost = activePostId ? posts.find((p) => p.id === activePostId) ?? null : null
  if (activePost) {
    const isActivePostMine = !!(me && activePost.author.id && String(activePost.author.id) === String(me.id))
    return (
      <BlindCommentsScreen
        postId={activePost.id}
        authorNickname={isActivePostMine ? me!.nickname : activePost.author.nickname}
        onBack={() => setActivePostId(null)}
        onCommentCountChange={(count) =>
          setPosts((prev) => prev.map((p) => (p.id === activePost.id ? { ...p, comment_count: count } : p)))
        }
        onMessage={() => {
          setActivePostId(null)
          setActiveTab('chat')
        }}
      />
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>홈</span>
        <div className={styles.searchIconWrapper}>
          <img src={searchWIcon} alt="검색 창 버튼" className={styles.searchIcon} />
        </div>
      </div>

      <div className={styles.section}>
        <button type="button" onClick={() => setShowWrite(true)} className={styles.writeButton}>
          <img src={plusIcon} alt="더하기 버튼" className={styles.plusIcon} />
          <span className={styles.writeText}>글 쓰기 · 음성으로 작성</span>
        </button>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.filterInner}>
          {['전체', '일상', '정보', '취미', '고민', '모임'].map((f) => (
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

      {/* 피드 */}
      {isLoading ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="text-white/50 text-sm">피드를 불러오는 중...</span>
        </div>
      ) : fetchError ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 py-20">
          <span className="text-white/50 text-sm">{fetchError}</span>
          <button
            type="button"
            onClick={() => loadPosts(null, true)}
            className="rounded-xl bg-[#1F1F1F] px-5 py-3 text-white text-sm"
          >
            다시 시도
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-20">
          <span className="text-white/50 text-sm">아직 게시글이 없어요.</span>
        </div>
      ) : (
        <div className={styles.cardScrollArea}>
          <div className={styles.cardScrollInner}>
            {posts.map((post) => {
              const authorId = post.author.id
              const isMyPost = !!(me && authorId && String(authorId) === String(me.id))
              const nickname = isMyPost ? me!.nickname : post.author.nickname
              const image = post.media[0]
              const avatarUrl = avatarUrlFor(post.author.profile_image_url, String(authorId ?? post.id))
              const handleOpenProfile = () => {
                if (isMyPost) return
                openProfile({ id: authorId, nickname, bio: null, avatarUrl })
              }
              return (
                <div key={post.id} className={styles.card}>
                  {/* 작성자 정보 */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardAuthorRow}>
                      <button
                        type="button"
                        onClick={handleOpenProfile}
                        disabled={isMyPost}
                        className={styles.cardAvatarCol}
                        aria-label={isMyPost ? undefined : `${nickname}님 프로필 보기`}
                      >
                        {post.author.profile_image_url ? (
                          <img
                            src={resolveImageUrl(post.author.profile_image_url)}
                            alt={nickname}
                            className={styles.cardAvatar}
                          />
                        ) : isMyPost ? (
                          <div className={`${styles.cardAvatar} bg-[#FFD60A] flex items-center justify-center text-black font-bold text-base`}>
                            {me!.nickname[0].toUpperCase()}
                          </div>
                        ) : (
                          <img
                            src={avatarUrl}
                            alt={nickname}
                            className={styles.cardAvatar}
                          />
                        )}
                      </button>
                      <div className={styles.cardAuthorInfo}>
                        <button
                          type="button"
                          onClick={handleOpenProfile}
                          disabled={isMyPost}
                          className={styles.cardNickname}
                          aria-label={isMyPost ? undefined : `${nickname}님 프로필 보기`}
                        >
                          {nickname}
                        </button>
                        <span className={styles.cardTime}>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 본문 */}
                  <p className={styles.cardBody}>{post.content}</p>

                  {/* 첨부 이미지 — 있을 때만 표시 */}
                  {image && (
                    <div className={styles.cardImageWrapper}>
                      <img
                        src={resolveImageUrl(image.url)}
                        alt="첨부 이미지"
                        className={`${styles.cardImage} cursor-pointer`}
                        onClick={() => setLightboxUrl(resolveImageUrl(image.url))}
                      />
                      <button
                        type="button"
                        onClick={() => handleDescribeImage(post, image)}
                        className={audioState?.postId === post.id ? styles.imageDescribeBtnActive : styles.imageDescribeBtn}
                        aria-label="음성으로 듣기"
                      >
                        {audioState?.postId === post.id && audioState.status === 'loading' ? (
                          <span className="w-4 h-4 rounded-full border-2 border-black border-t-transparent animate-spin block" />
                        ) : audioState?.postId === post.id && audioState.status === 'speaking' ? (
                          <span className="w-3 h-3 rounded-full bg-[#FFD60A] animate-pulse block" />
                        ) : (
                          <img src={micWIcon} alt="" className={styles.imageDescribeBtnIcon} />
                        )}
                      </button>
                    </div>
                  )}

                  {/* 카드 하단 */}
                  <div className={styles.cardFooter}>
                    <button
                      type="button"
                      onClick={() => toggleLike(post)}
                      className={post.liked_by_me ? styles.cardFooterLeftActive : styles.cardFooterLeft}
                    >
                      <img
                        src={post.liked_by_me ? heartBIcon : heartWIcon}
                        alt="좋아요"
                        className={styles.cardFooterIcon}
                      />
                      <span className={post.liked_by_me ? styles.cardFooterTextActive : styles.cardFooterText}>
                        {post.like_count}개
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActivePostId(post.id)}
                      className={styles.cardFooterRight}
                    >
                      <img src={chatWIcon} alt="댓글" className={styles.cardFooterIcon} />
                      <span className={styles.cardFooterText}>{post.comment_count}개 | 댓글 보기</span>
                    </button>
                  </div>
                </div>
              )
            })}

            {/* 무한 스크롤 sentinel */}
            <div ref={sentinelRef} className="py-2">
              {isLoadingMore && (
                <p className="text-center text-white/40 text-sm py-4">불러오는 중...</p>
              )}
              {!hasMore && posts.length > 0 && (
                <p className="text-center text-white/30 text-sm py-4">마지막 게시글이에요.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <BlindBottomNav active={activeTab} onChange={setActiveTab} />

      {/* 작성자 프로필 팝업 */}
      {profileModal}

      {/* 이미지 라이트박스 */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            type="button"
            aria-label="닫기"
            className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center text-white text-2xl rounded-full bg-white/10"
            onClick={() => setLightboxUrl(null)}
          >
            ✕
          </button>
          <img
            src={lightboxUrl}
            alt="확대 이미지"
            className="max-w-full max-h-full object-contain p-4"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
