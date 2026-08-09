import { useState } from 'react'
import { IS_MOCK_API, toggleMockApi, type DisabilityType } from '../services/auth'

interface Props {
  onGoLogin: () => void
  onGoKakaoSignup: () => void
  onGoOnboarding: () => void
  onGoHome: (disabilityType: DisabilityType) => void
}

interface NavItem {
  label: string
  sub?: string
  onClick: () => void
  color: 'yellow' | 'gray' | 'black'
}

export default function TestScreen({ onGoLogin, onGoKakaoSignup, onGoOnboarding, onGoHome }: Props) {
  const [vibrateResult, setVibrateResult] = useState<string | null>(null)

  // 알림 진동이 실제 기기에서 안 느껴진다는 문제를 진단하기 위한 버튼 — 탭한 그 순간(사용자 제스처)
  // 안에서 바로 vibrate()를 호출해, 비동기 콜백(WS 알림 등)에서 호출할 때와 결과를 비교해볼 수 있다.
  const handleVibrateTest = () => {
    if (!('vibrate' in navigator)) {
      setVibrateResult('이 브라우저는 Vibration API를 지원하지 않아요 (예: iOS Safari)')
      return
    }
    const accepted = navigator.vibrate(200)
    setVibrateResult(
      accepted
        ? '요청은 수락됐어요(true). 그래도 안 느껴지면 폰의 무음/진동 설정을 확인해보세요.'
        : '브라우저가 요청을 거부했어요(false) — 탭한 직후인데도 거부됐다면 이 기기/브라우저에서는 진동 자체가 막혀있는 거예요.',
    )
  }

  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: '인증 화면',
      items: [
        { label: '로그인', sub: 'LoginScreen (카카오 버튼)', onClick: onGoLogin, color: 'yellow' },
        { label: '카카오 신규가입', sub: 'OnboardingScreen → KakaoSignupScreen', onClick: onGoKakaoSignup, color: 'yellow' },
        { label: '온보딩 (장애 유형 선택)', sub: 'OnboardingScreen', onClick: onGoOnboarding, color: 'yellow' },
      ],
    },
    {
      title: '홈 화면 (직행)',
      items: [
        { label: '시각장애 홈', sub: 'BlindHomeScreen', onClick: () => onGoHome('visual'), color: 'black' },
        { label: '청각장애 홈', sub: 'HearingHomeScreen', onClick: () => onGoHome('hearing'), color: 'black' },
        { label: '발달장애 홈', sub: '미구현', onClick: () => onGoHome('developmental'), color: 'gray' },
        { label: '기본 홈', sub: 'DefaultHomeScreen', onClick: () => onGoHome('default'), color: 'black' },
      ],
    },
  ]

  const btnClass = (color: NavItem['color']) => {
    const base = 'w-full rounded-2xl px-4 py-3.5 text-left transition-colors'
    if (color === 'yellow') return `${base} bg-[#FFD60A] active:bg-[#E6C009]`
    if (color === 'black') return `${base} bg-[#000000] text-white active:bg-[#333]`
    return `${base} bg-[#F7F7F9] text-[#9898A8] border border-[#EBEBEF] cursor-not-allowed`
  }

  return (
    <div className="flex min-h-screen flex-col bg-white px-6 pb-10">
      {/* 헤더 */}
      <div className="mt-14 mb-8">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-[#000000]">개발 테스트 메뉴</h1>
          <button
            type="button"
            onClick={toggleMockApi}
            className={`text-xs font-semibold px-2 py-0.5 rounded-full active:opacity-70 ${IS_MOCK_API ? 'bg-[#FFD60A] text-black' : 'bg-[#F7F7F9] text-[#9898A8] border border-[#EBEBEF]'}`}
          >
            {IS_MOCK_API ? 'MOCK ON' : 'MOCK OFF'}
          </button>
        </div>
        <p className="text-sm text-[#757575]">ThisAbled — 백엔드 없이 UI 테스트용 화면</p>
      </div>

      {/* 진동 즉시 테스트 — 탭 제스처 안에서 바로 vibrate() 호출 */}
      <div className="mb-8 rounded-2xl border border-[#EBEBEF] px-5 py-4">
        <p className="text-xs font-semibold text-[#666666] mb-2">진동 즉시 테스트</p>
        <button
          type="button"
          onClick={handleVibrateTest}
          className="w-full rounded-2xl bg-[#4C7DFF] px-4 py-3 text-sm font-bold text-white active:bg-[#3D68E0]"
        >
          지금 바로 진동 테스트
        </button>
        {vibrateResult && <p className="mt-2 text-xs text-[#757575]">{vibrateResult}</p>}
      </div>

      {/* 섹션 목록 */}
      <div className="flex flex-col gap-8">
        {sections.map((section) => (
          <div key={section.title} className="flex flex-col gap-3">
            <p className="text-xs font-semibold text-[#757575] uppercase tracking-wide">{section.title}</p>
            <div className="flex flex-col gap-2">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={item.color !== 'gray' ? item.onClick : undefined}
                  className={btnClass(item.color)}
                  disabled={item.color === 'gray'}
                >
                  <span className="block text-sm font-bold">{item.label}</span>
                  {item.sub && (
                    <span className={`block text-xs font-medium mt-0.5 ${item.color === 'gray' ? 'text-[#9898A8]' : item.color === 'black' ? 'text-[#999]' : 'text-[#666]'}`}>
                      {item.sub}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Mock 사용 안내 */}
      {IS_MOCK_API && (
        <div className="mt-8 rounded-2xl bg-[#F7F7F9] border border-[#EBEBEF] px-5 py-4">
          <p className="text-xs font-semibold text-[#666666] mb-2">Mock 동작 안내</p>
          <div className="flex flex-col gap-1">
            {[
              ['로그인', '카카오 버튼 → 시각장애 기존 사용자로 자동 로그인'],
              ['카카오 신규가입', '신규가입 화면으로 직접 이동 (mock 토큰 사용)'],
            ].map(([btn, desc]) => (
              <div key={btn} className="flex items-baseline gap-2 flex-wrap">
                <code className="text-xs font-bold text-[#000000] bg-[#EBEBEF] px-1.5 py-0.5 rounded">{btn}</code>
                <span className="text-xs text-[#757575]">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
