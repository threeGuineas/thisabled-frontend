import { useEffect, useRef, useState } from 'react'
import styles from './DefaultWriteScreen.styles'
import { uploadImages, createPost } from '../../services/posts'
import { FILTERS } from '../../utils/category'
import Toast from '../../components/Toast'
import backIcon from '../../assets/images/back.svg'
import imageIcon from '../../assets/images/image.svg'

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
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // 이전 preview URL 해제 (메모리 누수 방지)
  useEffect(() => {
    return () => {
      imagePreviews.forEach((url) => URL.revokeObjectURL(url))
    }
  }, [imagePreviews])

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

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      let mediaIds: string[] = []
      if (imageFiles.length > 0) {
        const uploaded = await uploadImages(imageFiles)
        mediaIds = uploaded.map((m) => m.media_id)
      }
      await createPost(content.trim(), mediaIds)
      setShowSuccessToast(true)
      setTimeout(onBack, 1500)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setSubmitError(e.detail ?? '게시글 등록에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = content.trim().length > 0 && !isSubmitting

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
              {isSubmitting ? '게시 중...' : '게시하기'}
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

        {submitError && <p className={styles.errorText}>{submitError}</p>}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          aria-label="이미지 파일 선택"
          className="hidden"
          multiple
          onChange={handleImageSelect}
        />

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.photoButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isSubmitting || imageFiles.length >= MAX_IMAGES}
          >
            <img src={imageIcon} alt="" className={styles.photoIcon} />
            <span className={styles.photoText}>
              사진{imageFiles.length > 0 ? ` ${imageFiles.length}/${MAX_IMAGES}` : ''}
            </span>
          </button>
          <span className={styles.charCount}>{content.length}자</span>
        </div>
      </div>
    </>
  )
}
