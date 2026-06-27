import { useState } from 'react'
import styles from './SignupScreen.styles'
import backIcon from '../assets/images/back.svg'
import eyeOpen from '../assets/images/eye-open.svg'
import eyeClosed from '../assets/images/eye-closed.svg'
import checkIcon from '../assets/images/check.svg'
import { register, tokenStorage, type DisabilityType } from '../services/auth'
import { setMode } from '../services/users'

interface Props {
  disabilityType: DisabilityType
  onBack: () => void
  onSuccess: (disabilityType: DisabilityType) => void
}

interface FormErrors {
  nickname: string
  password: string
  passwordConfirm: string
}

export default function SignupScreen({ disabilityType, onBack, onSuccess }: Props) {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({ nickname: '', password: '', passwordConfirm: '' })
  const [apiError, setApiError] = useState('')
  const [loading, setLoading] = useState(false)
  const [recoveryCode, setRecoveryCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const isButtonActive = nickname.trim() && password && passwordConfirm && agreed

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSignup = async () => {
    const newErrors: FormErrors = { nickname: '', password: '', passwordConfirm: '' }

    if (nickname.trim().length < 2) {
      newErrors.nickname = '닉네임은 2자 이상 입력해주세요.'
    }

    const passwordRegex = /^(?=.*[0-9])(?=.*[a-zA-Z]).{8,}$/
    if (!passwordRegex.test(password)) {
      newErrors.password = '비밀번호는 8자 이상, 숫자·영문을 각 1개 이상 포함해야 해요.'
    }

    if (password !== passwordConfirm) {
      newErrors.passwordConfirm = '비밀번호가 일치하지 않아요.'
    }

    if (newErrors.nickname || newErrors.password || newErrors.passwordConfirm) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setApiError('')
    try {
      const { access_token, recovery_code } = await register(nickname.trim(), password)
      tokenStorage.set(access_token)
      await setMode(disabilityType)
      setRecoveryCode(recovery_code)
    } catch (err: unknown) {
      console.error('[signup error]', err)
      const apiErr = err as { status?: number }
      if (apiErr?.status === 409) {
        setErrors((prev) => ({ ...prev, nickname: '이미 사용 중인 닉네임입니다.' }))
      } else {
        setApiError('서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = async () => {
    if (!recoveryCode) return
    await navigator.clipboard.writeText(recoveryCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 복구 코드 안내 화면
  if (recoveryCode) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>복구 코드를 저장해주세요</h1>

        <div className="mx-6 mt-8 rounded-2xl bg-amber-50 border border-amber-200 p-6 flex flex-col gap-4">
          <p className="text-sm text-amber-800 leading-relaxed">
            비밀번호를 잊었을 때 사용하는 코드예요.{'\n'}
            <strong>이 화면을 벗어나면 다시 볼 수 없습니다.</strong>
          </p>
          <div className="rounded-xl bg-white border border-amber-300 px-4 py-3 text-center">
            <span className="font-mono text-xl font-bold tracking-widest text-gray-800">{recoveryCode}</span>
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl bg-amber-400 py-2.5 text-sm font-semibold text-white active:bg-amber-500"
          >
            {copied ? '복사 완료!' : '클립보드에 복사'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => onSuccess(disabilityType)}
          className="absolute bottom-10 left-6 right-6 rounded-2xl bg-gray-900 py-4 text-base font-bold text-white"
        >
          저장했어요, 시작하기
        </button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <button type="button" className={styles.backButton} onClick={onBack}>
        <img src={backIcon} alt="뒤로가기" className={styles.backIcon} />
      </button>

      <h1 className={styles.title}>회원가입</h1>

      <div className={styles.form}>
        {/* 닉네임 */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>닉네임</label>
          <input
            type="text"
            placeholder="2자 이상 입력해주세요"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); clearError('nickname') }}
            className={errors.nickname ? styles.inputError : styles.input}
          />
          {errors.nickname && <p className={styles.errorText}>{errors.nickname}</p>}
        </div>

        {/* 비밀번호 */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>비밀번호</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="8자 이상, 숫자·영문 각 1개씩 입력해주세요"
              value={password}
              onChange={(e) => { setPassword(e.target.value); clearError('password') }}
              className={errors.password ? styles.inputError : styles.input}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPassword((prev) => !prev)}
            >
              <img
                src={showPassword ? eyeOpen : eyeClosed}
                alt={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                className={styles.eyeIcon}
              />
            </button>
          </div>
          {errors.password && <p className={styles.errorText}>{errors.password}</p>}
        </div>

        {/* 비밀번호 확인 */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>비밀번호 확인</label>
          <div className={styles.passwordWrapper}>
            <input
              type={showPasswordConfirm ? 'text' : 'password'}
              placeholder="비밀번호를 다시 입력해주세요"
              value={passwordConfirm}
              onChange={(e) => { setPasswordConfirm(e.target.value); clearError('passwordConfirm') }}
              className={errors.passwordConfirm ? styles.inputError : styles.input}
            />
            <button
              type="button"
              className={styles.eyeButton}
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
            >
              <img
                src={showPasswordConfirm ? eyeOpen : eyeClosed}
                alt={showPasswordConfirm ? '비밀번호 숨기기' : '비밀번호 보기'}
                className={styles.eyeIcon}
              />
            </button>
          </div>
          {errors.passwordConfirm && <p className={styles.errorText}>{errors.passwordConfirm}</p>}
        </div>

        {/* 이용약관 */}
        <div className={styles.termsContainer} onClick={() => setAgreed((prev) => !prev)}>
          <div className={styles.termsRow}>
            <div className={agreed ? styles.checkboxChecked : styles.checkboxUnchecked}>
              {agreed && <img src={checkIcon} alt="" className={styles.checkIcon} />}
            </div>
            <div className={styles.termsTextWrapper}>
              <p className={styles.termsMain}>이용약관 및 개인정보처리방침 동의</p>
              <p className={styles.termsSub}>서비스 이용을 위해 동의가 필요해요</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!isButtonActive || loading}
        onClick={handleSignup}
        className={[
          styles.signupButtonBase,
          isButtonActive && !loading ? styles.signupButtonActive : styles.signupButtonDisabled,
        ].join(' ')}
      >
        {loading ? '가입 중...' : '가입하기'}
      </button>

      {apiError && <p className={styles.errorText}>{apiError}</p>}
    </div>
  )
}
