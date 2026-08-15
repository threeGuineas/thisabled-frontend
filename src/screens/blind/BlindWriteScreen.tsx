import { useEffect, useRef, useState } from 'react'
import styles from './BlindWriteScreen.styles'
import { useVoiceInput } from '../../hooks/useVoiceInput'
import backGIcon from '../../assets/images/back-g.svg'
import checkIcon from '../../assets/images/check.svg'
import checkOffIcon from '../../assets/images/check-off.svg'
import nextIcon from '../../assets/images/next.svg'
import imageWIcon from '../../assets/images/image-w.svg'
import micWIcon from '../../assets/images/mic-w.svg'
import videoYIcon from '../../assets/images/video-y.svg'
import sendIcon from '../../assets/images/send.svg'
import sendGIcon from '../../assets/images/send-g.svg'
import { uploadImages, createPost } from '../../services/posts'
import { CATEGORY_CODE } from '../../utils/category'
import { getVideoDuration, MAX_VIDEO_BYTES, MAX_VIDEO_DURATION_SECONDS, ALLOWED_VIDEO_TYPES } from '../../utils/video'
import { useVideoPost } from '../../hooks/useVideoPost'
import Toast from '../../components/Toast'

const MAX_IMAGES = 3

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
  const [imageFiles, setImageFiles] = useState<File[]>([])
  const [imagePreviews, setImagePreviews] = useState<string[]>([])
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [videoPreview, setVideoPreview] = useState<string | null>(null)
  const [videoDuration, setVideoDuration] = useState(0)
  const [isReadingVideo, setIsReadingVideo] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const videoPost = useVideoPost()

  const { voiceState, voiceError, toggleRecording, stopRecording } = useVoiceInput((text) => {
    setContent((prev) => (prev ? `${prev} ${text}` : text))
  })

  const voiceButtonClass =
    voiceState === 'recording' ? styles.voiceButtonRecording
    : voiceState === 'transcribing' ? styles.voiceButtonTranscribing
    : styles.voiceButton

  const voiceIconClass =
    voiceState === 'recording' ? styles.voiceIconRecording : styles.voiceIcon

  const voiceLabel =
    voiceState === 'recording' ? '녹음 중...'
    : voiceState === 'transcribing' ? '인식 중...'
    : voiceState === 'error' ? '다시 시도'
    : '음성 입력'

  useEffect(() => {
    window.scrollTo(0, 0)
    stopRecording()
  }, [step, stopRecording])

  // 이전 preview URL 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview)
    }
  }, [videoPreview])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length === 0) return
    const room = MAX_IMAGES - imageFiles.length
    const accepted = files.slice(0, room)
    if (files.length > room) {
      setSubmitError(`사진은 최대 ${MAX_IMAGES}장까지 첨부할 수 있어요.`)
    } else {
      setSubmitError(null)
    }
    setImageFiles((prev) => [...prev, ...accepted])
    setImagePreviews((prev) => [...prev, ...accepted.map((file) => URL.createObjectURL(file))])
    // 같은 파일 재선택 허용
    e.target.value = ''
  }

  const handleRemoveImage = (index: number) => {
    URL.revokeObjectURL(imagePreviews[index])
    setImageFiles((prev) => prev.filter((_, i) => i !== index))
    setImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const handleVideoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setSubmitError(null)
    if (!ALLOWED_VIDEO_TYPES.includes(file.type)) {
      setSubmitError('mp4·webm·mov 형식만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_VIDEO_BYTES) {
      setSubmitError('동영상 용량은 200MB를 넘을 수 없어요.')
      return
    }
    setIsReadingVideo(true)
    try {
      const durationSeconds = await getVideoDuration(file)
      if (durationSeconds > MAX_VIDEO_DURATION_SECONDS) {
        setSubmitError('동영상 길이는 3분을 넘을 수 없어요.')
        return
      }
      setVideoFile(file)
      setVideoPreview(URL.createObjectURL(file))
      setVideoDuration(durationSeconds)
    } catch {
      setSubmitError('동영상 정보를 읽지 못했어요. 다른 파일로 시도해주세요.')
    } finally {
      setIsReadingVideo(false)
    }
  }

  const handleRemoveVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview)
    setVideoFile(null)
    setVideoPreview(null)
    setVideoDuration(0)
  }

  const handleSubmit = async () => {
    if (!content.trim() || !selected || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const categoryCode = CATEGORY_CODE[selected]
      if (videoFile) {
        const post = await videoPost.publish(videoFile, Math.round(videoDuration), categoryCode, content.trim())
        if (!post) return
      } else {
        let mediaIds: string[] = []
        if (imageFiles.length > 0) {
          const uploaded = await uploadImages(imageFiles)
          mediaIds = uploaded.map((m) => m.media_id)
        }
        await createPost(categoryCode, content.trim(), mediaIds)
      }
      setShowSuccessToast(true)
      setTimeout(onBack, 1500)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSubmitError(e.detail ?? '게시글 등록에 실패했습니다. 다시 시도해주세요.')
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

  const handleRetryCaption = async () => {
    setIsSubmitting(true)
    const post = await videoPost.retry()
    setIsSubmitting(false)
    if (post) {
      setShowSuccessToast(true)
      setTimeout(onBack, 1500)
    }
  }

  return (
    <>
    {showSuccessToast && <Toast message="글 작성이 완료되었습니다." />}
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

          <button
            type="button"
            onClick={() => selected && setStep(2)}
            disabled={!selected}
            className={selected ? styles.nextButton : `${styles.nextButton} opacity-40`}
          >
            <span className={styles.nextText}>다음으로</span>
            <img src={nextIcon} alt="다음" className={styles.nextIcon} />
          </button>
        </>
      ) : (
        <>
          <div className={styles.textareaWrapper}>
            <textarea
              className={styles.textarea}
              placeholder={'글을 작성해주세요.\n아래 마이크 버튼으로 음성 입력도 가능해요.'}
              value={content}
              onChange={handleContentChange}
              disabled={isSubmitting}
            />

            {imagePreviews.length > 0 && (
              <div className="mx-5 mt-3 flex gap-2">
                {imagePreviews.map((preview, index) => (
                  <div key={preview} className="relative flex-1">
                    <img src={preview} alt={`첨부 이미지 미리보기 ${index + 1}`} className="w-full rounded-2xl object-cover aspect-square" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-sm font-bold"
                      aria-label={`이미지 ${index + 1} 삭제`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {videoPreview && (
              <div className="mx-5 mt-3">
                <div className="relative">
                  <video src={videoPreview} controls className="w-full rounded-2xl object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveVideo}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-sm font-bold"
                    aria-label="동영상 삭제"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}

            {voiceError && (
              <p className="mx-5 mt-2 text-xs text-red-400">{voiceError}</p>
            )}

            {submitError && (
              <p className="mx-5 mt-2 text-sm text-red-500">{submitError}</p>
            )}
            {videoPost.error && (
              <p className="mx-5 mt-2 text-sm text-red-500">{videoPost.error}</p>
            )}
            {videoPost.phase === 'waiting-caption' && (
              <p className="mx-5 mt-2 text-sm text-gray-500">자막을 만드는 중이라 게시가 조금 오래 걸려요. 잠시만 기다려주세요.</p>
            )}
            {videoPost.phase === 'caption-failed' && (
              <div className="mx-5 mt-3 flex flex-col gap-2">
                <p className="text-sm text-red-500">자막을 만들지 못했어요. 다시 시도하거나 자막 없이 올릴 수 있어요.</p>
                <button
                  type="button"
                  onClick={handleRetryCaption}
                  disabled={isSubmitting}
                  className={styles.retryButtonActive}
                >
                  <span className={styles.retryTextActive}>{isSubmitting ? '재시도 중...' : '자막 다시 만들기'}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePublishWithoutCaption}
                  disabled={isSubmitting}
                  className={styles.submitButtonActive}
                >
                  <span className={styles.submitTextActive}>{isSubmitting ? '게시 중...' : '자막 없이 게시하기'}</span>
                </button>
              </div>
            )}
          </div>

          {/* 숨김 파일 입력 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            aria-label="이미지 파일 선택"
            className="hidden"
            multiple
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

          <div className={styles.editorFooter}>
            <div className={styles.editorActions}>
              <button
                type="button"
                className={styles.photoButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting || imageFiles.length >= MAX_IMAGES || !!videoFile}
              >
                <img src={imageWIcon} alt="사진" className={styles.photoIcon} />
                <span className={styles.photoText}>
                  사진{imageFiles.length > 0 ? ` ${imageFiles.length}/${MAX_IMAGES}` : ''}
                </span>
              </button>
              <button
                type="button"
                className={styles.photoButton}
                onClick={() => videoInputRef.current?.click()}
                disabled={isSubmitting || isReadingVideo || imageFiles.length > 0 || !!videoFile}
              >
                <img src={videoYIcon} alt="동영상" className={styles.photoIcon} />
                <span className={styles.photoText}>{isReadingVideo ? '확인하는 중...' : '동영상'}</span>
              </button>
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isSubmitting || voiceState === 'transcribing'}
                className={voiceButtonClass}
              >
                <img src={micWIcon} alt="음성 입력" className={voiceIconClass} />
                <span className={styles.voiceText}>{voiceLabel}</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleSubmit}
              disabled={!content.trim() || !selected || isSubmitting}
              className={content.trim() && selected && !isSubmitting ? styles.submitButtonActive : styles.submitButtonInactive}
            >
              <img src={content.trim() && selected && !isSubmitting ? sendIcon : sendGIcon} alt="글 게시하기" className={styles.submitIcon} />
              <span className={content.trim() && selected && !isSubmitting ? styles.submitTextActive : styles.submitTextInactive}>
                {isSubmitting ? (videoPost.phase === 'waiting-caption' ? '자막 만드는 중...' : '게시 중...') : '글 게시하기'}
              </span>
            </button>
          </div>
        </>
      )}
    </div>
    </>
  )
}
