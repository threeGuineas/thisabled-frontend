import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import styles from './DevMyScreen.styles'
import BottomNav, { type Tab } from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import modeIcon from '../../assets/images/mode.svg'
import checkGreenIcon from '../../assets/images/check-green.svg'
import friendIcon from '../../assets/images/friend.svg'
import backIcon from '../../assets/images/back.svg'
import chevronIcon from '../../assets/images/next.svg'
import {
  getMe, updateMe, setMode, getTags, setTags, updateSettings, deleteAccount,
  type MeProfile, type Tag,
} from '../../services/users'
import { uploadImages } from '../../services/media'
import { logout, tokenStorage } from '../../services/auth'
import { getFriends, getBlocks, unfriend, unblockUser } from '../../services/friends'
import type { Author } from '../../services/posts'
import { avatarUrlFor } from '../../utils/avatar'
import { groupByCategory } from '../../utils/tags'

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,12}$/
const BIO_MAX_LENGTH = 300
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const TAG_MAX_COUNT = 10

const MODES = [
  { id: 'default',       title: '기본화면', desc: '보통 화면 그대로 써요' },
  { id: 'visual',        title: '시각장애', desc: '선명한 색 · 큰 글씨 · 소리로 안내' },
  { id: 'hearing',       title: '청각장애', desc: '자막 · 눈으로 보는 알림' },
  { id: 'developmental', title: '발달장애', desc: '쉬운 말 · 큰 버튼 · 도우미 도움' },
] as const

type ModeId = typeof MODES[number]['id']
type View = 'main' | 'editProfile' | 'tags' | 'withdraw' | 'contacts'
type PostsAction = 'anonymize' | 'delete'

interface Props {
  onTabChange: (tab: Tab) => void
  onLoggedOut: () => void
  onModeChanged: (mode: ModeId) => void
}

