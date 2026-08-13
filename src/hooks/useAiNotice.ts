import { useState } from 'react'

const STORAGE_KEY = 'comm_ai_notice_seen'

// COMM 기능(문장 변환·완성·답장 추천·대화 힌트)은 내부적으로 외부 LLM에 텍스트를 전송한다.
// 이 기능을 처음 사용하는 시점에 고지를 노출해야 하므로(§17.2), 기기별로 한 번만 보여준다.
export function useAiNotice() {
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const runWithNotice = (action: () => void) => {
    if (localStorage.getItem(STORAGE_KEY) === 'true') {
      action()
      return
    }
    setPendingAction(() => action)
  }

  const confirmNotice = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    const action = pendingAction
    setPendingAction(null)
    action?.()
  }

  const cancelNotice = () => setPendingAction(null)

  return { noticeOpen: pendingAction !== null, runWithNotice, confirmNotice, cancelNotice }
}
