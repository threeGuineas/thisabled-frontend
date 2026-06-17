import { useEffect, useState } from 'react'
import styles from './BlindCommentsScreen.styles'
import backGIcon from '../assets/images/back-g.svg'
import chatIcon from '../assets/images/chat.svg'
import micWIcon from '../assets/images/mic-w.svg'
import sendGIcon from '../assets/images/send-g.svg'
import sendIcon from '../assets/images/send.svg'

const SAMPLE_COMMENTS = [
  {
    id: 1,
    nickname: '하늘산책',
    time: '10분 전',
    avatar: 'https://i.pravatar.cc/80?img=11',
    body: '정말 공감돼요. 저도 봄만 되면 공원에 자주 나가게 되더라고요.',
  },
  {
    id: 2,
    nickname: '달빛여행',
    time: '10분 전',
    avatar: 'https://i.pravatar.cc/80?img=12',
    body: '라일락 향기는 정말 특별하죠. 글 읽으면서 저도 그 향이 느껴지는 것 같았어요.',
  },
  {
    id: 3,
    nickname: '봄바람',
    time: '10분 전',
    avatar: 'https://i.pravatar.cc/80?img=13',
    body: '코로 먼저 봄을 안다는 표현이 너무 좋아요. 다음에 저도 한번 가봐야겠어요.',
  },
]

interface Props {
  onBack: () => void
}

export default function BlindCommentsScreen({ onBack }: Props) {
  const [showSheet, setShowSheet] = useState(false)
  const [commentText, setCommentText] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton}>
          <img src={backGIcon} alt="뒤로 가기" className={styles.backIcon} />
        </button>
        <div className={styles.headerTextGroup}>
          <span className={styles.headerTitle}>
            댓글 <span className={styles.headerCount}>3개</span>
          </span>
          <span className={styles.headerSubtitle}>봄날의소리 님의 글</span>
        </div>
      </div>

      <div className={styles.divider} />

      <div className={styles.commentList}>
        {SAMPLE_COMMENTS.map((comment) => (
          <div key={comment.id} className={styles.commentItem}>
            <div className={styles.commentTop}>
              <img src={comment.avatar} alt={comment.nickname} className={styles.avatar} />
              <div className={styles.commentMeta}>
                <span className={styles.nickname}>{comment.nickname}</span>
                <span className={styles.time}>{comment.time}</span>
              </div>
            </div>
            <p className={styles.commentBody}>{comment.body}</p>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setShowSheet(true)} className={styles.floatingButton}>
        <img src={chatIcon} alt="댓글 달기" className={styles.chatIcon} />
        <span className={styles.addCommentText}>댓글 달기</span>
      </button>

      {/* 오버레이 */}
      {showSheet && (
        <div className={styles.overlay} onClick={() => setShowSheet(false)} />
      )}

      {/* 바텀시트 */}
      <div className={`${styles.bottomSheet} ${showSheet ? styles.bottomSheetOpen : styles.bottomSheetClosed}`}>
        <div className={styles.sheetHeader}>
          <span className={styles.sheetTitle}>댓글 달기</span>
          <button type="button" onClick={() => setShowSheet(false)} className={styles.sheetCancelButton}>
            취소
          </button>
        </div>

        <textarea
          className={styles.sheetTextarea}
          placeholder="댓글을 입력하세요. 아래 마이크로 음성 입력도 가능해요."
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
        />

        <div className={styles.sheetFooter}>
          <button type="button" className={styles.voiceButton}>
            <img src={micWIcon} alt="" className={styles.voiceIcon} />
            <span className={styles.voiceText}>음성 입력</span>
          </button>
          <button
            type="button"
            disabled={!commentText.trim()}
            className={commentText.trim() ? styles.submitButtonActive : styles.submitButtonInactive}
          >
            <img
              src={commentText.trim() ? sendIcon : sendGIcon}
              alt=""
              className={styles.submitIcon}
            />
            <span className={commentText.trim() ? styles.submitTextActive : styles.submitTextInactive}>
              댓글 달기
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}
