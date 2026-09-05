import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import styles from './HearingMyScreen.styles'
import BottomNav, { type Tab } from '../../components/BottomNav'
import BottomSheet from '../../components/BottomSheet'
import modeIcon from '../../assets/images/mode.svg'
import checkBlueIcon from '../../assets/images/check-blue.svg'
import friendIcon from '../../assets/images/friend.svg'
import vibrationIcon from '../../assets/images/vibration.svg'
import alarmIcon from '../../assets/images/alarm-black.svg'
import backIcon from '../../assets/images/back.svg'
import chevronIcon from '../../assets/images/next.svg'
import {
  getMe, updateMe, setMode, getTags, setTags, updateSettings, deleteAccount,
  type MeProfile, type ModeSettings, type Tag,
} from '../../services/users'
import { uploadImages } from '../../services/media'
import { logout, tokenStorage } from '../../services/auth'
import { getFriends, getBlocks, unfriend, unblockUser } from '../../services/friends'
import type { Author } from '../../services/posts'
import { avatarUrlFor } from '../../utils/avatar'
import { groupByCategory } from '../../utils/tags'
import {
  getCaptionPreferences, setCaptionPreferences,
  type CaptionSize, type CaptionColor,
} from '../../utils/captionPreferences'

const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,12}$/
const BIO_MAX_LENGTH = 300
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const TAG_MAX_COUNT = 10

const MODES = [
  { id: 'default',       title: '기본화면', desc: '표준 인터페이스' },
  { id: 'visual',        title: '시각장애', desc: '고대비 · 큰 글씨 · 음성 지원' },
  { id: 'hearing',       title: '청각장애', desc: '자막 · 시각 알림' },
  { id: 'developmental', title: '발달장애', desc: '쉬운 말 · 그림 · 큰 버튼' },
] as const

type ModeId = typeof MODES[number]['id']
type View = 'main' | 'editProfile' | 'tags' | 'withdraw' | 'contacts'
type PostsAction = 'anonymize' | 'delete'
type ModeSettingsToggle = 'captions' | 'vibration' | 'visual_alerts'

const CAPTION_SIZES: { id: CaptionSize; label: string }[] = [
  { id: 'small', label: '작게' },
  { id: 'medium', label: '보통' },
  { id: 'large', label: '크게' },
]

const CAPTION_COLORS: { id: CaptionColor; label: string }[] = [
  { id: 'black', label: '검정' },
  { id: 'white', label: '흰색' },
  { id: 'yellow', label: '노랑' },
]

interface Props {
  onTabChange: (tab: Tab) => void
  onLoggedOut: () => void
  onModeChanged: (mode: ModeId) => void
}

