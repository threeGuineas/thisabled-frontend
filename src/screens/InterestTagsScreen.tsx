import { useEffect, useState } from 'react'
import styles from './InterestTagsScreen.styles'
import chevronIcon from '../assets/images/next.svg'
import { getTags, setTags, type Tag } from '../services/users'

const INTEREST_MAX_COUNT = 10

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

export default function InterestTagsScreen({ onDone }: Props) {
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [tagsError, setTagsError] = useState('')
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>([])
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    getTags()
      .then((res) => setTagCatalog(res.tags))
      .catch(() => setTagsError('관심사 태그를 불러오지 못했어요.'))
      .finally(() => setTagsLoading(false))
  }, [])

  const categories = groupByCategory(tagCatalog)

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
      if (selectedTagCodes.length > 0) {
        await setTags(selectedTagCodes)
      }
      onDone()
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 400) {
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
          <h1 className={styles.title}>관심사를<br />선택해주세요.</h1>
          <p className={styles.subtitle}>지금 하지 않아도 나중에 마이페이지에서 설정할 수 있어요</p>
        </div>
        <button type="button" onClick={onDone} className={styles.skipButton}>
          스킵
        </button>
      </div>

      <div className={styles.form}>
        <div className={styles.fieldWrapper}>
          <div className="flex items-center justify-between">
            <label className={styles.label}>관심사 태그</label>
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
        {saving ? '저장 중...' : '저장하고 계속하기'}
      </button>

      {saveError && <p className={styles.apiError}>{saveError}</p>}
    </div>
  )
}
