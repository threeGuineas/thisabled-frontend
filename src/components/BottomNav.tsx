import styles from './BottomNav.styles'
import homeYIcon from '../assets/images/home-y.svg'
import homeWIcon from '../assets/images/home-w.svg'
import friendYIcon from '../assets/images/friend-y.svg'
import friendWIcon from '../assets/images/friend-w.svg'
import chatYIcon from '../assets/images/chat-y.svg'
import chatWIcon from '../assets/images/chat-w.svg'
import mypageYIcon from '../assets/images/mypage-y.svg'
import mypageWIcon from '../assets/images/mypage-w.svg'
import homeIcon from '../assets/images/home.svg'
import friendIcon from '../assets/images/friend.svg'
import chatIcon from '../assets/images/chat.svg'
import mypageIcon from '../assets/images/mypage.svg'

export type Tab = 'home' | 'friend' | 'chat' | 'my'
export type Variant = 'default' | 'blind' | 'hearing' | 'developmental'

const tabsByVariant: Record<Variant, { id: Tab; label: string; activeIcon: string; inactiveIcon: string }[]> = {
  // 저시력 사용자를 위해 활성/비활성 상태를 opacity가 아닌 별도 색상 아이콘으로 구분
  blind: [
    { id: 'home',   label: '홈',   activeIcon: homeYIcon,   inactiveIcon: homeWIcon },
    { id: 'friend', label: '친구', activeIcon: friendYIcon, inactiveIcon: friendWIcon },
    { id: 'chat',   label: '채팅', activeIcon: chatYIcon,   inactiveIcon: chatWIcon },
    { id: 'my',     label: '마이', activeIcon: mypageYIcon, inactiveIcon: mypageWIcon },
  ],
  default: [
    { id: 'home',   label: '홈',   activeIcon: homeIcon,   inactiveIcon: homeIcon },
    { id: 'friend', label: '친구', activeIcon: friendIcon, inactiveIcon: friendIcon },
    { id: 'chat',   label: '채팅', activeIcon: chatIcon,   inactiveIcon: chatIcon },
    { id: 'my',     label: '마이', activeIcon: mypageIcon, inactiveIcon: mypageIcon },
  ],
  hearing: [
    { id: 'home',   label: '홈',   activeIcon: homeIcon,   inactiveIcon: homeIcon },
    { id: 'friend', label: '친구', activeIcon: friendIcon, inactiveIcon: friendIcon },
    { id: 'chat',   label: '채팅', activeIcon: chatIcon,   inactiveIcon: chatIcon },
    { id: 'my',     label: '마이', activeIcon: mypageIcon, inactiveIcon: mypageIcon },
  ],
  // 발달장애 모드 — 다른 모드와 동일한 아이콘 세트를 그대로 써서 일관성을 유지하되(DEV-01),
  // 터치 영역과 라벨을 크게 키운다(BottomNav.styles.ts)
  developmental: [
    { id: 'home',   label: '홈',   activeIcon: homeIcon,   inactiveIcon: homeIcon },
    { id: 'friend', label: '친구', activeIcon: friendIcon, inactiveIcon: friendIcon },
    { id: 'chat',   label: '채팅', activeIcon: chatIcon,   inactiveIcon: chatIcon },
    { id: 'my',     label: '마이', activeIcon: mypageIcon, inactiveIcon: mypageIcon },
  ],
}

interface Props {
  variant: Variant
  active: Tab
  onChange?: (tab: Tab) => void
}

export default function BottomNav({ variant, active, onChange }: Props) {
  const s = styles[variant]
  const tabs = tabsByVariant[variant]

  return (
    <nav className={s.nav}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            className={s.tab}
            onClick={() => onChange?.(tab.id)}
          >
            <div className={isActive ? s.iconWrapperActive : s.iconWrapper}>
              <img
                src={isActive ? tab.activeIcon : tab.inactiveIcon}
                alt=""
                className={isActive ? s.icon : s.iconDim}
              />
            </div>
            <span className={isActive ? s.labelActive : s.label}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
