import { useEffect, useRef, useState } from 'react'
import styles from './DefaultWriteScreen.styles'
import { uploadImages, createPost } from '../../services/posts'
import { FILTERS, CATEGORY_CODE } from '../../utils/category'
import { getVideoDuration, MAX_VIDEO_BYTES, MAX_VIDEO_DURATION_SECONDS, ALLOWED_VIDEO_TYPES } from '../../utils/video'
import { useVideoPost } from '../../hooks/useVideoPost'
import Toast from '../../components/Toast'
import backIcon from '../../assets/images/back.svg'
import imageIcon from '../../assets/images/image.svg'
import videoIcon from '../../assets/images/video.svg'

const MAX_IMAGES = 3
const CATEGORIES = FILTERS.slice(1)

interface Props {
  onBack: () => void
}

export default function DefaultWriteScreen({ onBack }: Props) {
  const [category, setCategory] = useState<string | null>(null)
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
    if (!content.trim() || !category || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      const categoryCode = CATEGORY_CODE[category]
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

  const canSubmit = content.trim().length > 0 && !!category && !isSubmitting

  return (
    <>
      {showSuccessToast && <Toast message="글이 등록되었습니다." />}
      <div className={styles.container}>
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <button type="button" onClick={onBack} className={styles.backButton} aria-label="뒤로 가기">
              <img src={backIcon} alt="" className={styles.backIcon} />
            </button>
            <span className={styles.headerTitle}>글 작성</span>
          </div>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={canSubmit ? styles.submitButtonActive : styles.submitButtonInactive}
          >
            <span className={canSubmit ? styles.submitTextActive : styles.submitTextInactive}>
              {isSubmitting ? (videoPost.phase === 'waiting-caption' ? '자막 만드는 중...' : '게시 중...') : '게시하기'}
            </span>
          </button>
        </div>

        <div className={styles.categorySection}>
          <div className={styles.categoryList}>
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={category === cat ? styles.categoryChipActive : styles.categoryChipInactive}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.contentSection}>
          <textarea
            className={styles.textarea}
            placeholder="무슨 생각을 하고 계신가요?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={isSubmitting}
          />
        </div>

        {imagePreviews.length > 0 && (
          <div className={styles.imagePreviewRow}>
            {imagePreviews.map((preview, index) => (
              <div key={preview} className={styles.imagePreviewItem}>
                <img src={preview} alt={`첨부 이미지 미리보기 ${index + 1}`} className={styles.imagePreviewImg} />
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className={styles.imageRemoveButton}
                  aria-label={`이미지 ${index + 1} 삭제`}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {videoPreview && (
          <div className={styles.imagePreviewRow}>
            <div className={styles.imagePreviewItem}>
              <video src={videoPreview} controls className={styles.imagePreviewImg} />
              <button
                type="button"
                onClick={handleRemoveVideo}
                className={styles.imageRemoveButton}
                aria-label="동영상 삭제"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {submitError && <p className={styles.errorText}>{submitError}</p>}
        {videoPost.error && <p className={styles.errorText}>{videoPost.error}</p>}
        {videoPost.phase === 'waiting-caption' && (
          <p className="px-5 pb-3 text-xs text-gray-500">자막을 만드는 중이라 게시가 조금 오래 걸려요. 잠시만 기다려주세요.</p>
        )}
        {videoPost.phase === 'caption-failed' && (
          <>
            <p className={styles.errorText}>자막을 만들지 못했어요. 다시 시도하거나 자막 없이 올릴 수 있어요.</p>
            <div className="px-5 pb-3 flex gap-2">
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
          </>
        )}

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

        <div className={styles.footer}>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className={styles.photoButton}
              onClick={() => fileInputRef.current?.click()}
              disabled={isSubmitting || imageFiles.length >= MAX_IMAGES || !!videoFile}
            >
              <img src={imageIcon} alt="" className={styles.photoIcon} />
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
              <img src={videoIcon} alt="" className={styles.photoIcon} />
              <span className={styles.photoText}>{isReadingVideo ? '확인하는 중...' : '동영상'}</span>
            </button>
          </div>
          <span className={styles.charCount}>{content.length}자</span>
        </div>
      </div>
    </>
  )
}
