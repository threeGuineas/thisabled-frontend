import { Component, type ErrorInfo, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Unhandled render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
          <p className="text-base font-bold text-black">문제가 발생했어요.</p>
          <p className="text-sm text-gray-500">잠시 후 다시 시도해주세요.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white active:opacity-80"
          >
            새로고침
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
