import { useState } from 'react'
import styles from './BlindHomeScreen.styles'
import BlindBottomNav, { type Tab } from '../components/BlindBottomNav'
import BlindCommentsScreen from './BlindCommentsScreen'
import BlindWriteScreen from './BlindWriteScreen'
import searchWIcon from '../assets/images/search-w.svg'
import plusIcon from '../assets/images/plus.svg'
import heartWIcon from '../assets/images/heart-w.svg'
import heartBIcon from '../assets/images/heart-b.svg'
import chatWIcon from '../assets/images/chat-w.svg'

const filters = ['전체', '일상', '정보', '취미', '고민', '모임']

const POST_BODY =
  '오늘 동네 공원을 한 바퀴 돌았어요. 벤치 옆\n라일락 향이 진해서, 한참을 앉아 있었습니다.\n봄이 왔다는 걸 코로 먼저 알았네요.'

const SAMPLE_CARDS = [
  {
    id: 1,
    nickname: '하늘산책',
    time: '8분 전',
    tag: '#일상',
    body: POST_BODY,
    image: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=400&q=80',
    likes: 9,
    comments: 7,
  },
  {
    id: 2,
    nickname: '봄바람',
    time: '23분 전',
    tag: '#일상',
    body: POST_BODY,
    image: 'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&q=80',
    likes: 9,
    comments: 7,
  },
  {
    id: 3,
    nickname: '달빛여행',
    time: '1시간 전',
    tag: '#정보',
    body: POST_BODY,
    image: 'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80',
    likes: 9,
    comments: 7,
  },
]

export default function BlindHomeScreen() {
  const [activeFilter, setActiveFilter] = useState('전체')
  const [activeTab, setActiveTab] = useState<Tab>('home')
  const [likedCards, setLikedCards] = useState<Set<number>>(new Set())
  const [showComments, setShowComments] = useState(false)
  const [showWrite, setShowWrite] = useState(false)

  const toggleLike = (id: number) => {
    setLikedCards((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (showWrite) {
    return <BlindWriteScreen onBack={() => setShowWrite(false)} />
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
          <img src={plusIcon} alt="글 쓰기 버튼" className={styles.plusIcon} />
          <span className={styles.writeText}>글 쓰기 · 음성으로 작성</span>
        </button>
      </div>

      <div className={styles.filterContainer}>
        <div className={styles.filterInner}>
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              type="button"
              className={f === activeFilter ? styles.filterActive : styles.filterInactive}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className={styles.newPostsBadge}>
        새 글 <span className={styles.newPostsCount}>3</span>개
      </p>

      {/* 카드 스와이프 영역 */}
      <div className={styles.cardScrollArea}>
        <div className={styles.cardScrollInner}>
          {SAMPLE_CARDS.map((card) => (
            <div key={card.id} className={styles.card}>
              {/* 작성자 정보 */}
              <div className={styles.cardHeader}>
                <div className={styles.cardAuthorRow}>
                  <div className={styles.cardAvatarCol}>
                    <img
                      src={`https://i.pravatar.cc/80?img=${card.id + 10}`}
                      alt={card.nickname}
                      className={styles.cardAvatar}
                    />
                    <span className={styles.cardTag}>{card.tag}</span>
                  </div>
                  <div className={styles.cardAuthorInfo}>
                    <span className={styles.cardNickname}>{card.nickname}</span>
                    <span className={styles.cardTime}>{card.time}</span>
                  </div>
                </div>
              </div>

              {/* 본문 */}
              <p className={styles.cardBody}>{card.body}</p>

              {/* 첨부 이미지 */}
              <img src={card.image} alt="첨부 이미지" className={styles.cardImage} />

              {/* 카드 하단 */}
              <div className={styles.cardFooter}>
                <button
                  type="button"
                  onClick={() => toggleLike(card.id)}
                  className={likedCards.has(card.id) ? styles.cardFooterLeftActive : styles.cardFooterLeft}
                >
                  <img
                    src={likedCards.has(card.id) ? heartBIcon : heartWIcon}
                    alt="좋아요 버튼"
                    className={styles.cardFooterIcon}
                  />
                  <span className={likedCards.has(card.id) ? styles.cardFooterTextActive : styles.cardFooterText}>
                    {likedCards.has(card.id) ? card.likes + 1 : card.likes}개
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowComments(true)}
                  className={styles.cardFooterRight}
                >
                  <img src={chatWIcon} alt="댓글 버튼" className={styles.cardFooterIcon} />
                  <span className={styles.cardFooterText}>{card.comments}개 | 댓글 보기</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <BlindBottomNav active={activeTab} onChange={setActiveTab} />
    </div>
  )
}
