import { useState, useEffect } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import KakaoSignupScreen from './screens/KakaoSignupScreen'
import ProfileSetupScreen from './screens/ProfileSetupScreen'
import BlindHomeScreen from './screens/BlindHomeScreen'
import TestScreen from './screens/TestScreen'
import Toast from './components/Toast'
import { type DisabilityType, tokenStorage, getMe } from './services/auth'
import { setMode } from './services/users'

type Screen = 'test' | 'login' | 'onboarding' | 'kakaoSignup' | 'profileSetup' | 'blindHome'

const INITIAL_SCREEN: Screen = import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true' ? 'test' : 'login'

function App() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN)
  const [toastMessage, setToastMessage] = useState('')
  const [signupToken, setSignupToken] = useState('')
  const [isReturningUserOnboarding, setIsReturningUserOnboarding] = useState(false)

  const showToast = (message: string, onDone: () => void) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
      onDone()
    }, 1500)
  }

  const handleLoginSuccess = (_disabilityType: DisabilityType) => {
    showToast('로그인이 완료되었습니다.', () => {
      setScreen('blindHome')
      // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
    })
  }

  const handleKakaoNewUser = (token: string) => {
    setSignupToken(token)
    setScreen('kakaoSignup')
  }

  const handleLoginNeedsOnboarding = () => {
    setIsReturningUserOnboarding(true)
    setScreen('onboarding')
  }

  const handleOnboardingNext = async (mode: DisabilityType) => {
    if (isReturningUserOnboarding) {
      setIsReturningUserOnboarding(false)
      try {
        await setMode(mode)
        showToast('환경 설정이 완료되었습니다.', () => setScreen('blindHome'))
      } catch {
        showToast('오류가 발생했습니다. 다시 로그인해주세요.', () => setScreen('login'))
      }
    }
  }

  const handleKakaoSignupSuccess = (_disabilityType: DisabilityType) => {
    setScreen('profileSetup')
    // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
  }

  const handleProfileSetupDone = () => {
    showToast('회원가입이 완료되었습니다.', () => {
      setScreen('blindHome')
      // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
    })
  }

  // 카카오 콜백: 백엔드가 {FRONTEND_URL}?is_new_user=...&signup_token=... 로 리다이렉트한 경우 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isNewUser = params.get('is_new_user')
    if (isNewUser === null) return

    // 처리 후 URL 파라미터 정리
    window.history.replaceState({}, '', window.location.pathname)

    if (isNewUser === 'true') {
      const token = params.get('signup_token')
      if (token) {
        setSignupToken(token)
        setScreen('kakaoSignup')
      }
    } else if (isNewUser === 'false') {
      const token = params.get('access_token')
      if (token) {
        tokenStorage.set(token)
        getMe()
          .then((me) => {
            if (!me.disability_mode) {
              setIsReturningUserOnboarding(true)
              setScreen('onboarding')
            } else {
              showToast('로그인이 완료되었습니다.', () => setScreen('blindHome'))
            }
          })
          .catch(() => setScreen('login'))
      }
    }
  }, [])

  const devTab = import.meta.env.DEV && screen !== 'test' && (
    <button
      type="button"
      onClick={() => setScreen('test')}
      className="fixed bottom-6 right-4 z-50 rounded-full bg-[#000000] px-3 py-1.5 text-xs font-bold text-white shadow-lg active:bg-[#333]"
    >
      DEV
    </button>
  )

  const currentScreen = (() => {
    if (screen === 'test') return (
      <TestScreen
        onGoLogin={() => setScreen('login')}
        onGoKakaoSignup={() => { setSignupToken('mock-signup-token'); setScreen('kakaoSignup') }}
        onGoOnboarding={() => setScreen('onboarding')}
        onGoHome={handleLoginSuccess}
      />
    )
    if (screen === 'onboarding') return <OnboardingScreen onNext={handleOnboardingNext} />
    if (screen === 'kakaoSignup') return (
      <KakaoSignupScreen
        signupToken={signupToken}
        onSuccess={handleKakaoSignupSuccess}
        onTokenExpired={() => setScreen('login')}
        onBack={() => setScreen('login')}
      />
    )
    if (screen === 'profileSetup') return <ProfileSetupScreen onDone={handleProfileSetupDone} />
    if (screen === 'blindHome') return <BlindHomeScreen />
    return (
      <LoginScreen
        onLogin={handleLoginSuccess}
        onNeedsOnboarding={handleLoginNeedsOnboarding}
        onKakaoNewUser={handleKakaoNewUser}
      />
    )
  })()

  return (
    <>
      {currentScreen}
      {devTab}
      {toastMessage && <Toast message={toastMessage} />}
    </>
  )
}

export default App
