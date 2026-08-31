import { useState, useEffect } from 'react'
import styles from './LoginScreen.styles'
import { initiateKakaoLogin, tokenStorage } from '../../services/auth'
import logo from '../../assets/images/logo.svg'

interface Props {
  onLogin: () => void
  onKakaoNewUser: (signupToken: string) => void
  initialError?: string
}

export default function LoginScreen({ onLogin, onKakaoNewUser, initialError }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(initialError ?? '')

  useEffect(() => {
    if (initialError) setError(initialError)
  }, [initialError])

  const handleKakaoLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const result = await initiateKakaoLogin()
      if (!result) return // 실제 카카오: 브라우저가 리다이렉트됨

      if (result.is_new_user) {
        onKakaoNewUser(result.signup_token!)
        return
      }

      tokenStorage.set(result.access_token!)
      onLogin()
    } catch (err: unknown) {
      const apiErr = err as { status?: number }
      if (apiErr?.status === 502) {
        setError('카카오 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.')
      } else {
        setError('로그인 중 오류가 발생했어요. 다시 시도해주세요.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <img src={logo} alt="ThisAbled" className={styles.logo} />
      </div>

      <div className={styles.buttonSection}>
        <button
          type="button"
          onClick={handleKakaoLogin}
          disabled={loading}
          className={styles.kakaoButton}
        >
          <KakaoLogo />
          <span>{loading ? '로그인 중...' : '카카오로 시작하기'}</span>
        </button>
        {error && <p className={styles.errorText}>{error}</p>}
      </div>
    </div>
  )
}

function KakaoLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10 2.5C5.858 2.5 2.5 5.186 2.5 8.5c0 2.12 1.318 3.99 3.318 5.121l-.84 3.118a.25.25 0 0 0 .376.28l3.68-2.352A9.26 9.26 0 0 0 10 14.5c4.142 0 7.5-2.686 7.5-6s-3.358-6-7.5-6z"
        fill="rgba(0,0,0,0.85)"
      />
    </svg>
  )
}
