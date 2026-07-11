import { useCallback, useEffect, useState } from 'react'
import styles from './BlindFriendScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import {
  getFriends,
  getFriendRequests,
  acceptFriendRequest,
  declineFriendRequest,
  cancelFriendRequest,
  unfriend,
  blockUser,
  sendFriendRequest,
  type FriendRequest,
} from '../services/friends'
import { getRecommendations, type RecommendedPerson } from '../services/recommendations'
import { type Author } from '../services/posts'
import BlindUserProfileModal, { type ProfileModalUser } from '../components/BlindUserProfileModal'
import { avatarUrlFor } from '../utils/avatar'
import plusIcon from '../assets/images/plus.svg'
import searchWIcon from '../assets/images/search-w.svg'

type FriendTab = 'list' | 'request'

function avatarFor(author: Author): string {
  return avatarUrlFor(author.profile_image_url, String(author.id ?? author.nickname))
}

interface Props {
  onTabChange: (tab: Tab) => void
  onOpenChat: (friend: Author) => void
}

type ConfirmAction = 'accept' | 'decline' | 'cancel' | 'unfriend' | 'block'
type RequestBox = 'received' | 'sent'

interface ConfirmTarget {
  id: string
  nickname: string
  action: ConfirmAction
}

export default function BlindFriendScreen({ onTabChange, onOpenChat }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('friend')
  const [friendTab, setFriendTab] = useState<FriendTab>('list')

  const [friends, setFriends] = useState<Author[]>([])
  const [isLoadingFriends, setIsLoadingFriends] = useState(true)
  const [friendsError, setFriendsError] = useState<string | null>(null)

  const [requestBox, setRequestBox] = useState<RequestBox>('received')

  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [isLoadingRequests, setIsLoadingRequests] = useState(true)
  const [requestsError, setRequestsError] = useState<string | null>(null)

  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([])
  const [isLoadingSentRequests, setIsLoadingSentRequests] = useState(true)
  const [sentRequestsError, setSentRequestsError] = useState<string | null>(null)

  const [recommendations, setRecommendations] = useState<RecommendedPerson[]>([])
  const [recommendMessage, setRecommendMessage] = useState<string | null>(null)
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(true)
  const [recommendError, setRecommendError] = useState<string | null>(null)
  const [sentRequestIds, setSentRequestIds] = useState<Set<string>>(new Set())

  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)

  const [profileFriend, setProfileFriend] = useState<ProfileModalUser | null>(null)

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

  const loadSentRequests = useCallback(async () => {
    setIsLoadingSentRequests(true)
    setSentRequestsError(null)
    try {
      const page = await getFriendRequests('sent')
      setSentRequests(page.items)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSentRequestsError(e.detail ?? '보낸 친구 요청을 불러오지 못했습니다.')
    } finally {
      setIsLoadingSentRequests(false)
    }
  }, [])

  const loadRecommendations = useCallback(async () => {
    setIsLoadingRecommendations(true)
    setRecommendError(null)
    try {
      const page = await getRecommendations()
      setRecommendations(page.items)
      setRecommendMessage(page.message)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setRecommendError(e.detail ?? '친구 추천을 불러오지 못했습니다.')
    } finally {
      setIsLoadingRecommendations(false)
    }
  }, [])

  useEffect(() => {
    loadFriends()
    loadRequests()
    loadSentRequests()
    loadRecommendations()
  }, [loadFriends, loadRequests, loadSentRequests, loadRecommendations])

  const handleSendRequest = async (personId: string) => {
    if (sentRequestIds.has(personId)) return
    setSentRequestIds((prev) => new Set(prev).add(personId))
    try {
      const request = await sendFriendRequest(personId)
      setSentRequests((prev) => [request, ...prev])
    } catch {
      setSentRequestIds((prev) => {
        const next = new Set(prev)
        next.delete(personId)
        return next
      })
    }
  }

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
      } else if (confirmTarget.action === 'cancel') {
        await cancelFriendRequest(confirmTarget.id)
        setSentRequests((prev) => prev.filter((r) => r.id !== confirmTarget.id))
      } else if (confirmTarget.action === 'block') {
        await blockUser(confirmTarget.id)
        setFriends((prev) => prev.filter((f) => f.id !== confirmTarget.id))
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
            {isLoadingRecommendations ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyText}>친구 추천을 불러오는 중...</span>
              </div>
            ) : recommendError ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyText}>{recommendError}</span>
                <button type="button" onClick={loadRecommendations} className={styles.retryButton}>
                  다시 시도
                </button>
              </div>
            ) : recommendations.length === 0 ? (
              <div className={styles.emptyState}>
                <span className={styles.emptyText}>
                  {recommendMessage === '지금은 추천을 만들 수 없어요. 잠시 후 다시 시도해 주세요'
                    ? recommendMessage
                    : '관심사를 등록하면 나와 잘 맞는 친구를 추천해드려요.'}
                </span>
                {recommendMessage === '지금은 추천을 만들 수 없어요. 잠시 후 다시 시도해 주세요' && (
                  <button type="button" onClick={loadRecommendations} className={styles.retryButton}>
                    다시 시도
                  </button>
                )}
              </div>
            ) : (
              <div className={styles.recommendScrollArea}>
                <div className={styles.recommendInner}>
                  {recommendations.map((person) => {
                    const sent = sentRequestIds.has(person.user_id)
                    return (
                      <div key={person.user_id} className={styles.recommendCard}>
                        <img
                          src={avatarFor({ id: person.user_id, nickname: person.nickname, profile_image_url: person.profile_image_url })}
                          alt={`${person.nickname} 프로필`}
                          className={styles.recommendAvatar}
                        />
                        <span className={styles.recommendNickname}>{person.nickname}</span>
                        <span className={styles.recommendBio}>{person.bio ?? person.reasons[0] ?? ''}</span>
                        <button
                          type="button"
                          onClick={() => handleSendRequest(person.user_id)}
                          disabled={sent}
                          className={styles.recommendAddButton}
                          aria-label={sent ? `${person.nickname}님에게 친구 요청 보냄` : `${person.nickname}님에게 친구 요청 보내기`}
                        >
                          {sent ? (
                            <span className={styles.recommendAddText}>요청됨</span>
                          ) : (
                            <>
                              <img src={plusIcon} alt="" className={styles.recommendAddIcon} />
                              <span className={styles.recommendAddText}>친구 추가</span>
                            </>
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
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
                  <button
                    type="button"
                    onClick={() => setProfileFriend({ id: friend.id, nickname: friend.nickname, bio: null, avatarUrl: avatarFor(friend) })}
                    className={styles.friendAvatarButton}
                    aria-label={`${friend.nickname}님 프로필 보기`}
                  >
                    <img src={avatarFor(friend)} alt="" className={styles.friendAvatar} />
                  </button>
                  <div className={styles.friendInfo}>
                    <span className={styles.friendNickname}>{friend.nickname}</span>
                  </div>
                  <div className={styles.friendActions}>
                    <button
                      type="button"
                      onClick={() => onOpenChat(friend)}
                      className={styles.chatButton}
                      aria-label={`${friend.nickname}님과 채팅하기`}
                    >
                      <span className={styles.chatButtonText}>채팅하기</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className={styles.requestBoxRow} role="tablist" aria-label="받은 요청과 보낸 요청 전환">
            {/* axe-linter-disable-next-line aria-valid-attr-value */}
            <button
              type="button"
              role="tab"
              aria-selected={requestBox === 'received'}
              onClick={() => setRequestBox('received')}
              className={requestBox === 'received' ? styles.requestBoxButtonActive : styles.requestBoxButtonInactive}
            >
              받은 요청 {requests.length}
            </button>
            {/* axe-linter-disable-next-line aria-valid-attr-value */}
            <button
              type="button"
              role="tab"
              aria-selected={requestBox === 'sent'}
              onClick={() => setRequestBox('sent')}
              className={requestBox === 'sent' ? styles.requestBoxButtonActive : styles.requestBoxButtonInactive}
            >
              보낸 요청 {sentRequests.length}
            </button>
          </div>

          {requestBox === 'received' ? (
            isLoadingRequests ? (
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
            )
          ) : isLoadingSentRequests ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>보낸 친구 요청을 불러오는 중...</span>
            </div>
          ) : sentRequestsError ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>{sentRequestsError}</span>
              <button type="button" onClick={loadSentRequests} className={styles.retryButton}>
                다시 시도
              </button>
            </div>
          ) : sentRequests.length === 0 ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyText}>보낸 친구 요청이 없어요.</span>
            </div>
          ) : (
            <div className={styles.requestList}>
              {sentRequests.map((request) => (
                <div key={request.id} className={styles.requestItem}>
                  <div className={styles.requestTop}>
                    <img
                      src={avatarFor(request.receiver)}
                      alt={`${request.receiver.nickname} 프로필`}
                      className={styles.friendAvatar}
                    />
                    <div className={styles.friendInfo}>
                      <span className={styles.friendNickname}>{request.receiver.nickname}</span>
                    </div>
                  </div>
                  <div className={styles.requestActions}>
                    <button
                      type="button"
                      onClick={() => setConfirmTarget({ id: request.id, nickname: request.receiver.nickname, action: 'cancel' })}
                      className={styles.cancelButton}
                      aria-label={`${request.receiver.nickname}님에게 보낸 친구 요청 취소`}
                    >
                      요청 취소
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {confirmTarget && (
        <>
          <div className={styles.confirmOverlay} onClick={handleConfirmNo} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>
              {confirmTarget.action === 'unfriend'
                ? `${confirmTarget.nickname}님과 친구를 끊으시겠습니까?`
                : confirmTarget.action === 'block'
                ? `${confirmTarget.nickname}님을 차단하시겠습니까?`
                : confirmTarget.action === 'cancel'
                ? `${confirmTarget.nickname}님에게 보낸 친구 요청을 취소하시겠습니까?`
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

      {profileFriend && (
        <BlindUserProfileModal
          user={profileFriend}
          variant="friend"
          onClose={() => setProfileFriend(null)}
          onUnfriend={() => {
            const { id, nickname } = profileFriend
            setProfileFriend(null)
            if (id) setConfirmTarget({ id, nickname, action: 'unfriend' })
          }}
          onBlock={() => {
            const { id, nickname } = profileFriend
            setProfileFriend(null)
            if (id) setConfirmTarget({ id, nickname, action: 'block' })
          }}
        />
      )}

      <BlindBottomNav active={activeTab} onChange={handleTabChange} />
    </div>
  )
}