// DEV-01: 정보와 선택지를 줄이고 큰 버튼을 쓴다. 관심사 태그처럼 목록이 긴 기능은
// 카테고리를 접어두고 하나씩 펼쳐보게 해 한 화면에 보이는 선택지 수를 줄인다.
export default function DevMyScreen({ onTabChange, onLoggedOut, onModeChanged }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('my')
  const [view, setView] = useState<View>('main')

  const [me, setMe] = useState<MeProfile | null>(null)
  const [meError, setMeError] = useState('')

  const [activeModeId, setActiveModeId] = useState<ModeId>('developmental')
  const [pendingMode, setPendingMode] = useState<ModeId | null>(null)
  const [modeSaving, setModeSaving] = useState(false)
  const [modeError, setModeError] = useState('')

  const [strangerSaving, setStrangerSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => {
    getMe().then(setMe).catch(() => setMeError('프로필을 불러오지 못했어요.'))
  }, [])

  // 첫 진입(마운트) 시에만 스크롤을 맨 위로 — 하위 화면 전환마다 매번 초기화하지는 않는다
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleTabChange = (tab: Tab) => {
    setActiveTab(tab)
    onTabChange(tab)
  }

  const handleModeClick = (id: ModeId) => {
    if (!me || id === activeModeId) return
    setModeError('')
    setPendingMode(id)
  }

  const handleModeConfirm = async () => {
    if (!pendingMode || modeSaving) return
    setModeSaving(true)
    setModeError('')
    try {
      const updated = await setMode(pendingMode)
      setMe(updated)
      setActiveModeId(pendingMode)
      setPendingMode(null)
      onModeChanged(pendingMode)
    } catch {
      setModeError('화면을 바꾸지 못했어요. 잠시 후 다시 해보세요.')
    } finally {
      setModeSaving(false)
    }
  }

  const handleModeCancel = () => {
    setPendingMode(null)
    setModeError('')
  }

  const handleToggleStranger = async () => {
    if (!me || strangerSaving) return
    setStrangerSaving(true)
    try {
      const updated = await updateSettings({ stranger_requests_allowed: !me.stranger_requests_allowed })
      setMe(updated)
    } catch {
      // 실패 시 me가 그대로라 스위치도 자동으로 이전 상태로 남는다
    } finally {
      setStrangerSaving(false)
    }
  }

  const handleLogout = async () => {
    if (loggingOut) return
    setLoggingOut(true)
    await logout().catch(() => {})
    onLoggedOut()
  }

  const pendingModeTitle = MODES.find((m) => m.id === pendingMode)?.title ?? ''

  if (view === 'editProfile' && me) {
    return <ProfileEditView me={me} onSaved={(updated) => { setMe(updated); setView('main') }} onBack={() => setView('main')} />
  }

  if (view === 'tags' && me) {
    return <TagsEditView me={me} onSaved={(updated) => { setMe(updated); setView('main') }} onBack={() => setView('main')} />
  }

  if (view === 'withdraw') {
    return <WithdrawView onWithdrawn={onLoggedOut} onBack={() => setView('main')} />
  }

  if (view === 'contacts') {
    return <ContactsManageView onBack={() => setView('main')} />
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>마이</span>
      </div>

      <div className={styles.section}>
        <div className={styles.profileCard}>
          <div className={styles.profileRow}>
            <div className={styles.profileInfo}>
              {me?.profile_image_url ? (
                <img src={avatarUrlFor(me.profile_image_url)} alt="" className={styles.avatar} />
              ) : (
                <div className={`${styles.avatar} bg-[#22B07D] flex items-center justify-center text-white font-bold text-2xl`}>
                  {me ? me.nickname[0].toUpperCase() : '?'}
                </div>
              )}
              <span className={styles.nickname}>{me ? me.nickname : meError || '불러오는 중...'}</span>
            </div>
            <button type="button" disabled={!me} onClick={() => setView('editProfile')} className={styles.editButton}>
              <span className={styles.editButtonText}>바꾸기</span>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.tagsSectionHeader}>
          <span className={styles.tagsSectionTitle}>관심사</span>
          <button type="button" disabled={!me} onClick={() => setView('tags')} className={styles.editButton}>
            <span className={styles.editButtonText}>바꾸기</span>
          </button>
        </div>
        <div className={styles.tagsCard}>
          {me && me.tags.length > 0 ? (
            <div className={styles.tagsChipRow}>
              {me.tags.map((tag) => (
                <span key={tag.code} className={styles.tagsDisplayChip}>{tag.label}</span>
              ))}
            </div>
          ) : (
            <span className={styles.tagsEmptyText}>아직 고른 관심사가 없어요.</span>
          )}
        </div>
      </div>

      <div className={styles.modeSection}>
        <span className={styles.modeSectionTitle}>화면 종류</span>
        <div className={styles.modeCard}>
          <div className={styles.modeList}>
            {MODES.map((mode, idx) => {
              const isActive = activeModeId === mode.id
              return (
                <div key={mode.id}>
                  {idx !== 0 && <div className={styles.modeDivider} />}
                  <button type="button" onClick={() => handleModeClick(mode.id)} className={isActive ? styles.modeButtonActive : styles.modeButton}>
                    <div className={styles.modeTextGroup}>
                      <span className={styles.modeTitle}>{mode.title}</span>
                      <span className={styles.modeDesc}>{mode.desc}</span>
                    </div>
                    <img src={isActive ? checkGreenIcon : modeIcon} alt="" className={styles.modeIcon} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className={styles.settingsSection}>
        <span className={styles.settingsSectionTitle}>설정</span>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsTextGroup}>
              <span className={styles.settingsTitle}>모르는 사람 대화 받기</span>
              <span className={styles.settingsDesc}>친구가 아닌 사람이 나에게 말을 걸 수 있게 할지 정해요</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!me?.stranger_requests_allowed}
              aria-label="모르는 사람 대화 받기"
              disabled={!me || strangerSaving}
              onClick={handleToggleStranger}
              className={[styles.toggleTrack, me?.stranger_requests_allowed ? styles.toggleTrackOn : styles.toggleTrackOff].join(' ')}
            >
              <span className={[styles.toggleKnob, me?.stranger_requests_allowed ? styles.toggleKnobOn : styles.toggleKnobOff].join(' ')} />
            </button>
          </div>
        </div>
      </div>

      <div className={styles.etcSection}>
        <span className={styles.etcSectionTitle}>다른 기능</span>
        <div className={styles.etcCard}>
          <button type="button" onClick={() => setView('contacts')} className={styles.etcButton}>
            <img src={friendIcon} alt="" className="w-6 h-6" />
            <div className={styles.etcTextGroup}>
              <span className={styles.etcTitle}>친구와 차단 목록</span>
              <span className={styles.etcDesc}>친구 보기 · 차단 풀기</span>
            </div>
            <img src={modeIcon} alt="" className={styles.etcRightIcon} />
          </button>
        </div>
      </div>

      <button type="button" disabled={loggingOut} onClick={handleLogout} className={styles.logoutButton}>
        <span className={styles.logoutText}>{loggingOut ? '로그아웃 중...' : '로그아웃'}</span>
      </button>
      <button type="button" onClick={() => setView('withdraw')} className={styles.withdrawLink}>
        <span className={styles.withdrawLinkText}>회원 그만두기</span>
      </button>

      <BottomSheet open={pendingMode !== null} onClose={handleModeCancel} className={styles.bottomSheet}>
        <div className={styles.sheetHandle} />
        <span className={styles.sheetTitle}>화면 바꾸기</span>
        <div className={styles.sheetTextGroup}>
          <p className={styles.sheetQuestion}>
            <span className={styles.sheetQuestionHighlight}>{pendingModeTitle} </span>화면으로 바꿀까요?
          </p>
          <span className={styles.sheetDesc}>앱 전체 화면이 새 모습으로 바뀌어요.</span>
        </div>
        {modeError && <p className={styles.errorText}>{modeError}</p>}
        <button type="button" disabled={modeSaving} onClick={handleModeConfirm} className={styles.sheetConfirmButton}>
          <span className={styles.sheetConfirmText}>{modeSaving ? '바꾸는 중...' : '바꾸기'}</span>
        </button>
        <button type="button" disabled={modeSaving} onClick={handleModeCancel} className={styles.sheetCancelButton}>
          <span className={styles.sheetCancelText}>취소</span>
        </button>
      </BottomSheet>

      <BottomNav variant="developmental" active={activeTab} onChange={handleTabChange} />
    </div>
  )
}

// ── 프로필 편집 ──────────────────────────────────────────────────────────
interface ProfileEditViewProps {
  me: MeProfile
  onSaved: (updated: MeProfile) => void
  onBack: () => void
}

function ProfileEditView({ me, onSaved, onBack }: ProfileEditViewProps) {
  const [nickname, setNickname] = useState(me.nickname)
  const [bio, setBio] = useState(me.bio ?? '')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [nicknameError, setNicknameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [saving, setSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

  const handlePhotoSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setPhotoError('jpg·png·gif·webp 형식만 올릴 수 있어요.')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setPhotoError('사진 파일 크기는 10MB보다 작아야 해요.')
      return
    }
    setPhotoError('')
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (saving) return
    const trimmedNickname = nickname.trim()
    if (!NICKNAME_REGEX.test(trimmedNickname)) {
      setNicknameError('별명은 2~12글자로, 한글·영어·숫자만 쓸 수 있어요.')
      return
    }

    setSaving(true)
    setNicknameError('')
    setApiError('')
    try {
      let profileImageUrl: string | undefined
      if (photoFile) {
        const { items } = await uploadImages([photoFile])
        profileImageUrl = items[0]?.url
      }
      const updated = await updateMe({
        nickname: trimmedNickname,
        bio: bio.trim(),
        ...(profileImageUrl ? { profile_image_url: profileImageUrl } : {}),
      })
      onSaved(updated)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 409) setNicknameError('이미 다른 사람이 쓰고 있는 별명이에요.')
      else if (apiErr?.status === 400) setApiError(apiErr.detail ?? '입력 내용을 다시 확인해주세요.')
      else setApiError('저장하지 못했어요. 잠시 후 다시 해보세요.')
    } finally {
      setSaving(false)
    }
  }

  const avatarSrc = photoPreview ?? (me.profile_image_url ? avatarUrlFor(me.profile_image_url) : null)

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>내 정보 바꾸기</span>
      </div>

      <div className={styles.editForm}>
        <div className={styles.editAvatarRow}>
          <div className={styles.editAvatarWrapper}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className={styles.editAvatar} />
            ) : (
              <div className={`${styles.editAvatar} bg-[#22B07D] flex items-center justify-center text-white font-bold text-3xl`}>
                {nickname[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept={ALLOWED_IMAGE_TYPES.join(',')} onChange={handlePhotoSelect} className="hidden" />
          <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.editAvatarButton}>
            사진 바꾸기
          </button>
          {photoError && <p className={styles.editFieldError}>{photoError}</p>}
        </div>

        <div className={styles.editFieldWrapper}>
          <label className={styles.editLabel}>별명</label>
          <input
            type="text"
            value={nickname}
            maxLength={12}
            onChange={(e) => { setNickname(e.target.value); setNicknameError('') }}
            className={styles.editInput}
            placeholder="2~12자 한글·영문·숫자"
          />
          {nicknameError && <p className={styles.editFieldError}>{nicknameError}</p>}
        </div>

        <div className={styles.editFieldWrapper}>
          <label className={styles.editLabel}>나를 알려주는 글</label>
          <textarea
            value={bio}
            maxLength={BIO_MAX_LENGTH}
            onChange={(e) => setBio(e.target.value)}
            className={styles.editTextarea}
            placeholder="나를 소개해보세요"
          />
          <span className={styles.editCounter}>{bio.length}/{BIO_MAX_LENGTH}</span>
        </div>

        {apiError && <p className={styles.editApiError}>{apiError}</p>}

        <button type="button" disabled={saving} onClick={handleSave} className={styles.editSaveButton}>
          <span className={styles.editSaveButtonText}>{saving ? '저장하는 중...' : '저장하기'}</span>
        </button>
      </div>
    </div>
  )
}

