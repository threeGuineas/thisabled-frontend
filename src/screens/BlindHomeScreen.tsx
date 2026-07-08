import { useCallback, useEffect, useRef, useState } from 'react'
import styles from './BlindHomeScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import BlindCommentsScreen from './BlindCommentsScreen'
import BlindWriteScreen from './BlindWriteScreen'
import BlindMyScreen from './BlindMyScreen'
import BlindChatScreen from './BlindChatScreen'
import { getPosts, type Post, API_BASE_URL } from '../services/posts'
import { getMe, type MeProfile } from '../services/users'
import { describeImage, speakText } from '../services/voice'
import searchWIcon from '../assets/images/search-w.svg'
import plusIcon from '../assets/images/plus.svg'
import heartWIcon from '../assets/images/heart-w.svg'
import heartBIcon from '../assets/images/heart-b.svg'
import chatWIcon from '../assets/images/chat-w.svg'
import micWIcon from '../assets/images/mic-w.svg'

const LIMIT = 20

const MOCK_NICKNAMES = ['달콤한하루', '하늘산책', '달빛여행', '봄바람', '초록잎']

const FAKE_COUNTS = [
  { likes: 9, comments: 3 },
  { likes: 0, comments: 0 },
  { likes: 0, comments: 0 },
  { likes: 0, comments: 0 },
  { likes: 0, comments: 0 },
]

// UUID 문자열을 안정적인 정수 인덱스로 변환
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function resolveImageUrl(imageUrl: string): string {
  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`
}

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
  const [likedCards, setLikedCards] = useState<Set<string>>(new Set())
  const [showComments, setShowComments] = useState(false)
  const [showWrite, setShowWrite] = useState(false)

  const [me, setMe] = useState<MeProfile | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const [posts, setPosts] = useState<Post[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [audioState, setAudioState] = useState<{ postId: string; status: 'loading' | 'speaking' } | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (currentOffset: number, replace: boolean) => {
    if (replace) {
      setIsLoading(true)
      setFetchError(null)
    } else {
      setIsLoadingMore(true)
    }

    try {
      const newPosts = await getPosts(currentOffset, LIMIT)
      setPosts(prev => replace ? newPosts : [...prev, ...newPosts])
      setOffset(currentOffset + newPosts.length)
      setHasMore(newPosts.length === LIMIT)
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
    loadPosts(0, true)
  }, [loadPosts])

  // 무한 스크롤 — sentinel이 뷰포트에 들어오면 다음 페이지 로드
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoadingMore && !isLoading) {
          loadPosts(offset, false)
        }
      },
      { threshold: 0.1 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore, isLoadingMore, isLoading, offset, loadPosts])

  const handleDescribeImage = async (postId: string, imageUrl: string) => {
    if (audioState?.postId === postId) {
      window.speechSynthesis.cancel()
      setAudioState(null)
      return
    }
    setAudioState({ postId, status: 'loading' })
    const description = await describeImage(imageUrl)
    setAudioState({ postId, status: 'speaking' })
    speakText(description, () => setAudioState(null))
  }

  const toggleLike = (id: string) => {
    setLikedCards((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
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
          loadPosts(0, true)
        }}
      />
    )
  }

  if (showComments) {
    return <BlindCommentsScreen onBack={() => setShowComments(false)} />
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
            onClick={() => loadPosts(0, true)}
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
              const h = hashId(post.id)
              const counts = FAKE_COUNTS[h % FAKE_COUNTS.length]
              const avatarIdx = hashId(String(post.user_id)) % 70 + 1
              const isMyPost = me && String(post.user_id) === String(me.id)
              const nickname = isMyPost ? me.nickname : MOCK_NICKNAMES[hashId(String(post.user_id)) % MOCK_NICKNAMES.length]
              return (
                <div key={post.id} className={styles.card}>
                  {/* 작성자 정보 */}
                  <div className={styles.cardHeader}>
                    <div className={styles.cardAuthorRow}>
                      <div className={styles.cardAvatarCol}>
                        {isMyPost ? (
                          <div className={`${styles.cardAvatar} bg-[#FFD60A] flex items-center justify-center text-black font-bold text-base`}>
                            {me!.nickname[0].toUpperCase()}
                          </div>
                        ) : (
                          <img
                            src={`https://i.pravatar.cc/80?img=${avatarIdx}`}
                            alt={`사용자 ${post.user_id}`}
                            className={styles.cardAvatar}
                          />
                        )}
                      </div>
                      <div className={styles.cardAuthorInfo}>
                        <span className={styles.cardNickname}>{nickname}</span>
                        <span className={styles.cardTime}>{timeAgo(post.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 본문 */}
                  <p className={styles.cardBody}>{post.content}</p>

                  {/* 첨부 이미지 — 있을 때만 표시 */}
                  {post.image_url && (
                    <div className={styles.cardImageWrapper}>
                      <img
                        src={resolveImageUrl(post.image_url)}
                        alt="첨부 이미지"
                        className={`${styles.cardImage} cursor-pointer`}
                        onClick={() => setLightboxUrl(resolveImageUrl(post.image_url!))}
                      />
                      <button
                        type="button"
                        onClick={() => handleDescribeImage(post.id, resolveImageUrl(post.image_url!))}
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
                      onClick={() => toggleLike(post.id)}
                      className={likedCards.has(post.id) ? styles.cardFooterLeftActive : styles.cardFooterLeft}
                    >
                      <img
                        src={likedCards.has(post.id) ? heartBIcon : heartWIcon}
                        alt="좋아요"
                        className={styles.cardFooterIcon}
                      />
                      <span className={likedCards.has(post.id) ? styles.cardFooterTextActive : styles.cardFooterText}>
                        {likedCards.has(post.id) ? counts.likes + 1 : counts.likes}개
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowComments(true)}
                      className={styles.cardFooterRight}
                    >
                      <img src={chatWIcon} alt="댓글" className={styles.cardFooterIcon} />
                      <span className={styles.cardFooterText}>{counts.comments}개 | 댓글 보기</span>
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
