import { useEffect, useRef, useState, type ChangeEvent } from 'react'
import styles from './KakaoSignupScreen.styles'
import backIcon from '../../assets/images/back.svg'
import checkIcon from '../../assets/images/check-y.svg'
import plusIcon from '../../assets/images/plus.svg'
import avatarPlaceholderIcon from '../../assets/images/mypage.svg'
import { kakaoSignup, tokenStorage, type DisabilityType } from '../../services/auth'
import { uploadImages } from '../../services/media'
import { updateMe, setMode } from '../../services/users'

const MIN_AGE = 14
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,12}$/
const BIO_MAX_LENGTH = 300
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

// signup API의 ui_mode 필드는 '기본화면(default)'을 받지 않는다. 앞선 온보딩 화면에서
// '기본화면'을 고른 경우, 가입 시엔 임시값으로 채우고 가입 직후 PUT /users/me/mode 로 보정한다.
function toSignupUiMode(mode: DisabilityType): 'visual' | 'hearing' | 'developmental' {
  return mode === 'default' ? 'visual' : mode
}

const MAX_BIRTH_DATE = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return d.toISOString().split('T')[0]
})()

interface Agreements {
  terms: boolean
  privacy: boolean
  ai_notice: boolean
}

interface Props {
  signupToken: string
  uiMode: DisabilityType
  onSuccess: () => void
  onTokenExpired: () => void
  onBack: () => void
}

function calculateAge(birthDate: string): number {
  const today = new Date()
  const birth = new Date(birthDate)
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function KakaoSignupScreen({ signupToken, uiMode, onSuccess, onTokenExpired, onBack }: Props) {
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthDateError, setBirthDateError] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState('')
  const [bio, setBio] = useState('')
  const [agreements, setAgreements] = useState<Agreements>({ terms: false, privacy: false, ai_notice: false })
  const [nicknameError, setNicknameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    return () => {
      if (profileImagePreview) URL.revokeObjectURL(profileImagePreview)
    }
  }, [profileImagePreview])

  const allAgreed = agreements.terms && agreements.privacy && agreements.ai_notice
  const isValid =
    NICKNAME_REGEX.test(nickname.trim()) &&
    !!birthDate &&
    !birthDateError &&
    allAgreed

  const toggleAll = () => {
    const next = !allAgreed
    setAgreements({ terms: next, privacy: next, ai_notice: next })
  }

  const toggleAgreement = (key: keyof Agreements) => {
    setAgreements((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const handleBirthDateChange = (value: string) => {
    setBirthDate(value)
    if (value && calculateAge(value) < MIN_AGE) {
      setBirthDateError(`만 ${MIN_AGE}세 이상만 가입할 수 있어요.`)
    } else {
      setBirthDateError('')
    }
  }

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

  const handleSubmit = async () => {
    if (!isValid) return

    const trimmedNickname = nickname.trim()
    setLoading(true)
    setApiError('')
    setNicknameError('')

    try {
      const { access_token } = await kakaoSignup({
        signup_token: signupToken,
        nickname: trimmedNickname,
        birth_date: birthDate,
        ui_mode: toSignupUiMode(uiMode),
        agreements,
      })
      tokenStorage.set(access_token)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 401) {
        onTokenExpired()
      } else if (apiErr?.status === 403) {
        setApiError('탈퇴 후 30일 이내에는 재가입이 불가합니다.')
      } else if (apiErr?.status === 409) {
        setNicknameError('이미 사용 중인 닉네임입니다.')
      } else if (apiErr?.status === 400) {
        setNicknameError(apiErr.detail ?? '사용할 수 없는 닉네임입니다.')
      } else {
        setApiError('오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
      setLoading(false)
      return
    }

    // 계정은 이미 생성됨 — 아래 호출들은 모두 선택 입력/보정용이라 실패해도
    // 가입 자체를 막지 않고 다음 화면으로 진행한다(마이페이지에서 다시 설정 가능).
    if (uiMode === 'default') {
      await setMode(uiMode).catch(() => {})
    }

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
    } catch {
      // no-op
    }

    setLoading(false)
    onSuccess()
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <img src={backIcon} alt="뒤로가기" className={styles.backIcon} />
      </button>

      <h1 className={styles.title}>회원 정보 입력</h1>
      <p className={styles.subtitle}>카카오 계정으로 가입을 완료해주세요</p>

      <div className={styles.form}>
        {/* 프로필 사진 (선택) */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>
            프로필 사진 <span className={styles.optionalLabel}>(선택)</span>
          </label>
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
        </div>

        {/* 닉네임 */}
        <div className={styles.fieldWrapper}>
          <label htmlFor="nickname" className={styles.label}>닉네임</label>
          <input
            id="nickname"
            type="text"
            placeholder="2~12자, 한글·영문·숫자만 입력해주세요"
            maxLength={12}
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); setNicknameError('') }}
            className={nicknameError ? styles.inputError : styles.input}
          />
          {nicknameError && <p className={styles.errorText}>{nicknameError}</p>}
        </div>

        {/* 생년월일 */}
        <div className={styles.fieldWrapper}>
          <label htmlFor="birth-date" className={styles.label}>생년월일</label>
          <input
            id="birth-date"
            type="date"
            max={MAX_BIRTH_DATE}
            value={birthDate}
            onChange={(e) => handleBirthDateChange(e.target.value)}
            className={birthDateError ? styles.inputError : styles.input}
          />
          {birthDateError && <p className={styles.errorText}>{birthDateError}</p>}
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

        {/* 약관 동의 */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>약관 동의</label>
          <div className={styles.agreementSection}>
            <button type="button" onClick={toggleAll} className={styles.allAgreeRow}>
              <div className={allAgreed ? styles.checkboxChecked : styles.checkboxUnchecked}>
                {allAgreed && <img src={checkIcon} alt="" className={styles.checkIcon} />}
              </div>
              <span className={styles.allAgreeText}>전체 동의</span>
            </button>

            <div className={styles.divider} />

            {(
              [
                { key: 'terms' as const, label: '이용약관 동의 (필수)' },
                { key: 'privacy' as const, label: '개인정보처리방침 동의 (필수)' },
                { key: 'ai_notice' as const, label: 'AI 서비스 안내 동의 (필수)' },
              ] as const
            ).map(({ key, label }) => (
              <button key={key} type="button" onClick={() => toggleAgreement(key)} className={styles.agreeRow}>
                <div className={agreements[key] ? styles.checkboxChecked : styles.checkboxUnchecked}>
                  {agreements[key] && <img src={checkIcon} alt="" className={styles.checkIcon} />}
                </div>
                <span className={styles.agreeText}>{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!isValid || loading}
        onClick={handleSubmit}
        className={[
          styles.submitButtonBase,
          isValid && !loading ? styles.submitButtonActive : styles.submitButtonDisabled,
        ].join(' ')}
      >
        {loading ? '가입 중...' : '가입하기'}
      </button>

      {apiError && <p className={styles.apiError}>{apiError}</p>}
    </div>
  )
}
