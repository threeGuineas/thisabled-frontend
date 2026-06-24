import { IS_MOCK_API, toggleMockApi, type DisabilityType } from '../services/auth'

interface Props {
  onGoLogin: () => void
  onGoSignup: () => void
  onGoOnboarding: () => void
  onGoHome: (disabilityType: DisabilityType) => void
}

interface NavItem {
  label: string
  sub?: string
  onClick: () => void
  color: 'yellow' | 'gray' | 'black'
}

export default function TestScreen({ onGoLogin, onGoSignup, onGoOnboarding, onGoHome }: Props) {
  const sections: { title: string; items: NavItem[] }[] = [
    {
      title: '인증 화면',
      items: [
        { label: '로그인', sub: 'LoginScreen', onClick: onGoLogin, color: 'yellow' },
        { label: '회원가입', sub: 'SignupScreen', onClick: onGoSignup, color: 'yellow' },
        { label: '온보딩 (장애 유형 선택)', sub: 'OnboardingScreen', onClick: onGoOnboarding, color: 'yellow' },
      ],
    },
    {
      title: '홈 화면 (직행)',
      items: [
        { label: '시각장애 홈', sub: 'BlindHomeScreen', onClick: () => onGoHome('visual'), color: 'black' },
        { label: '청각장애 홈', sub: '미구현', onClick: () => onGoHome('hearing'), color: 'gray' },
        { label: '발달장애 홈', sub: '미구현', onClick: () => onGoHome('developmental'), color: 'gray' },
        { label: '기본 홈', sub: '미구현', onClick: () => onGoHome('none'), color: 'gray' },
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
          <p className="text-xs font-semibold text-[#666666] mb-2">Mock 테스트 닉네임</p>
          <div className="flex flex-col gap-1">
            {[
              ['visual', '로그인 → 시각장애 홈'],
              ['hearing', '로그인 → 청각장애 홈'],
              ['developmental', '로그인 → 발달장애 홈'],
              ['none', '로그인 → 기본 홈'],
              ['error', '로그인 → 401 오류 발생'],
              ['taken', '회원가입 → 409 닉네임 중복'],
            ].map(([nick, desc]) => (
              <div key={nick} className="flex items-baseline gap-2">
                <code className="text-xs font-bold text-[#000000] bg-[#EBEBEF] px-1.5 py-0.5 rounded">{nick}</code>
                <span className="text-xs text-[#757575]">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