// ── 관심사 태그 편집 ────────────────────────────────────────────────────
interface TagsEditViewProps {
  me: MeProfile
  onSaved: (updated: MeProfile) => void
  onBack: () => void
}

function TagsEditView({ me, onSaved, onBack }: TagsEditViewProps) {
  const [tagCatalog, setTagCatalog] = useState<Tag[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [tagsError, setTagsError] = useState('')
  const [selectedTagCodes, setSelectedTagCodes] = useState<string[]>(me.tags.map((t) => t.code))
  const [openCategory, setOpenCategory] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    getTags()
      .then((res) => setTagCatalog(res.tags))
      .catch(() => setTagsError('관심사를 불러오지 못했어요.'))
      .finally(() => setTagsLoading(false))
  }, [])

  const categories = groupByCategory(tagCatalog)

  const toggleCategory = (category: string) => {
    setOpenCategory((prev) => (prev === category ? null : category))
  }

  const toggleTag = (code: string) => {
    setSelectedTagCodes((prev) => {
      if (prev.includes(code)) return prev.filter((c) => c !== code)
      if (prev.length >= TAG_MAX_COUNT) return prev
      return [...prev, code]
    })
  }

  const handleSave = async () => {
    if (saving) return
    setSaving(true)
    setSaveError('')
    try {
      const updated = await setTags(selectedTagCodes)
      onSaved(updated)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 400) setSaveError(apiErr.detail ?? `관심사는 최대 ${TAG_MAX_COUNT}개까지 고를 수 있어요.`)
      else if (apiErr?.status === 404) setSaveError('고른 정보가 오래됐어요. 다시 골라주세요.')
      else setSaveError('저장하지 못했어요. 잠시 후 다시 해보세요.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>관심사</span>
      </div>

      <div className={styles.tagEditBody}>
        <span className={styles.tagEditCounter}>{selectedTagCodes.length}/{TAG_MAX_COUNT}개 골랐어요</span>

        {tagsLoading && <span className={styles.tagsEmptyText}>불러오는 중...</span>}
        {tagsError && <p className={styles.editFieldError}>{tagsError}</p>}

        {!tagsLoading && !tagsError && categories.map((group) => {
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
                  <span className={styles.categoryLabel}>{group.category}</span>
                  {selectedCount > 0 && <span className={styles.categoryCount}>{selectedCount}</span>}
                </span>
                <img src={chevronIcon} alt="" className={isOpen ? styles.categoryChevronOpen : styles.categoryChevron} />
              </button>

              {isOpen && (
                <div className={styles.tagPanel}>
                  {group.tags.map((tag) => {
                    const isSelected = selectedTagCodes.includes(tag.code)
                    const isDisabled = !isSelected && selectedTagCodes.length >= TAG_MAX_COUNT
                    return (
                      <button
                        key={tag.code}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => toggleTag(tag.code)}
                        className={isSelected ? styles.tagChipSelected : isDisabled ? styles.tagChipDisabled : styles.tagChip}
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

        {saveError && <p className={styles.editApiError}>{saveError}</p>}

        <button type="button" disabled={saving} onClick={handleSave} className={styles.editSaveButton}>
          <span className={styles.editSaveButtonText}>{saving ? '저장하는 중...' : '저장하기'}</span>
        </button>
      </div>
    </div>
  )
}

// ── 회원 탈퇴 ──────────────────────────────────────────────────────────
interface WithdrawViewProps {
  onWithdrawn: () => void
  onBack: () => void
}

function WithdrawView({ onWithdrawn, onBack }: WithdrawViewProps) {
  const [postsAction, setPostsAction] = useState<PostsAction>('anonymize')
  const [confirming, setConfirming] = useState(false)
  const [withdrawing, setWithdrawing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleWithdraw = async () => {
    if (withdrawing) return
    setWithdrawing(true)
    setError('')
    try {
      await deleteAccount(postsAction)
      tokenStorage.remove()
      onWithdrawn()
    } catch (err: unknown) {
      const apiErr = err as { detail?: string }
      setError(apiErr?.detail ?? '그만두기를 하지 못했어요. 잠시 후 다시 해보세요.')
      setConfirming(false)
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>회원 그만두기</span>
      </div>

      <div className={styles.withdrawBody}>
        <p className={styles.withdrawWarning}>
          그만두면 다시 되돌릴 수 없어요. 친구 목록, 차단 목록, 알림 기록도 모두 함께 사라져요.
          30일 동안은 같은 계정으로 다시 가입할 수 없어요.
        </p>

        <div className={styles.withdrawOptionGroup}>
          <button type="button" onClick={() => setPostsAction('anonymize')} className={postsAction === 'anonymize' ? styles.withdrawOptionSelected : styles.withdrawOption}>
            <span className={postsAction === 'anonymize' ? styles.withdrawRadioSelected : styles.withdrawRadio} />
            <span className={styles.withdrawOptionTextGroup}>
              <span className={styles.withdrawOptionTitle}>내 글·댓글 남기기</span>
              <span className={styles.withdrawOptionDesc}>글쓴이 이름을 '그만둔 사용자'로 바꾸고, 글은 그대로 남겨요</span>
            </span>
          </button>
          <button type="button" onClick={() => setPostsAction('delete')} className={postsAction === 'delete' ? styles.withdrawOptionSelected : styles.withdrawOption}>
            <span className={postsAction === 'delete' ? styles.withdrawRadioSelected : styles.withdrawRadio} />
            <span className={styles.withdrawOptionTextGroup}>
              <span className={styles.withdrawOptionTitle}>내 글·댓글 모두 삭제</span>
              <span className={styles.withdrawOptionDesc}>내가 쓴 글·댓글을 함께 삭제해요</span>
            </span>
          </button>
        </div>

        {error && <p className={styles.editApiError}>{error}</p>}

        <button type="button" onClick={() => setConfirming(true)} className={styles.withdrawSubmitButton}>
          <span className={styles.withdrawSubmitText}>그만두기</span>
        </button>
      </div>

      {confirming && (
        <>
          <div className={styles.confirmOverlay} onClick={() => !withdrawing && setConfirming(false)} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>정말 그만둘까요?{'\n'}이 일은 되돌릴 수 없어요.</p>
            <div className={styles.confirmButtons}>
              <button type="button" disabled={withdrawing} onClick={() => setConfirming(false)} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" disabled={withdrawing} onClick={handleWithdraw} className={styles.confirmYesButton}>
                {withdrawing ? '하는 중...' : '그만두기'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── 친구 및 차단 사용자 관리 ────────────────────────────────────────────
interface ContactsManageViewProps {
  onBack: () => void
}

type ContactAction = 'unfriend' | 'unblock'

interface ContactConfirmTarget {
  id: string
  nickname: string
  action: ContactAction
}

function contactAvatarFor(author: Author): string {
  return avatarUrlFor(author.profile_image_url)
}

function ContactsManageView({ onBack }: ContactsManageViewProps) {
  const [friends, setFriends] = useState<Author[]>([])
  const [friendsLoading, setFriendsLoading] = useState(true)
  const [friendsError, setFriendsError] = useState('')

  const [blocks, setBlocks] = useState<Author[]>([])
  const [blocksLoading, setBlocksLoading] = useState(true)
  const [blocksError, setBlocksError] = useState('')

  const [confirmTarget, setConfirmTarget] = useState<ContactConfirmTarget | null>(null)
  const [confirming, setConfirming] = useState(false)
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  useEffect(() => {
    getFriends().then((page) => setFriends(page.items)).catch(() => setFriendsError('친구 목록을 불러오지 못했어요.')).finally(() => setFriendsLoading(false))
    getBlocks().then((page) => setBlocks(page.items)).catch(() => setBlocksError('차단 목록을 불러오지 못했어요.')).finally(() => setBlocksLoading(false))
  }, [])

  const handleConfirmYes = async () => {
    if (!confirmTarget || confirming) return
    setConfirming(true)
    setConfirmError('')
    try {
      if (confirmTarget.action === 'unfriend') {
        await unfriend(confirmTarget.id)
        setFriends((prev) => prev.filter((f) => f.id !== confirmTarget.id))
      } else {
        await unblockUser(confirmTarget.id)
        setBlocks((prev) => prev.filter((b) => b.id !== confirmTarget.id))
      }
      setConfirmTarget(null)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setConfirmError(e.detail ?? '처리하지 못했어요.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>친구와 차단 목록</span>
      </div>

      <div className={styles.contactsBody}>
        <span className={styles.contactsSectionTitle}>친구 {friends.length}명</span>
        {friendsLoading ? (
          <span className={styles.tagsEmptyText}>불러오는 중...</span>
        ) : friendsError ? (
          <p className={styles.editFieldError}>{friendsError}</p>
        ) : friends.length === 0 ? (
          <span className={styles.tagsEmptyText}>아직 친구가 없어요.</span>
        ) : (
          <div className={styles.contactsList}>
            {friends.map((friend) => (
              <div key={friend.id ?? friend.nickname} className={styles.contactsRow}>
                <img src={contactAvatarFor(friend)} alt="" className={styles.contactsAvatar} />
                <span className={styles.contactsNickname}>{friend.nickname}</span>
                <button
                  type="button"
                  onClick={() => friend.id && setConfirmTarget({ id: friend.id, nickname: friend.nickname, action: 'unfriend' })}
                  className={styles.contactsActionButton}
                >
                  친구 끊기
                </button>
              </div>
            ))}
          </div>
        )}

        <span className={styles.contactsSectionTitle}>차단한 사용자 {blocks.length}명</span>
        {blocksLoading ? (
          <span className={styles.tagsEmptyText}>불러오는 중...</span>
        ) : blocksError ? (
          <p className={styles.editFieldError}>{blocksError}</p>
        ) : blocks.length === 0 ? (
          <span className={styles.tagsEmptyText}>차단한 사용자가 없어요.</span>
        ) : (
          <div className={styles.contactsList}>
            {blocks.map((blocked) => (
              <div key={blocked.id ?? blocked.nickname} className={styles.contactsRow}>
                <img src={contactAvatarFor(blocked)} alt="" className={styles.contactsAvatar} />
                <span className={styles.contactsNickname}>{blocked.nickname}</span>
                <button
                  type="button"
                  onClick={() => blocked.id && setConfirmTarget({ id: blocked.id, nickname: blocked.nickname, action: 'unblock' })}
                  className={styles.contactsActionButton}
                >
                  차단 풀기
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {confirmTarget && (
        <>
          <div className={styles.confirmOverlay} onClick={() => !confirming && setConfirmTarget(null)} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>
              {confirmTarget.action === 'unfriend'
                ? `${confirmTarget.nickname}님과 친구를 끊을까요?`
                : `${confirmTarget.nickname}님 차단을 풀까요?`}
            </p>
            {confirmError && <p className={styles.editFieldError}>{confirmError}</p>}
            <div className={styles.confirmButtons}>
              <button type="button" disabled={confirming} onClick={() => setConfirmTarget(null)} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" disabled={confirming} onClick={handleConfirmYes} className={styles.confirmYesButton}>
                {confirming ? '하는 중...' : '네'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
