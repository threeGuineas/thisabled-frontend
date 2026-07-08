import { useState } from 'react'
import styles from './KakaoSignupScreen.styles'
import backIcon from '../assets/images/back.svg'
import checkIcon from '../assets/images/check.svg'
import eyeIcon from '../assets/images/eye.svg'
import earIcon from '../assets/images/ear.svg'
import brainIcon from '../assets/images/brain.svg'
import { kakaoSignup, tokenStorage, type DisabilityType } from '../services/auth'

const MIN_AGE = 14
const NICKNAME_REGEX = /^[가-힣a-zA-Z0-9]{2,12}$/

const MAX_BIRTH_DATE = (() => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - MIN_AGE)
  return d.toISOString().split('T')[0]
})()

const UI_MODES = [
  { id: 'visual' as const, icon: eyeIcon, label: '시각장애' },
  { id: 'hearing' as const, icon: earIcon, label: '청각장애' },
  { id: 'developmental' as const, icon: brainIcon, label: '발달장애' },
]

interface Agreements {
  terms: boolean
  privacy: boolean
  ai_notice: boolean
}

interface Props {
  signupToken: string
  onSuccess: (disabilityType: DisabilityType) => void
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

export default function KakaoSignupScreen({ signupToken, onSuccess, onTokenExpired, onBack }: Props) {
  const [nickname, setNickname] = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [birthDateError, setBirthDateError] = useState('')
  const [uiMode, setUiMode] = useState<'visual' | 'hearing' | 'developmental' | null>(null)
  const [agreements, setAgreements] = useState<Agreements>({ terms: false, privacy: false, ai_notice: false })
  const [nicknameError, setNicknameError] = useState('')
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)

  const allAgreed = agreements.terms && agreements.privacy && agreements.ai_notice
  const isValid =
    NICKNAME_REGEX.test(nickname.trim()) &&
    !!birthDate &&
    !birthDateError &&
    !!uiMode &&
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

  const handleSubmit = async () => {
    if (!uiMode || !isValid) return

    const trimmedNickname = nickname.trim()
    setLoading(true)
    setApiError('')
    setNicknameError('')

    try {
      const { access_token } = await kakaoSignup({
        signup_token: signupToken,
        nickname: trimmedNickname,
        birth_date: birthDate,
        ui_mode: uiMode,
        agreements,
      })
      tokenStorage.set(access_token)
      onSuccess(uiMode)
    } catch (err: unknown) {
      const apiErr = err as { status?: number; detail?: string }
      if (apiErr?.status === 401) {
        onTokenExpired()
      } else if (apiErr?.status === 403) {
        setApiError('탈퇴 후 30일 이내에는 재가입이 불가합니다.')
      } else if (apiErr?.status === 409) {
        setNicknameError('이미 사용 중인 닉네임입니다.')
      } else if (apiErr?.status === 400) {
        setApiError(apiErr.detail ?? '입력 정보를 다시 확인해주세요.')
      } else {
        setApiError('오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <img src={backIcon} alt="뒤로가기" className={styles.backIcon} />
      </button>

      <h1 className={styles.title}>회원 정보 입력</h1>
      <p className={styles.subtitle}>카카오 계정으로 가입을 완료해주세요</p>

      <div className={styles.form}>
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

        {/* 이용 환경 */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>이용 환경 선택</label>
          <div className={styles.modeGrid}>
            {UI_MODES.map((mode) => {
              const isSelected = uiMode === mode.id
              return (
                <button
                  key={mode.id}
                  type="button"
                  onClick={() => setUiMode(mode.id)}
                  className={isSelected ? styles.modeCardSelected : styles.modeCard}
                >
                  <img src={mode.icon} alt="" className={styles.modeIcon} />
                  <span className={isSelected ? styles.modeLabelSelected : styles.modeLabel}>
                    {mode.label}
                  </span>
                </button>
              )
            })}
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
