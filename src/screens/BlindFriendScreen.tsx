import { useCallback, useEffect, useState } from 'react'
import styles from './BlindFriendScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import {
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  unfriend,
  type FriendRequest,
} from '../services/friends'
import { API_BASE_URL, type Author } from '../services/posts'
import plusIcon from '../assets/images/plus.svg'
import searchWIcon from '../assets/images/search-w.svg'

type FriendTab = 'list' | 'request'

// 친구 추천은 아직 백엔드 API가 없어(가이드 미포함) mock 데이터로만 노출한다.
interface RecommendedPerson {
  id: number
  nickname: string
  avatar: string
  bio: string
}

const MOCK_RECOMMENDED: RecommendedPerson[] = [
  { id: 101, nickname: '초록언덕', avatar: 'https://i.pravatar.cc/80?img=32', bio: '반려견과 매일 산책해요' },
  { id: 102, nickname: '느린발걸음', avatar: 'https://i.pravatar.cc/80?img=45', bio: '같은 동네에 살아요' },
  { id: 103, nickname: '따뜻한차', avatar: 'https://i.pravatar.cc/80?img=15', bio: '독서 모임 함께해요' },
]

function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

function resolveImageUrl(imageUrl: string): string {
  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`
}

function avatarFor(author: Author): string {
  if (author.profile_image_url) return resolveImageUrl(author.profile_image_url)
  const idx = hashId(String(author.id ?? author.nickname)) % 70 + 1
  return `https://i.pravatar.cc/80?img=${idx}`
}

interface Props {
  onTabChange: (tab: Tab) => void
}

type ConfirmAction = 'accept' | 'decline' | 'unfriend'

interface ConfirmTarget {
  id: string
  nickname: string
  action: ConfirmAction
}