export default function HearingMyScreen({ onTabChange, onLoggedOut, onModeChanged }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('my')
  const [view, setView] = useState<View>('main')

  const [me, setMe] = useState<MeProfile | null>(null)
  const [meError, setMeError] = useState('')

  // 이 화면은 청각모드 전용이라, 다른 모드로 전환하기 전까지는 '청각장애'를 활성 모드로 표시한다.
  const [activeModeId, setActiveModeId] = useState<ModeId>('hearing')
  const [pendingMode, setPendingMode] = useState<ModeId | null>(null)
  const [modeSaving, setModeSaving] = useState(false)
  const [modeError, setModeError] = useState('')

  const [strangerSaving, setStrangerSaving] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  // 자막 표시 여부는 실제 동영상 자막 버튼(VideoCaptionPlayer)과 같은 로컬 저장값을 공유해야 하므로
  // 여기서 시작값을 읽는다.
  const [captionsEnabled, setCaptionsEnabled] = useState(() => getCaptionPreferences().enabled)
  const [vibrationEnabled, setVibrationEnabled] = useState(true)
  const [bannerEnabled, setBannerEnabled] = useState(true)
  const [savingSettingKey, setSavingSettingKey] = useState<ModeSettingsToggle | null>(null)
  // 실제 동영상 자막(<track>) 렌더링과 공유하는 값이라, 로컬 스토리지에 저장된 값으로 시작한다.
  const [captionSize, setCaptionSizeState] = useState<CaptionSize>(() => getCaptionPreferences().size)
  const [captionColor, setCaptionColorState] = useState<CaptionColor>(() => getCaptionPreferences().color)

  const handleCaptionSizeChange = (size: CaptionSize) => {
    setCaptionSizeState(size)
    setCaptionPreferences({ enabled: captionsEnabled, size, color: captionColor })
  }

  const handleCaptionColorChange = (color: CaptionColor) => {
    setCaptionColorState(color)
    setCaptionPreferences({ enabled: captionsEnabled, size: captionSize, color })
  }

  // 영상 자막 표시 토글은 낙관적 업데이트/실패 시 롤백을 toggleModeSetting이 처리하므로,
  // captionsEnabled가 실제로 바뀔 때마다 여기서 동영상 자막 버튼에도 그대로 반영한다.
  useEffect(() => {
    setCaptionPreferences({ enabled: captionsEnabled, size: captionSize, color: captionColor })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [captionsEnabled])

  useEffect(() => {
    getMe().then(setMe).catch(() => setMeError('프로필을 불러오지 못했어요.'))
  }, [])

  useEffect(() => {
    if (!me) return
    setVibrationEnabled(me.mode_settings.vibration ?? true)
    setBannerEnabled(me.mode_settings.visual_alerts ?? true)
  }, [me])

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
      // 모드가 바뀌면 앱 전체 화면 구성 자체가 달라지므로(§5), 상위(App)에 알려
      // 알맞은 홈 화면으로 전환한다.
      onModeChanged(pendingMode)
    } catch {
      setModeError('모드 변경에 실패했어요. 잠시 후 다시 시도해주세요.')
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

  const toggleModeSetting = async (
    key: ModeSettingsToggle,
    current: boolean,
    setLocal: (value: boolean) => void,
  ) => {
    if (!me || savingSettingKey) return
    const next = !current
    setLocal(next)
    setSavingSettingKey(key)
    try {
      const nextSettings: ModeSettings = { ...me.mode_settings, [key]: next }
      const updated = await updateSettings({ mode_settings: nextSettings })
      setMe(updated)
    } catch {
      setLocal(current)
    } finally {
      setSavingSettingKey(null)
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
    return (
      <ProfileEditView
        me={me}
        onSaved={(updated) => { setMe(updated); setView('main') }}
        onBack={() => setView('main')}
      />
    )
  }

  if (view === 'tags' && me) {
    return (
      <TagsEditView
        me={me}
        onSaved={(updated) => { setMe(updated); setView('main') }}
        onBack={() => setView('main')}
      />
    )
  }

  if (view === 'withdraw') {
    return (
      <WithdrawView
        onWithdrawn={onLoggedOut}
        onBack={() => setView('main')}
      />
    )
  }

  if (view === 'contacts') {
    return <ContactsManageView onBack={() => setView('main')} />
  }

  const captionPreviewSizeClass =
    captionSize === 'small' ? styles.captionPreviewTextSmall
      : captionSize === 'large' ? styles.captionPreviewTextLarge
        : styles.captionPreviewTextMedium
  const captionPreviewColorClass =
    captionColor === 'black' ? styles.captionPreviewColorBlack
      : captionColor === 'yellow' ? styles.captionPreviewColorYellow
        : styles.captionPreviewColorWhite
  const captionColorSwatchClass = (id: CaptionColor) =>
    id === 'black' ? styles.captionColorSwatchBlack
      : id === 'yellow' ? styles.captionColorSwatchYellow
        : styles.captionColorSwatchWhite

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>마이</span>
      </div>

      {/* 회원 정보 */}
      <div className={styles.section}>
        <div className={styles.profileCard}>
          <div className={styles.profileRow}>
            <div className={styles.profileInfo}>
              {me?.profile_image_url ? (
                <img src={avatarUrlFor(me.profile_image_url)} alt="" className={styles.avatar} />
              ) : (
                <div className={`${styles.avatar} bg-[#4C7DFF] flex items-center justify-center rounded-full text-white font-bold text-xl`}>
                  {me ? me.nickname[0].toUpperCase() : '?'}
                </div>
              )}
              <span className={styles.nickname}>{me ? me.nickname : meError || '불러오는 중...'}</span>
            </div>

            <button type="button" disabled={!me} onClick={() => setView('editProfile')} className={styles.editButton}>
              <span className={styles.editButtonText}>편집</span>
            </button>
          </div>
        </div>
      </div>

      {/* 관심사 태그 */}
      <div className={styles.tagsSection}>
        <div className={styles.tagsSectionHeader}>
          <span className={styles.tagsSectionTitle}>관심사 태그</span>
          <button type="button" disabled={!me} onClick={() => setView('tags')} className={styles.tagsEditButton}>
            <span className={styles.tagsEditButtonText}>편집</span>
          </button>
        </div>
        <div className={styles.tagsCard}>
          {me && me.tags.length > 0 ? (
            <div className={styles.tagsChipRow}>
              {me.tags.map((tag) => (
                <span key={tag.code} className={styles.tagsChip}>{tag.label}</span>
              ))}
            </div>
          ) : (
            <span className={styles.tagsEmptyText}>아직 등록한 관심사 태그가 없어요.</span>
          )}
        </div>
      </div>

      {/* 화면 모드 */}
      <div className={styles.modeSection}>
        <span className={styles.modeSectionTitle}>화면 모드</span>
        <div className={styles.modeCard}>
          <div className={styles.modeList}>
            {MODES.map((mode, idx) => {
              const isActive = activeModeId === mode.id
              return (
                <div key={mode.id}>
                  {idx !== 0 && <div className={styles.modeDivider} />}
                  <button
                    type="button"
                    onClick={() => handleModeClick(mode.id)}
                    className={isActive ? styles.modeButtonActive : styles.modeButton}
                  >
                    <div className={styles.modeTextGroup}>
                      <span className={styles.modeTitle}>{mode.title}</span>
                      <span className={styles.modeDesc}>{mode.desc}</span>
                    </div>
                    <img
                      src={isActive ? checkBlueIcon : modeIcon}
                      alt=""
                      className={styles.modeIcon}
                    />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* 자막 설정 */}
      <div className={styles.captionSection}>
        <span className={styles.captionSectionTitle}>자막 설정</span>
        <div className={styles.captionCard}>
          <div className={styles.captionRow}>
            <span className={styles.captionRowTitle}>영상 자막 표시</span>
            <button
              type="button"
              role="switch"
              aria-checked={captionsEnabled}
              aria-label="영상 자막 표시"
              disabled={!me || savingSettingKey === 'captions'}
              onClick={() => toggleModeSetting('captions', captionsEnabled, setCaptionsEnabled)}
              className={[styles.toggleTrack, captionsEnabled ? styles.toggleTrackOn : styles.toggleTrackOff].join(' ')}
            >
              <span className={[styles.toggleKnob, captionsEnabled ? styles.toggleKnobOn : styles.toggleKnobOff].join(' ')} />
            </button>
          </div>

          {captionsEnabled && (
            <>
              <div className={styles.captionDivider} />

              <div className={styles.captionPreviewSection}>
                <span className={styles.captionPreviewLabel}>자막 미리보기</span>
                <div className={styles.captionPreviewBox}>
                  <span className={[captionPreviewSizeClass, captionPreviewColorClass].join(' ')}>
                    이렇게 자막이 표시돼요
                  </span>
                </div>

                <span className={styles.captionPreviewLabel}>자막 크기</span>
                <div className={styles.captionSizeRow} role="tablist" aria-label="자막 크기 선택">
                  {CAPTION_SIZES.map((size) => (
                    <button
                      key={size.id}
                      type="button"
                      role="tab"
                      aria-selected={captionSize === size.id}
                      onClick={() => handleCaptionSizeChange(size.id)}
                      className={captionSize === size.id ? styles.captionSizeButtonActive : styles.captionSizeButtonInactive}
                    >
                      {size.label}
                    </button>
                  ))}
                </div>

                <span className={styles.captionPreviewLabel}>자막 색상</span>
                <div className={styles.captionColorRow}>
                  {CAPTION_COLORS.map((color) => {
                    const isActive = captionColor === color.id
                    return (
                      <button
                        key={color.id}
                        type="button"
                        onClick={() => handleCaptionColorChange(color.id)}
                        className={styles.captionColorButton}
                        aria-pressed={isActive}
                        aria-label={`자막 색상 ${color.label}`}
                      >
                        <span
                          className={[
                            isActive ? styles.captionColorSwatchActive : styles.captionColorSwatch,
                            captionColorSwatchClass(color.id),
                          ].join(' ')}
                        />
                        <span className={isActive ? styles.captionColorLabelActive : styles.captionColorLabel}>
                          {color.label}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 알림 */}
      <div className={styles.notifSection}>
        <span className={styles.notifSectionTitle}>알림</span>
        <div className={styles.notifCard}>
          <div className={styles.notifRow}>
            <div className={styles.notifIconWrapper}>
              <img src={vibrationIcon} alt="" className={styles.notifIcon} />
            </div>
            <div className={styles.notifTextGroup}>
              <span className={styles.notifTitle}>진동알림</span>
              <span className={styles.notifDesc}>알림을 진동으로 알려드려요</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={vibrationEnabled}
              aria-label="진동알림"
              disabled={!me || savingSettingKey === 'vibration'}
              onClick={() => toggleModeSetting('vibration', vibrationEnabled, setVibrationEnabled)}
              className={[styles.toggleTrack, vibrationEnabled ? styles.toggleTrackOn : styles.toggleTrackOff].join(' ')}
            >
              <span className={[styles.toggleKnob, vibrationEnabled ? styles.toggleKnobOn : styles.toggleKnobOff].join(' ')} />
            </button>
          </div>

          <div className={styles.notifDivider} />

          <div className={styles.notifRow}>
            <div className={styles.notifIconWrapper}>
              <img src={alarmIcon} alt="" className={styles.notifIcon} />
            </div>
            <div className={styles.notifTextGroup}>
              <span className={styles.notifTitle}>화면 알림 배너</span>
              <span className={styles.notifDesc}>알림을 홈 화면에 표시해드려요</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={bannerEnabled}
              aria-label="화면 알림 배너"
              disabled={!me || savingSettingKey === 'visual_alerts'}
              onClick={() => toggleModeSetting('visual_alerts', bannerEnabled, setBannerEnabled)}
              className={[styles.toggleTrack, bannerEnabled ? styles.toggleTrackOn : styles.toggleTrackOff].join(' ')}
            >
              <span className={[styles.toggleKnob, bannerEnabled ? styles.toggleKnobOn : styles.toggleKnobOff].join(' ')} />
            </button>
          </div>
        </div>
      </div>

      {/* 설정 */}
      <div className={styles.settingsSection}>
        <span className={styles.settingsSectionTitle}>설정</span>
        <div className={styles.settingsCard}>
          <div className={styles.settingsRow}>
            <div className={styles.settingsTextGroup}>
              <span className={styles.settingsTitle}>낯선 사람 메시지 요청 허용</span>
              <span className={styles.settingsDesc}>친구가 아닌 사용자의 대화 요청을 받을지 정해요</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={!!me?.stranger_requests_allowed}
              aria-label="낯선 사람 메시지 요청 허용"
              disabled={!me || strangerSaving}
              onClick={handleToggleStranger}
              className={[styles.toggleTrack, me?.stranger_requests_allowed ? styles.toggleTrackOn : styles.toggleTrackOff].join(' ')}
            >
              <span className={[styles.toggleKnob, me?.stranger_requests_allowed ? styles.toggleKnobOn : styles.toggleKnobOff].join(' ')} />
            </button>
          </div>
        </div>
      </div>

      {/* 기타 */}
      <div className={styles.etcSection}>
        <span className={styles.etcSectionTitle}>기타</span>
        <div className={styles.etcCard}>
          <div className={styles.etcList}>
            <button type="button" onClick={() => setView('contacts')} className={styles.etcButton}>
              <div className={styles.etcIconWrapper}>
                <img src={friendIcon} alt="" className={styles.etcIcon} />
              </div>
              <div className={styles.etcTextGroup}>
                <span className={styles.etcTitle}>친구 및 차단 사용자 관리</span>
                <span className={styles.etcDesc}>친구 목록 · 차단 해제</span>
              </div>
              <img src={modeIcon} alt="" className={styles.etcRightIcon} />
            </button>
          </div>
        </div>
      </div>

      {/* 로그아웃 / 회원 탈퇴 */}
      <button type="button" disabled={loggingOut} onClick={handleLogout} className={styles.logoutButton}>
        <span className={styles.logoutText}>{loggingOut ? '로그아웃 중...' : '로그아웃'}</span>
      </button>
      <button type="button" onClick={() => setView('withdraw')} className={styles.withdrawLink}>
        <span className={styles.withdrawLinkText}>회원 탈퇴</span>
      </button>

      {/* 모드 전환 바텀시트 */}
      <BottomSheet open={pendingMode !== null} onClose={handleModeCancel} className={styles.bottomSheet}>
        <div className={styles.sheetHandle} />
        <span className={styles.sheetTitle}>화면 모드 전환</span>
        <div className={styles.sheetTextGroup}>
          <p className={styles.sheetQuestion}>
            <span className={styles.sheetQuestionHighlight}>{pendingModeTitle} </span>
            모드로 바꿀까요?
          </p>
          <span className={styles.sheetDesc}>앱 전체가 해당 모드에 맞게 바뀌어요.</span>
        </div>
        {modeError && <p className={styles.errorText}>{modeError}</p>}
        <button type="button" disabled={modeSaving} onClick={handleModeConfirm} className={styles.sheetConfirmButton}>
          <span className={styles.sheetConfirmText}>{modeSaving ? '변경 중...' : '변경하기'}</span>
        </button>
        <button type="button" disabled={modeSaving} onClick={handleModeCancel} className={styles.sheetCancelButton}>
          <span className={styles.sheetCancelText}>취소</span>
        </button>
      </BottomSheet>

      <BottomNav variant="hearing" active={activeTab} onChange={handleTabChange} />
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
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview)
    }
  }, [photoPreview])

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
    setPhotoFile(file)
    setPhotoPreview(URL.createObjectURL(file))
  }

  const handleSave = async () => {
    if (saving) return
    const trimmedNickname = nickname.trim()
    if (!NICKNAME_REGEX.test(trimmedNickname)) {
      setNicknameError('닉네임은 2~12자 한글·영문·숫자만 가능합니다.')
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
      if (apiErr?.status === 409) {
        setNicknameError('이미 사용 중인 닉네임입니다.')
      } else if (apiErr?.status === 400) {
        setApiError(apiErr.detail ?? '입력 내용을 다시 확인해주세요.')
      } else {
        setApiError('저장 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setSaving(false)
    }
  }

  const avatarSrc = photoPreview ?? (me.profile_image_url ? avatarUrlFor(me.profile_image_url) : null)

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>프로필 편집</span>
      </div>

      <div className={styles.editForm}>
        <div className={styles.editAvatarRow}>
          <div className={styles.editAvatarWrapper}>
            {avatarSrc ? (
              <img src={avatarSrc} alt="" className={styles.editAvatar} />
            ) : (
              <div className={`${styles.editAvatar} bg-[#4C7DFF] flex items-center justify-center text-white font-bold text-2xl`}>
                {nickname[0]?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_IMAGE_TYPES.join(',')}
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className={styles.editAvatarButton}>
            사진 변경
          </button>
          {photoError && <p className={styles.editFieldError}>{photoError}</p>}
        </div>

        <div className={styles.editFieldWrapper}>
          <label className={styles.editLabel}>닉네임</label>
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
          <label className={styles.editLabel}>자기소개</label>
          <textarea
            value={bio}
            maxLength={BIO_MAX_LENGTH}
            onChange={(e) => setBio(e.target.value)}
            className={styles.editTextarea}
            placeholder="나를 소개해주세요"
          />
          <span className={styles.editCounter}>{bio.length}/{BIO_MAX_LENGTH}</span>
        </div>

        {apiError && <p className={styles.editApiError}>{apiError}</p>}

        <button type="button" disabled={saving} onClick={handleSave} className={styles.editSaveButton}>
          <span className={styles.editSaveButtonText}>{saving ? '저장 중...' : '저장하기'}</span>
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
      if (apiErr?.status === 400) {
        setSaveError(apiErr.detail ?? '관심사 태그는 최대 10개까지 선택할 수 있습니다.')
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
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>관심사 태그</span>
      </div>

      <div className={styles.tagEditBody}>
        <span className={styles.tagEditCounter}>{selectedTagCodes.length}/{TAG_MAX_COUNT} 선택됨</span>

        {tagsLoading && <span className={styles.tagsEmptyText}>태그를 불러오는 중...</span>}
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
                  <span className={isOpen ? styles.categoryLabelOpen : styles.categoryLabel}>
                    {group.category}
                  </span>
                  {selectedCount > 0 && <span className={styles.categoryCount}>{selectedCount}</span>}
                </span>
                <img src={chevronIcon} alt="" className={isOpen ? styles.chevronIconOpen : styles.chevronIcon} />
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
          <span className={styles.editSaveButtonText}>{saving ? '저장 중...' : '저장하기'}</span>
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
      setError(apiErr?.detail ?? '탈퇴 처리에 실패했어요. 잠시 후 다시 시도해주세요.')
      setConfirming(false)
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>회원 탈퇴</span>
      </div>

      <div className={styles.withdrawBody}>
        <p className={styles.withdrawWarning}>
          탈퇴하면 되돌릴 수 없어요. 친구·차단 관계, 알림, 전송 제한 기록 등은 계정과 함께 삭제되고,
          동일한 소셜 계정으로 30일간 재가입할 수 없어요.
        </p>

        <div className={styles.withdrawOptionGroup}>
          <button
            type="button"
            onClick={() => setPostsAction('anonymize')}
            className={postsAction === 'anonymize' ? styles.withdrawOptionSelected : styles.withdrawOption}
          >
            <span className={postsAction === 'anonymize' ? styles.withdrawRadioSelected : styles.withdrawRadio} />
            <span className={styles.withdrawOptionTextGroup}>
              <span className={styles.withdrawOptionTitle}>내 글·댓글 남기기</span>
              <span className={styles.withdrawOptionDesc}>작성자를 '탈퇴한 사용자'로 표시하고 글은 그대로 남겨요</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setPostsAction('delete')}
            className={postsAction === 'delete' ? styles.withdrawOptionSelected : styles.withdrawOption}
          >
            <span className={postsAction === 'delete' ? styles.withdrawRadioSelected : styles.withdrawRadio} />
            <span className={styles.withdrawOptionTextGroup}>
              <span className={styles.withdrawOptionTitle}>내 글·댓글 모두 삭제</span>
              <span className={styles.withdrawOptionDesc}>내가 쓴 글·댓글과 그에 달린 미디어를 함께 삭제해요</span>
            </span>
          </button>
        </div>

        {error && <p className={styles.editApiError}>{error}</p>}

        <button type="button" onClick={() => setConfirming(true)} className={styles.withdrawSubmitButton}>
          <span className={styles.withdrawSubmitText}>탈퇴하기</span>
        </button>
      </div>

      {confirming && (
        <>
          <div className={styles.confirmOverlay} onClick={() => !withdrawing && setConfirming(false)} />
          <div className={styles.confirmModal}>
            <p className={styles.confirmText}>정말 탈퇴하시겠습니까?<br />이 작업은 되돌릴 수 없어요.</p>
            <div className={styles.confirmButtons}>
              <button type="button" disabled={withdrawing} onClick={() => setConfirming(false)} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" disabled={withdrawing} onClick={handleWithdraw} className={styles.confirmYesButton}>
                {withdrawing ? '처리 중...' : '탈퇴하기'}
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
    getFriends()
      .then((page) => setFriends(page.items))
      .catch(() => setFriendsError('친구 목록을 불러오지 못했습니다.'))
      .finally(() => setFriendsLoading(false))
    getBlocks()
      .then((page) => setBlocks(page.items))
      .catch(() => setBlocksError('차단 목록을 불러오지 못했습니다.'))
      .finally(() => setBlocksLoading(false))
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
      setConfirmError(e.detail ?? '처리에 실패했습니다.')
    } finally {
      setConfirming(false)
    }
  }

  return (
    <div className={styles.subContainer}>
      <div className={styles.subHeader}>
        <button type="button" onClick={onBack} className={styles.subBackButton} aria-label="뒤로가기">
          <img src={backIcon} alt="" className={styles.subBackIcon} />
        </button>
        <span className={styles.subHeaderTitle}>친구 및 차단 사용자 관리</span>
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
                  차단 해제
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
                ? `${confirmTarget.nickname}님과 친구를 끊으시겠습니까?`
                : `${confirmTarget.nickname}님의 차단을 해제하시겠습니까?`}
            </p>
            {confirmError && <p className={styles.editFieldError}>{confirmError}</p>}
            <div className={styles.confirmButtons}>
              <button type="button" disabled={confirming} onClick={() => setConfirmTarget(null)} className={styles.confirmNoButton}>
                아니오
              </button>
              <button type="button" disabled={confirming} onClick={handleConfirmYes} className={styles.confirmYesButton}>
                {confirming ? '처리 중...' : '네'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
