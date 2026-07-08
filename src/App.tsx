import { useState, useEffect } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import KakaoSignupScreen from './screens/KakaoSignupScreen'
import InterestTagsScreen from './screens/InterestTagsScreen'
import BlindHomeScreen from './screens/BlindHomeScreen'
import TestScreen from './screens/TestScreen'
import Toast from './components/Toast'
import { type DisabilityType, tokenStorage, getMe } from './services/auth'
import { setMode } from './services/users'

type Screen = 'test' | 'login' | 'onboarding' | 'kakaoSignup' | 'interestTags' | 'blindHome'

// 'existingUser': 로그인 후 모드 미설정 → 선택 즉시 PUT /users/me/mode 호출
// 'newSignup': 카카오 신규가입 전 모드 선택 → KakaoSignupScreen으로 전달, 가입 시 함께 제출
type OnboardingContext = 'existingUser' | 'newSignup'

const INITIAL_SCREEN: Screen = import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true' ? 'test' : 'login'

function App() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN)
  const [toastMessage, setToastMessage] = useState('')
  const [signupToken, setSignupToken] = useState('')
  const [signupUiMode, setSignupUiMode] = useState<DisabilityType>('visual')
  const [onboardingContext, setOnboardingContext] = useState<OnboardingContext>('existingUser')

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
    setOnboardingContext('newSignup')
    setScreen('onboarding')
  }

  const handleLoginNeedsOnboarding = () => {
    setOnboardingContext('existingUser')
    setScreen('onboarding')
  }

  const handleOnboardingNext = async (mode: DisabilityType) => {
    if (onboardingContext === 'newSignup') {
      setSignupUiMode(mode)
      setScreen('kakaoSignup')
      return
    }

    try {
      await setMode(mode)
      showToast('환경 설정이 완료되었습니다.', () => setScreen('blindHome'))
    } catch {
      showToast('오류가 발생했습니다. 다시 로그인해주세요.', () => setScreen('login'))
    }
  }

  const handleKakaoSignupSuccess = () => {
    setScreen('interestTags')
  }

  const handleInterestTagsDone = () => {
    showToast('회원가입이 완료되었습니다.', () => setScreen('blindHome'))
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
        setOnboardingContext('newSignup')
        setScreen('onboarding')
      }
    } else if (isNewUser === 'false') {
      const token = params.get('access_token')
      if (token) {
        tokenStorage.set(token)
        getMe()
          .then((me) => {
            if (!me.disability_mode) {
              setOnboardingContext('existingUser')
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
        onGoKakaoSignup={() => { setSignupToken('mock-signup-token'); setOnboardingContext('newSignup'); setScreen('onboarding') }}
        onGoOnboarding={() => { setOnboardingContext('existingUser'); setScreen('onboarding') }}
        onGoHome={handleLoginSuccess}
      />
    )
    if (screen === 'onboarding') return <OnboardingScreen onNext={handleOnboardingNext} />
    if (screen === 'kakaoSignup') return (
      <KakaoSignupScreen
        signupToken={signupToken}
        uiMode={signupUiMode}
        onSuccess={handleKakaoSignupSuccess}
        onTokenExpired={() => setScreen('login')}
        onBack={() => { setOnboardingContext('newSignup'); setScreen('onboarding') }}
      />
    )
    if (screen === 'interestTags') return <InterestTagsScreen onDone={handleInterestTagsDone} />
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
