import { useState } from 'react'
import OnboardingScreen, { type Mode } from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import BlindHomeScreen from './screens/BlindHomeScreen'
import TestScreen from './screens/TestScreen'
import Toast from './components/Toast'
import { type DisabilityType } from './services/auth'

type Screen = 'test' | 'login' | 'onboarding' | 'signup' | 'blindHome'

const INITIAL_SCREEN: Screen = import.meta.env.DEV ? 'test' : 'login'

function App() {
  const [screen, setScreen] = useState<Screen>(INITIAL_SCREEN)
  const [toastMessage, setToastMessage] = useState('')

  const showToast = (message: string, onDone: () => void) => {
    setToastMessage(message)
    setTimeout(() => {
      setToastMessage('')
      onDone()
    }, 1500)
  }

  const handleLoginSuccess = (disabilityType: DisabilityType) => {
    showToast('로그인이 완료되었습니다.', () => {
      setScreen(disabilityType === 'visual' ? 'blindHome' : 'blindHome')
      // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
    })
  }

  const handleSignupSuccess = () => {
    showToast('회원가입이 완료되었습니다.', () => {
      setScreen('onboarding')
    })
  }

  const handleOnboardingNext = (mode: Mode) => {
    if (mode === 'visual') {
      setScreen('blindHome')
    } else {
      // TODO: 다른 장애 유형 화면 구현 후 라우팅 추가
      setScreen('blindHome')
    }
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
        onGoSignup={() => setScreen('signup')}
        onGoOnboarding={() => setScreen('onboarding')}
        onGoHome={handleLoginSuccess}
      />
    )
    if (screen === 'onboarding') return <OnboardingScreen onNext={handleOnboardingNext} />
    if (screen === 'signup') return (
      <SignupScreen
        onBack={() => setScreen('login')}
        onSuccess={handleSignupSuccess}
      />
    )
    if (screen === 'blindHome') return <BlindHomeScreen />
    return (
      <LoginScreen
        onLogin={handleLoginSuccess}
        onSignup={() => setScreen('signup')}
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
