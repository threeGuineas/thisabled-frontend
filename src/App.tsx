import { useState, useEffect } from 'react'
import OnboardingScreen from './screens/auth/OnboardingScreen'
import LoginScreen from './screens/auth/LoginScreen'
import KakaoSignupScreen from './screens/auth/KakaoSignupScreen'
import InterestTagsScreen from './screens/auth/InterestTagsScreen'
import BlindHomeScreen from './screens/blind/BlindHomeScreen'
import DefaultHomeScreen from './screens/default/DefaultHomeScreen'
import HearingHomeScreen from './screens/hearing/HearingHomeScreen'
import DevHomeScreen from './screens/developmental/DevHomeScreen'
import TestScreen from './screens/auth/TestScreen'
import Toast from './components/Toast'
import { type DisabilityType, tokenStorage } from './services/auth'
import { setMode, getMe } from './services/users'

type Screen = 'test' | 'login' | 'onboarding' | 'kakaoSignup' | 'interestTags' | 'blindHome' | 'defaultHome' | 'hearingHome' | 'developmentalHome'

const homeScreenFor = (mode: DisabilityType): Screen => {
  if (mode === 'default') return 'defaultHome'
  if (mode === 'hearing') return 'hearingHome'
  if (mode === 'developmental') return 'developmentalHome'
  return 'blindHome'
}

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
  const [loginError, setLoginError] = useState('')

  const showToast = (message: string, onDone: () => void) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
      onDone()
    }, 1500)
  }

  // 백엔드 LoginResponse에는 ui_mode가 없으므로 로그인 직후 /users/me를 조회해 라우팅한다
  // (기가입자는 가입 시 ui_mode를 필수로 선택하므로 항상 값이 존재함)
  const routeToHomeAfterLogin = async () => {
    let mode: DisabilityType = 'visual'
    try {
      const me = await getMe()
      mode = me.ui_mode
    } catch {
      // 프로필 조회 실패 시에도 로그인 자체는 성공했으므로 기본 홈으로 보낸다
    }
    showToast('로그인이 완료되었습니다.', () => setScreen(homeScreenFor(mode)))
  }

  const handleLoginSuccess = () => {
    routeToHomeAfterLogin()
  }

  const handleKakaoNewUser = (token: string) => {
    setSignupToken(token)
    setOnboardingContext('newSignup')
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
      showToast('환경 설정이 완료되었습니다.', () => setScreen(homeScreenFor(mode)))
    } catch {
      showToast('오류가 발생했습니다. 다시 로그인해주세요.', () => setScreen('login'))
    }
  }

  // 마이페이지의 화면 모드 전환 — 서버엔 이미 PUT /users/me/mode가 반영된 뒤 호출되므로
  // 여기서는 알맞은 화면 구성(BlindHomeScreen/DefaultHomeScreen)으로 갈아타기만 하면 된다.
  const handleModeChanged = (mode: DisabilityType) => {
    showToast('화면 모드가 변경되었습니다.', () => setScreen(homeScreenFor(mode)))
  }

  const handleKakaoSignupSuccess = () => {
    setScreen('interestTags')
  }

  const handleInterestTagsDone = () => {
    showToast('회원가입이 완료되었습니다.', () => setScreen(homeScreenFor(signupUiMode)))
  }

  // 카카오 콜백: 백엔드가 {FRONTEND_URL}?is_new_user=...&signup_token=... 로 리다이렉트한 경우 처리
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const isNewUser = params.get('is_new_user')
    const error = params.get('error')
    if (isNewUser === null && error === null) return

    // 처리 후 URL 파라미터 정리
    window.history.replaceState({}, '', window.location.pathname)

    if (error !== null) {
      setLoginError('카카오 로그인에 실패했어요. 다시 시도해주세요.')
      return
    }

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
        routeToHomeAfterLogin()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        onGoHome={(mode) => setScreen(homeScreenFor(mode))}
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
    if (screen === 'blindHome') return <BlindHomeScreen onLoggedOut={() => setScreen('login')} onModeChanged={handleModeChanged} />
    if (screen === 'defaultHome') return <DefaultHomeScreen onLoggedOut={() => setScreen('login')} onModeChanged={handleModeChanged} />
    if (screen === 'hearingHome') return <HearingHomeScreen onLoggedOut={() => setScreen('login')} onModeChanged={handleModeChanged} />
    if (screen === 'developmentalHome') return <DevHomeScreen onLoggedOut={() => setScreen('login')} onModeChanged={handleModeChanged} />
    return (
      <LoginScreen
        onLogin={handleLoginSuccess}
        onKakaoNewUser={handleKakaoNewUser}
        initialError={loginError}
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
