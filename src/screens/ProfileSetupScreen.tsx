import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import styles from './ProfileSetupScreen.styles'
import plusIcon from '../assets/images/plus.svg'
import avatarPlaceholderIcon from '../assets/images/mypage.svg'
import chevronIcon from '../assets/images/next.svg'
import { uploadImages } from '../services/media'
import { getTags, setTags, updateMe, type Tag } from '../services/users'

const BIO_MAX_LENGTH = 300
const INTEREST_MAX_COUNT = 10
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface Props {
  onDone: () => void
}

interface CategoryGroup {
  category: string
  tags: Tag[]
}

function groupByCategory(tags: Tag[]): CategoryGroup[] {
  const groups: CategoryGroup[] = []
  for (const tag of tags) {
    const group = groups.find((g) => g.category === tag.category)
    if (group) group.tags.push(tag)
    else groups.push({ category: tag.category, tags: [tag] })
  }
  return groups
}

export default function ProfileSetupScreen({ onDone }: Props) {
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [bio, setBio] = useState('')
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [tagsError, setTagsError] = useState('')
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([])
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getTags()
      .then((res) => setTagCatalog(res.tags))
      .catch(() => setTagsError('관심사 태그를 불러오지 못했어요.'))
      .finally(() => setTagsLoading(false))
  }, [])

  useEffect(() => {
    return () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview)
    }
  }, [profileImagePreview])

  const categories = groupByCategory(tagCatalog)

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('jpg·png·gif·webp 형식만 업로드할 수 있어요.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError('이미지 용량은 10MB를 넘을 수 없어요.')
      return
    }

    setPhotoError('')
    setProfileImage(file)
    setProfileImagePreview(URL.createObjectURL(file))
  }

  const handlePhotoRemove = () => {
    setProfileImage(null)
    setProfileImagePreview(null)
    setPhotoError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const toggleCategory = (category: string) => {
    setOpenCategory((prev) => (prev === category ? null : category))
  }

  const toggleTag = (code: string) => {
    setSelectedTagCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= INTEREST_MAX_COUNT) return prev
      return [...prev, code]
    })
  }

  const handleSave = async () => {
    setSaving(true)
    setSaveError('')

    try {
      let profileImageUrl: string | undefined
      if (profileImage) {
        const { items } = await uploadImages([profileImage])
        profileImageUrl = items[0]?.url
      }

      const trimmedBio = bio.trim()
      if (profileImageUrl || trimmedBio) {
        await updateMe({
          ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
          ...(trimmedBio ? { bio: trimmedBio } : {}),
        })
      }

      if (selectedTagCodes.length > 0) {
        await setTags(selectedTagCodes)
      }

      onDone()
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 413) {
        setSaveError('이미지 용량은 10MB를 넘을 수 없어요.')
      } else if (apiErr?.status === 400) {
        setSaveError(apiErr.detail ?? '입력 내용을 다시 확인해주세요.')
      } else if (apiErr?.status === 404) {
        setSaveError('선택한 태그 정보가 최신이 아니에요. 다시 선택해주세요.')
      } else {
        setSaveError('저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>프로필을 꾸며보세요</h1>
          <p className={styles.subtitle}>지금 하지 않아도 나중에 마이페이지에서 설정할 수 있어요</p>
        </div>
        <button type="button" onClick={onDone} className={styles.skipButton}>
          건너뛰기
        </button>
      </div>

      <div className={styles.form}>
        {/* 프로필 사진 (선택) */}
        <div className={styles.photoSection}>
          <div className={styles.avatarWrapper}>
            {profileImagePreview ? (
              <img src={profileImagePreview} alt="프로필 미리보기" className={styles.avatarImage} />
            ) : (
              <div className={styles.avatarPlaceholder}>
                <img src={avatarPlaceholderIcon} alt="" className={styles.avatarPlaceholderIcon} />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={styles.avatarEditButton}
              aria-label="프로필 사진 선택"
            >
              <img src={plusIcon} alt="" className={styles.avatarEditIcon} />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handlePhotoSelect}
              className="hidden"
              aria-label="프로필 사진 선택"
            />
          </div>
          {profileImagePreview && (
            <button type="button" onClick={handlePhotoRemove} className={styles.avatarRemoveButton}>
              사진 삭제
            </button>
          )}
          {photoError && <p className={styles.errorText}>{photoError}</p>}
        </div>

        {/* 자기소개 (선택) */}
        <div className={styles.fieldWrapper}>
          <label htmlFor="bio" className={styles.label}>
            자기소개 <span className={styles.optionalLabel}>(선택)</span>
          </label>
          <div className={styles.textareaWrapper}>
            <textarea
              id="bio"
              rows={4}
              placeholder="나를 소개하는 글을 남겨보세요"
              maxLength={BIO_MAX_LENGTH}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className={styles.textarea}
            />
            <span className={styles.charCounter}>{bio.length}/{BIO_MAX_LENGTH}</span>
          </div>
        </div>

        {/* 관심사 태그 (선택) */}
        <div className={styles.fieldWrapper}>
          <div className="flex items-center justify-between">
            <label className={styles.label}>
              관심사 태그 <span className={styles.optionalLabel}>(선택)</span>
            </label>
            <span className={styles.interestCounter}>{selectedTagCodes.length}/{INTEREST_MAX_COUNT} 선택됨</span>
          </div>

          {tagsLoading && <p className={styles.optionalLabel}>태그를 불러오는 중...</p>}
          {tagsError && <p className={styles.errorText}>{tagsError}</p>}

          {!tagsLoading && !tagsError && (
            <div className={styles.interestList}>
              {categories.map((group) => {
                const isOpen = openCategory === group.category
                const selectedCount = group.tags.filter((tag) => selectedTagCodes.includes(tag.code)).length
                return (
                  <div key={group.category} className={styles.categoryGroup}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(group.category)}
                      className={isOpen ? styles.categoryButtonOpen : styles.categoryButton}
                    >
                      <span className={styles.categoryButtonLeft}>
                        <span className={isOpen ? styles.categoryLabelOpen : styles.categoryLabel}>
                          {group.category}
                        </span>
                        {selectedCount > 0 && (
                          <span className={styles.categoryCount}>{selectedCount}</span>
                        )}
                      </span>
                      <img
                        src={chevronIcon}
                        alt=""
                        className={isOpen ? styles.chevronIconOpen : styles.chevronIcon}
                      />
                    </button>

                    {isOpen && (
                      <div className={styles.tagPanel}>
                        {group.tags.map((tag) => {
                          const isSelected = selectedTagCodes.includes(tag.code)
                          const isDisabled = !isSelected && selectedTagCodes.length >= INTEREST_MAX_COUNT
                          return (
                            <button
                              key={tag.code}
                              type="button"
                              disabled={isDisabled}
                              onClick={() => toggleTag(tag.code)}
                              className={
                                isSelected
                                  ? styles.tagChipSelected
                                  : isDisabled
                                    ? styles.tagChipDisabled
                                    : styles.tagChip
                              }
                            >
                              {tag.label}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <button
        type="button"
        disabled={saving}
        onClick={handleSave}
        className={[
          styles.submitButtonBase,
          !saving ? styles.submitButtonActive : styles.submitButtonDisabled,
        ].join(' ')}
      >
        {saving ? '저장 중...' : '저장하고 시작하기'}
      </button>

      {saveError && <p className={styles.apiError}>{saveError}</p>}
    </div>
  )
}
