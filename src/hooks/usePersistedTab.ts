import { useState } from 'react'
import type { Tab } from '../components/BottomNav'

// 새로고침해도 마지막으로 보고 있던 하단 탭(홈/친구/채팅/마이페이지)을 유지하기 위한 세션 저장.
// 모드별 홈 화면(Blind/Default/Hearing/Dev)은 한 번에 하나만 렌더링되므로 키를 공유해도 안전하다.
const STORAGE_KEY = 'activeTab'

export function usePersistedTab(defaultTab: Tab = 'home') {
  const [tab, setTabState] = useState<Tab>(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    return (stored as Tab | null) ?? defaultTab
  })

  const setTab = (next: Tab) => {
    setTabState(next)
    sessionStorage.setItem(STORAGE_KEY, next)
  }

  return [tab, setTab] as const
}

export function clearPersistedTab(): void {
  sessionStorage.removeItem(STORAGE_KEY)
}
