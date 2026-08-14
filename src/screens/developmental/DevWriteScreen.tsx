import { useEffect, useRef, useState } from 'react'
import styles from './DevWriteScreen.styles'
import { uploadImages, createPost } from '../../services/posts'
import { completeText } from '../../services/comm'
import { useAiNotice } from '../../hooks/useAiNotice'
import { useVideoPost } from '../../hooks/useVideoPost'
import AiNoticeModal from '../../components/AiNoticeModal'
import Toast from '../../components/Toast'
import { getVideoDuration, MAX_VIDEO_BYTES, MAX_VIDEO_DURATION_SECONDS, ALLOWED_VIDEO_TYPES } from '../../utils/video'
import backIcon from '../../assets/images/back.svg'
import imageIcon from '../../assets/images/image.svg'
import videoIcon from '../../assets/images/video.svg'

type Step = 'compose' | 'confirm'

type Media =
  | { kind: 'photo'; file: File; preview: string }
  | { kind: 'video'; file: File; preview: string; durationSeconds: number }

const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface Props {
  onBack: () => void
}

// DEV-01: 한 화면에서 하나의 주요 행동만 강조 — 글쓰기(compose)와 게시 확인(confirm)을 화면으로 분리한다.
// 사진과 동영상 중 하나만 첨부할 수 있게 해 선택지를 줄인다.
export default function DevWriteScreen({ onBack }: Props) {
  const [step, setStep] = useState<Step>('compose')
  const [content, setContent] = useState('')
  const [media, setMedia] = useState<Media | null>(null)
  const [isReadingVideo, setIsReadingVideo] = useState(false)
  const [mediaError, setMediaError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const { noticeOpen, runWithNotice, confirmNotice, cancelNotice } = useAiNotice()
  const videoPost = useVideoPost()
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isCompleting, setIsCompleting] = useState(false)
  const [completeError, setCompleteError] = useState<string | null>(null)

  // 첫 진입(마운트) 시에만 스크롤을 맨 위로 — 글쓰기 ↔ 게시 확인 전환마다 매번 초기화하지는 않는다
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (media) URL.revokeObjectURL(media.preview)
    }
  }, [media])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMediaError(null)
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setMediaError('jpg·png·gif·webp 형식만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setMediaError('사진 용량은 10MB를 넘을 수 없어요.')
      return
    }
    setMedia({ kind: 'photo', file, preview: URL.createObjectURL(file) })
  }

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setMediaError(null)
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setMediaError('mp4·webm·mov 형식만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setMediaError('동영상 용량은 200MB를 넘을 수 없어요.')
      return
    }
    setIsReadingVideo(true)
    try {
      const durationSeconds = await getVideoDuration(file)
      if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        setMediaError('동영상 길이는 3분을 넘을 수 없어요.')
        return
      }
      setMedia({ kind: 'video', file, preview: URL.createObjectURL(file), durationSeconds })
    } catch {
      setMediaError('동영상 정보를 읽지 못했어요. 다른 파일로 시도해주세요.')
    } finally {
      setIsReadingVideo(false)
    }
  }

  const handleRemoveMedia = () => {
    if (media) URL.revokeObjectURL(media.preview)
    setMedia(null)
    setMediaError(null)
  }

  // COMM-02: 쓰다 만 문장의 완성본을 제안 — 선택해도 입력창에 채우기만 하고 자동으로 게시하지 않는다
  const handleComplete = () => {
    if (!content.trim() || isCompleting) return
    runWithNotice(async () => {
      setIsCompleting(true)
      setCompleteError(null)
      setSuggestions([])
      try {
        const result = await completeText(content.trim())
        setSuggestions(result.suggestions)
      } catch (err: unknown) {
        const e = err as { detail?: string }
        setCompleteError(e.detail ?? '문장 완성을 도와주지 못했어요.')
      } finally {
        setIsCompleting(false)
      }
    })
  }

  const applySuggestion = (suggestion: string) => {
    setContent((prev) => (prev ? `${prev} ${suggestion}` : suggestion))
    setSuggestions([])
  }

  const handleSubmit = async () => {
    if (isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      if (media?.kind === 'video') {
        const post = await videoPost.publish(media.file, Math.round(media.durationSeconds), content.trim())
        if (!post) return
      } else {
        let mediaIds: string[] = []
        if (media?.kind === 'photo') {
          const uploaded = await uploadImages([media.file])
          mediaIds = uploaded.map((m) => m.media_id)
        }
        await createPost(content.trim(), mediaIds)
      }
      setShowSuccessToast(true)
      setTimeout(onBack, 1500)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSubmitError(e.detail ?? '글 등록에 실패했어요. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePublishWithoutCaption = async () => {
    setIsSubmitting(true)
    const post = await videoPost.publishWithoutCaption()
    setIsSubmitting(false)
    if (post) {
      setShowSuccessToast(true)
      setTimeout(onBack, 1500)
    }
  }

  const canGoNext = content.trim().length > 0

  if (step === 'confirm') {
    return (
      <>
        {showSuccessToast && <Toast message="글이 올라갔어요." />}
        <div className={styles.container}>
          <div className={styles.header}>
            <button type="button" onClick={() => setStep('compose')} className={styles.backButton} aria-label="뒤로 가기" disabled={isSubmitting}>
              <img src={backIcon} alt="" className={styles.backIcon} />
            </button>
            <span className={styles.headerTitle}>게시 확인</span>
          </div>

          <div className={styles.confirmBody}>
            <p className={styles.confirmTitle}>이 내용을 올릴까요?</p>
            <p className={styles.confirmSubtitle}>올리면 모두에게 보여요.</p>

            <div className={styles.confirmPreviewCard}>
              {media?.kind === 'photo' && <img src={media.preview} alt="첨부 사진 미리보기" className={styles.confirmPreviewImage} />}
              {media?.kind === 'video' && <video src={media.preview} controls className={styles.confirmPreviewVideo} />}
              <p className={styles.confirmPreviewText}>{content.trim()}</p>
            </div>

            {submitError && <p className={styles.errorText}>{submitError}</p>}
            {videoPost.error && <p className={styles.errorText}>{videoPost.error}</p>}
            {videoPost.phase === 'waiting-caption' && (
              <p className={styles.mediaLoadingText}>자막을 만드는 중이라 조금 오래 걸려요. 잠시만 기다려주세요.</p>
            )}
            {videoPost.phase === 'caption-failed' && (
              <p className={styles.errorText}>자막을 만들지 못했어요. 자막 없이 올릴까요?</p>
            )}
          </div>

          <div className={styles.footer}>
            {videoPost.phase === 'caption-failed' ? (
              <button
                type="button"
                onClick={handlePublishWithoutCaption}
                disabled={isSubmitting}
                className={styles.nextButtonActive}
              >
                <span className={styles.nextButtonTextActive}>{isSubmitting ? '올리는 중...' : '자막 없이 올리기'}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className={styles.nextButtonActive}
              >
                <span className={styles.nextButtonTextActive}>
                  {isSubmitting ? (videoPost.phase === 'waiting-caption' ? '자막 만드는 중...' : '올리는 중...') : '올리기'}
                </span>
              </button>
            )}
          </div>
        </div>
      </>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.backIcon} />
        </button>
        <span className={styles.headerTitle}>글쓰기</span>
      </div>

      <div className={styles.body}>
        <span className={styles.guideText}>무슨 이야기를 하고 싶으세요?</span>

        <textarea
          className={styles.textarea}
          placeholder="여기에 적어보세요"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          disabled={isSubmitting}
          maxLength={2000}
        />
        <span className={styles.charCount}>{content.length}/2000자</span>

        <button type="button" onClick={handleComplete} disabled={!content.trim() || isCompleting} className={styles.commmButton}>
          <span className={styles.commmButtonText}>{isCompleting ? '생각하는 중...' : '문장 완성 도움받기'}</span>
        </button>
        {completeError && <p className={styles.commmErrorText}>{completeError}</p>}

        {suggestions.length > 0 && (
          <div className={styles.commmSuggestionList}>
            {suggestions.map((suggestion, i) => (
              <button key={i} type="button" onClick={() => applySuggestion(suggestion)} className={styles.commmSuggestionCard}>
                <span className={styles.commmBadge}>AI 제안</span>
                <p className={styles.commmSuggestionText}>{suggestion}</p>
              </button>
            ))}
          </div>
        )}

        {media?.kind === 'photo' && (
          <div className={styles.photoPreviewWrapper}>
            <img src={media.preview} alt="첨부 사진 미리보기" className={styles.photoPreviewImg} />
            <button type="button" onClick={handleRemoveMedia} className={styles.mediaRemoveButton} aria-label="사진 삭제">
              ✕
            </button>
          </div>
        )}

        {media?.kind === 'video' && (
          <div className={styles.videoPreviewWrapper}>
            <video src={media.preview} controls className={styles.videoPreviewVideo} />
            <button type="button" onClick={handleRemoveMedia} className={styles.mediaRemoveButton} aria-label="동영상 삭제">
              ✕
            </button>
          </div>
        )}

        {!media && (
          <div className={styles.attachRow}>
            <button type="button" onClick={() => imageInputRef.current?.click()} className={styles.attachButton} disabled={isSubmitting || isReadingVideo}>
              <img src={imageIcon} alt="" className={styles.attachIcon} />
              <span className={styles.attachButtonText}>사진 넣기</span>
            </button>
            <button type="button" onClick={() => videoInputRef.current?.click()} className={styles.attachButton} disabled={isSubmitting || isReadingVideo}>
              <img src={videoIcon} alt="" className={styles.attachIcon} />
              <span className={styles.attachButtonText}>{isReadingVideo ? '확인하는 중...' : '동영상 넣기'}</span>
            </button>
          </div>
        )}

        {mediaError && <p className={styles.errorText}>{mediaError}</p>}

        <input
          ref={imageInputRef}
          type="file"
          accept={ALLOWED_IMAGE_TYPES.join(',')}
          aria-label="이미지 파일 선택"
          className="hidden"
          onChange={handleImageSelect}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept={ALLOWED_VIDEO_TYPES.join(',')}
          aria-label="동영상 파일 선택"
          className="hidden"
          onChange={handleVideoSelect}
        />
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          onClick={() => canGoNext && setStep('confirm')}
          disabled={!canGoNext}
          className={canGoNext ? styles.nextButtonActive : styles.nextButtonInactive}
        >
          <span className={canGoNext ? styles.nextButtonTextActive : styles.nextButtonTextInactive}>다음</span>
        </button>
      </div>

      {noticeOpen && <AiNoticeModal onConfirm={confirmNotice} onCancel={cancelNotice} />}
    </div>
  )
}
