import styles from './BlindBottomNav.styles'
import homeYIcon from '../assets/images/home-y.svg'
import homeWIcon from '../assets/images/home-w.svg'
import friendYIcon from '../assets/images/friend-y.svg'
import friendWIcon from '../assets/images/friend-w.svg'
import chatYIcon from '../assets/images/chat-y.svg'
import chatWIcon from '../assets/images/chat-w.svg'
import mypageYIcon from '../assets/images/mypage-y.svg'
import mypageWIcon from '../assets/images/mypage-w.svg'

export type Tab = 'home' | 'friend' | 'chat' | 'my'

const tabs: { id: Tab; label: string; activeIcon: string; inactiveIcon: string }[] = [
  { id: 'home',   label: '홈',   activeIcon: homeYIcon,    inactiveIcon: homeWIcon },
  { id: 'friend', label: '친구', activeIcon: friendYIcon,  inactiveIcon: friendWIcon },
  { id: 'chat',   label: '채팅', activeIcon: chatYIcon,    inactiveIcon: chatWIcon },
  { id: 'my',     label: '마이', activeIcon: mypageYIcon,  inactiveIcon: mypageWIcon },
]

interface Props {
  active: Tab
  onChange?: (tab: Tab) => void
}

export default function BlindBottomNav({ active, onChange }: Props) {
  return (
    <nav className={styles.nav}>
      {tabs.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            className={styles.tab}
            onClick={() => onChange?.(tab.id)}
          >
            <div className={isActive ? styles.iconWrapperActive : styles.iconWrapper}>
              <img
                src={isActive ? tab.activeIcon : tab.inactiveIcon}
                alt=""
                className={isActive ? styles.icon : styles.iconDim}
              />
            </div>
            <span className={isActive ? styles.labelActive : styles.label}>
              {tab.label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