export default function BlindFriendScreen({ onTabChange }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('friend')
  const [friendTab, setFriendTab] = useState<FriendTab>('list')

  const [friends, setFriends] = useState<Author[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [friendsError, setFriendsError] = useState<string | null>(null)

  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [requestsError, setRequestsError] = useState<string | null>(null)

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const loadFriends = useCallback(async () => {
    setIsLoadingFriends(true)
    setFriendsError(null)
    try {
      const page = await getFriends()
      setFriends(page.items)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setFriendsError(e.detail ?? '친구 목록을 불러오지 못했습니다.')
    } finally {
      setIsLoadingFriends(false)
    }
  }, [])

  const loadRequests = useCallback(async () => {
    setIsLoadingRequests(true)
    setRequestsError(null)
    try {
      const page = await getFriendRequests('received')
      setRequests(page.items)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setRequestsError(e.detail ?? '친구 요청을 불러오지 못했습니다.')
    } finally {
      setIsLoadingRequests(false)
    }
  }, [])

  useEffect(() => {
    loadFriends()
    loadRequests()
  }, [loadFriends, loadRequests])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  const handleConfirmYes = async () => {
    if (!confirmTarget || isConfirming) return
    setIsConfirming(true)
    setConfirmError(null)
    try {
      if (confirmTarget.action === 'accept') {
        const updated = await acceptFriendRequest(confirmTarget.id)
        setRequests((prev) => prev.filter((r) => r.id !== confirmTarget.id))
        setFriends((prev) => [updated.sender, ...prev])
      } else if (confirmTarget.action === 'decline') {
        await declineFriendRequest(confirmTarget.id)
        setRequests((prev) => prev.filter((r) => r.id !== confirmTarget.id))
      } else {
        await unfriend(confirmTarget.id)
        setFriends((prev) => prev.filter((f) => f.id !== confirmTarget.id))
      }
      setConfirmTarget(null)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setConfirmError(e.detail ?? '처리에 실패했습니다.')
    } finally {
      setIsConfirming(false)
    }
  }

  const handleConfirmNo = () => {
    if (isConfirming) return
    setConfirmTarget(null)
    setConfirmError(null)
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>친구</span>
        <div className={styles.searchIconWrapper}>
          <img src={searchWIcon} alt="검색 창 버튼" className={styles.searchIcon} />
        </div>
      </div>

      <div className={styles.segmentRow} role="tablist" aria-label="친구 목록과 친구 요청 전환">
        {/* axe-linter-disable-next-line aria-valid-attr-value */}
        <button
          type="button"
          role="tab"
          aria-selected={friendTab === 'list'}
          onClick={() => setFriendTab('list')}
          className={friendTab === 'list' ? styles.segmentButtonActive : styles.segmentButtonInactive}
        >
          친구 목록 {friends.length}
        </button>
        {/* axe-linter-disable-next-line aria-valid-attr-value */}
        <button
          type="button"
          role="tab"
          aria-selected={friendTab === 'request'}
          onClick={() => setFriendTab('request')}
          className={friendTab === 'request' ? styles.segmentButtonActive : styles.segmentButtonInactive}
        >
          친구 요청 {requests.length}
        </button>
      </div>

      {friendTab === 'list' ? (
        <>
          <div className={styles.recommendSection}>
            <span className={styles.recommendTitle}>친구 추천</span>
            <div className={styles.recommendScrollArea}>
              <div className={styles.recommendInner}>
                {MOCK_RECOMMENDED.map((person) => (
                  <div key={person.id} className={styles.recommendCard}>
                    <img src={person.avatar} alt={`${person.nickname} 프로필`} className={styles.recommendAvatar} />
                    <span className={styles.recommendNickname}>{person.nickname}</span>
                    <span className={styles.recommendBio}>{person.bio}</span>
                    <button
                      type="button"
                      className={styles.recommendAddButton}
                      aria-label={`${person.nickname}님에게 친구 요청 보내기`}
                    >
                      <img src={plusIcon} alt="" className={styles.recommendAddIcon} />
                      <span className={styles.recommendAddText}>친구 추가</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <span className={styles.listTitle}>친구 {friends.length}명</span>
          {isLoadingFriends ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>친구 목록을 불러오는 중...</span>
            </div>
          ) : friendsError ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>{friendsError}</span>
              <button type="button" onClick={loadFriends} className={styles.retryButton}>
                다시 시도
              </button>
            </div>
          ) : friends.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>아직 친구가 없어요.</span>
            </div>
          ) : (
            <div className={styles.friendList}>
              {friends.map((friend, i) => (
                <div key={friend.id ?? i} className={styles.friendItem}>
                  <img src={avatarFor(friend)} alt={`${friend.nickname} 프로필`} className={styles.friendAvatar} />
                  <div className={styles.friendInfo}>
                    <span className={styles.friendNickname}>{friend.nickname}</span>
                  </div>
                  <div className={styles.friendActions}>
                    <button
                      type="button"
                      onClick={() => onTabChange('chat')}
                      className={styles.chatButton}
                      aria-label={`${friend.nickname}님과 채팅하기`}
                    >
                      <span className={styles.chatButtonText}>채팅하기</span>
                    </button>
                    {friend.id && (
                      <button
                        type="button"
                        onClick={() => setConfirmTarget({ id: friend.id!, nickname: friend.nickname, action: 'unfriend' })}
                        className={styles.unfriendButton}
                        aria-label={`${friend.nickname}님과 친구 끊기`}
                      >
                        친구 끊기
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : isLoadingRequests ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>친구 요청을 불러오는 중...</span>
        </div>
      ) : requestsError ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>{requestsError}</span>
          <button type="button" onClick={loadRequests} className={styles.retryButton}>
            다시 시도
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyText}>받은 친구 요청이 없어요.</span>
        </div>
      ) : (
        <div className={styles.requestList}>
          {requests.map((request) => (
            <div key={request.id} className={styles.requestItem}>
              <div className={styles.requestTop}>
                <img
                  src={avatarFor(request.sender)}
                  alt={`${request.sender.nickname} 프로필`}
                  className={styles.friendAvatar}
                />
                <div className={styles.friendInfo}>
                  <span className={styles.friendNickname}>{request.sender.nickname}</span>
                </div>
              </div>
              <div className={styles.requestActions}>
                <button
                  type="button"
                  onClick={() => setConfirmTarget({ id: request.id, nickname: request.sender.nickname, action: 'accept' })}
                  className={styles.acceptButton}
                  aria-label={`${request.sender.nickname}님의 친구 요청 수락`}
                >
                  수락
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmTarget({ id: request.id, nickname: request.sender.nickname, action: 'decline' })}
                  className={styles.declineButton}
                  aria-label={`${request.sender.nickname}님의 친구 요청 거절`}
                >
                  거절
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {confirmTarget && (
        <>
          <div className={styles.confirmOverlay} onClick={handleConfirmNo} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>
              {confirmTarget.action === 'unfriend'
                ? `${confirmTarget.nickname}님과 친구를 끊으시겠습니까?`
                : `${confirmTarget.nickname}님의 친구 요청을 ${confirmTarget.action === 'accept' ? '수락' : '거절'}하시겠습니까?`}
            </p>
            {confirmError && <p className={styles.confirmErrorText}>{confirmError}</p>}
            <div className={styles.confirmButtons}>
              <button type="button" onClick={handleConfirmNo} disabled={isConfirming} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" onClick={handleConfirmYes} disabled={isConfirming} className={styles.confirmYesButton}>
                {isConfirming ? '처리 중...' : '네'}
              </button>
            </div>
          </div>
        </>
      )}

      <BlindBottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
