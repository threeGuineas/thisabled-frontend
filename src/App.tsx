import { useState } from 'react'
import OnboardingScreen from './screens/OnboardingScreen'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'

type Screen = 'login' | 'onboarding' | 'signup'

function App() {
  const [screen, setScreen] = useState<Screen>('login')

  if (screen === 'onboarding') {
    return <OnboardingScreen onNext={() => setScreen('login')} />
  }
  if (screen === 'signup') {
    return <SignupScreen onBack={() => setScreen('login')} />
  }
  return (
    <LoginScreen
      onLogin={() => setScreen('onboarding')}
      onSignup={() => setScreen('signup')}
    />
  )
}

export default App
