import { useEffect, useRef, useState } from 'react'
import styles from './BlindWriteScreen.styles'
import backGIcon from '../assets/images/back-g.svg'
import checkIcon from '../assets/images/check.svg'
import checkOffIcon from '../assets/images/check-off.svg'
import nextIcon from '../assets/images/next.svg'
import imageWIcon from '../assets/images/image-w.svg'
import micWIcon from '../assets/images/mic-w.svg'
import sendIcon from '../assets/images/send.svg'
import sendGIcon from '../assets/images/send-g.svg'

const CATEGORIES = [
  { id: '일상', label: '일상', desc: '오늘의 이야기를 나눠요' },
  { id: '정보', label: '정보', desc: '유용한 정보를 공유해요' },
  { id: '취미', label: '취미', desc: '좋아하는 것들을 소개해요' },
  { id: '고민', label: '고민', desc: '고민을 함께 나눠요' },
  { id: '모임', label: '모임', desc: '같이 모일 사람을 찾아요' },
]

interface Props {
  onBack: () => void
}

export default function BlindWriteScreen({ onBack }: Props) {
  const [selected, setSelected] = useState<string | null>(null)
  const [step, setStep] = useState<1 | 2>(1)
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [step])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
    const el = textareaRef.current
    if (el) {
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={step === 2 ? () => setStep(1) : onBack} className={styles.backButton}>
          <img src={backGIcon} alt="뒤로 가기" className={styles.backIcon} />
        </button>
        <div className={styles.headerTextGroup}>
          <span className={styles.headerTitle}>글 쓰기</span>
          <span className={styles.headerSubtitle}>{step === 1 ? '카테고리 선택' : '내용 작성'}</span>
        </div>
      </div>

      <div className={styles.divider} />

      {step === 1 ? (
        <>
          <div className={styles.body}>
            <span className={styles.bodyTitle}>어떤 종류의 글인가요?</span>

            <div className={styles.categoryList}>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelected(cat.id)}
                  className={selected === cat.id ? styles.cardActive : styles.card}
                >
                  <div className={styles.cardLeft}>
                    <span className={selected === cat.id ? styles.cardLabelActive : styles.cardLabel}>{cat.label}</span>
                    <span className={selected === cat.id ? styles.cardDescActive : styles.cardDesc}>{cat.desc}</span>
                  </div>
                  <img
                    src={selected === cat.id ? checkIcon : checkOffIcon}
                    alt={selected === cat.id ? '선택됨' : '미선택'}
                    className={styles.checkIcon}
                  />
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setStep(2)} className={styles.nextButton}>
            <span className={styles.nextText}>다음으로</span>
            <img src={nextIcon} alt="다음" className={styles.nextIcon} />
          </button>
        </>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className={styles.textarea}
            placeholder={'글을 작성해주세요.\n아래 마이크 버튼으로 음성 입력도 가능해요.'}
            value={content}
            onChange={handleContentChange}
            rows={1}
          />

          <div className={styles.editorFooter}>
            <div className={styles.editorActions}>
              <button type="button" className={styles.photoButton}>
                <img src={imageWIcon} alt="사진" className={styles.photoIcon} />
                <span className={styles.photoText}>사진</span>
              </button>
              <button type="button" className={styles.voiceButton}>
                <img src={micWIcon} alt="음성 입력" className={styles.voiceIcon} />
                <span className={styles.voiceText}>음성 입력</span>
              </button>
            </div>

            <button
              type="button"
              disabled={!content.trim()}
              className={content.trim() ? styles.submitButtonActive : styles.submitButtonInactive}
            >
              <img src={content.trim() ? sendIcon : sendGIcon} alt="글 게시하기" className={styles.submitIcon} />
              <span className={content.trim() ? styles.submitTextActive : styles.submitTextInactive}>글 게시하기</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}