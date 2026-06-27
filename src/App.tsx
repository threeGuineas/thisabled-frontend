import { useState } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import BlindHomeScreen from './screens/BlindHomeScreen'
import TestScreen from './screens/TestScreen'
import Toast from './components/Toast'
import { type DisabilityType } from './services/auth'
import { setMode } from './services/users'

type Screen = 'test' | 'login' | 'onboarding' | 'signup' | 'blindHome'

// mock 모드일 때만 TestScreen 진입. 실제 백엔드 연결 시에는 바로 login으로.
const INITIAL_SCREEN: Screen = import.meta.env.DEV && import.meta.env.VITE_MOCK_API === 'true' ? 'test' : 'login'

function App() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN)
  const [toastMessage, setToastMessage] = useState('')
  const [pendingMode, setPendingMode] = useState<DisabilityType>('default')
  // 로그인은 됐으나 장애 모드가 미설정된 경우 온보딩만 진행
  const [isReturningUserOnboarding, setIsReturningUserOnboarding] = useState(false)

  const showToast = (message: string, onDone: () => void) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
      onDone()
    }, 1500)
  }

  const handleLoginSuccess = (disabilityType: DisabilityType) => {
    showToast('로그인이 완료되었습니다.', () => {
      setScreen('blindHome')
      // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
    })
  }

  // 로그인은 됐으나 needs_onboarding: true인 경우 — 장애 모드 선택 후 setMode 호출
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
    } else {
      setPendingMode(mode)
      setScreen('signup')
    }
  }

  const handleSignupSuccess = (disabilityType: DisabilityType) => {
    showToast('회원가입이 완료되었습니다.', () => {
      setScreen('blindHome')
      // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
    })
  }

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
        onGoSignup={() => { setPendingMode('default'); setScreen('signup') }}
        onGoOnboarding={() => setScreen('onboarding')}
        onGoHome={handleLoginSuccess}
      />
    )
    if (screen === 'onboarding') return <OnboardingScreen onNext={handleOnboardingNext} />
    if (screen === 'signup') return (
      <SignupScreen
        disabilityType={pendingMode}
        onBack={() => setScreen('onboarding')}
        onSuccess={handleSignupSuccess}
      />
    )
    if (screen === 'blindHome') return <BlindHomeScreen />
    return (
      <LoginScreen
        onLogin={handleLoginSuccess}
        onNeedsOnboarding={handleLoginNeedsOnboarding}
        onSignup={() => setScreen('onboarding')}
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
