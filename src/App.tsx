import { useState } from 'react'
import LoginScreen from './screens/LoginScreen'
import SignupScreen from './screens/SignupScreen'

type Screen = 'login' | 'signup'

function App() {
  const [screen, setScreen] = useState<Screen>('login')

  if (screen === 'signup') {
    return <SignupScreen onBack={() => setScreen('login')} />
  }
  return <LoginScreen onSignup={() => setScreen('signup')} />
}

export default App
