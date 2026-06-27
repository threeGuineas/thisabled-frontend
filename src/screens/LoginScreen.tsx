import { useState } from 'react'
import styles from './LoginScreen.styles'
import eyeOpen from '../assets/images/eye-open.svg'
import eyeClosed from '../assets/images/eye-closed.svg'
import { login, getMe, tokenStorage, type DisabilityType } from '../services/auth'

interface FormErrors {
  nickname: string
  password: string
  login: string
}

interface Props {
  onLogin: (disabilityType: DisabilityType) => void
  onNeedsOnboarding: () => void
  onSignup: () => void
}

export default function LoginScreen({ onLogin, onNeedsOnboarding, onSignup }: Props) {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({ nickname: '', password: '', login: '' })
  const [loading, setLoading] = useState(false)

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleLogin = async () => {
    const newErrors: FormErrors = { nickname: '', password: '', login: '' }

    if (!nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.'
    }
    if (!password) {
      newErrors.password = '비밀번호를 입력해주세요.'
    }

    if (newErrors.nickname || newErrors.password) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const { access_token, needs_onboarding } = await login(nickname.trim(), password)
      tokenStorage.set(access_token)

      if (needs_onboarding) {
        onNeedsOnboarding()
        return
      }

      const me = await getMe()
      onLogin(me.disability_mode ?? 'default')
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      if (apiErr?.status === 401) {
        setErrors((prev) => ({ ...prev, login: '닉네임 또는 비밀번호가 올바르지 않습니다.' }))
      } else {
        setErrors((prev) => ({ ...prev, login: '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.' }))
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>ThisAbled</h1>
        <p className={styles.subtitle}>장애인 맞춤형 AI 소셜 커뮤니티</p>
      </div>

      <div className={styles.form}>
        {/* 닉네임 */}
        <div className={styles.fieldWrapper}>
          <label className={styles.label}>닉네임</label>
          <input
            type="text"
            placeholder="닉네임을 입력해주세요"
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value)
              clearError('nickname')
            }}
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
              placeholder="비밀번호를 입력해주세요"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value)
                clearError('password')
                clearError('login')
              }}
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
      </div>

      <button
        type="button"
        disabled={!password || loading}
        onClick={handleLogin}
        className={[
          styles.loginButtonBase,
          password && !loading ? styles.loginButtonActive : styles.loginButtonDisabled,
        ].join(' ')}
      >
        {loading ? '로그인 중...' : '로그인'}
      </button>

      {errors.login && <p className={styles.loginError}>{errors.login}</p>}

      <div className={styles.signupSection}>
        <div className={styles.signupDivider}>
          <hr className={styles.signupDividerLine} />
          <p className={styles.signupGuide}>처음이신가요?</p>
          <hr className={styles.signupDividerLine} />
        </div>
        <button type="button" className={styles.signupButton} onClick={onSignup}>회원가입</button>
      </div>
    </div>
  )
}
