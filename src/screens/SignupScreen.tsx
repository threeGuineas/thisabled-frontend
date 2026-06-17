import { useState } from 'react'
import styles from './SignupScreen.styles'
import backIcon from '../assets/images/back.svg'
import eyeOpen from '../assets/images/eye-open.svg'
import eyeClosed from '../assets/images/eye-closed.svg'
import checkIcon from '../assets/images/check.svg'

interface Props {
  onBack: () => void
}

interface FormErrors {
  nickname: string
  password: string
  passwordConfirm: string
}

export default function SignupScreen({ onBack }: Props) {
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({ nickname: '', password: '', passwordConfirm: '' })

  const isButtonActive = nickname.trim() && password && passwordConfirm && agreed

  const clearError = (field: keyof FormErrors) => {
    setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  const handleSignup = () => {
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

    // TODO: 회원가입 API 연동
  }

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={onBack}>
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
        disabled={!isButtonActive}
        onClick={handleSignup}
        className={[
          styles.signupButtonBase,
          isButtonActive ? styles.signupButtonActive : styles.signupButtonDisabled,
        ].join(' ')}
      >
        가입하기
      </button>
    </div>
  )
}
