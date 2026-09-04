import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  open: boolean
  onClose: () => void
  children: ReactNode
  className?: string
  overlayClassName?: string
}

// 화면 하단에서 슬라이드업으로 뜨는 바텀시트의 공통 셸.
// - #root에 포탈로 렌더링해 각 화면의 스크롤 컨테이너 안에 중첩되지 않게 한다.
//   BottomNav를 sticky로 바꾼 것과 같은 이유 — fixed 요소가 스크롤되는 조상 안에
//   깊이 중첩되어 있으면 실기기 브라우저에서 위치가 깨지는 경우가 있어, #root의
//   바로 아래(스크롤되지 않는 층)에 붙여서 그 문제를 원천적으로 피한다.
// - open이 false여도 계속 마운트해두고 translate-y만 토글한다. 조건부로
//   마운트/언마운트하면 열고 닫는 트랜지션이 재생될 기준 프레임이 없어 애니메이션
//   없이 바로 나타나고 사라진다.
export default function BottomSheet({ open, onClose, children, className = '', overlayClassName = 'bg-black/50' }: Props) {
  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  const root = document.getElementById('root')
  if (!root) return null

  return createPortal(
    <>
      <div
        className={[
          'fixed inset-0 z-40 transition-opacity duration-300',
          overlayClassName,
          open ? 'opacity-100' : 'pointer-events-none opacity-0',
        ].join(' ')}
        onClick={onClose}
      />
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300',
          open ? 'translate-y-0' : 'translate-y-full',
          className,
        ].join(' ')}
      >
        {children}
      </div>
    </>,
    root,
  )
}
