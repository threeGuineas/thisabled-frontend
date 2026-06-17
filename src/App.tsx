import { useState } from 'react'
import OnboardingScreen, { type Mode } from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'
import BlindHomeScreen from './screens/BlindHomeScreen'

type Screen = 'login' | 'onboarding' | 'signup' | 'blindHome'

function App() {
  const [screen, setScreen] = useState<Screen>('login')

  const handleOnboardingNext = (mode: Mode) => {
    if (mode === 'visual') {
      setScreen('blindHome')
    } else {
      setScreen('login')
    }
  }

  if (screen === 'onboarding') {
    return <OnboardingScreen onNext={handleOnboardingNext} />
  }
  if (screen === 'signup') {
    return <SignupScreen onBack={() => setScreen('login')} />
  }
  if (screen === 'blindHome') {
    return <BlindHomeScreen />
  }
  return (
    <LoginScreen
      onLogin={() => setScreen('onboarding')}
      onSignup={() => setScreen('signup')}
    />
  )
}

export default App
