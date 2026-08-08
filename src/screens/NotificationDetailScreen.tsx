import styles from './NotificationDetailScreen.styles'
import backIcon from '../assets/images/back.svg'
import { NOTIFICATIONS } from '../utils/notifications'

interface Props {
  onBack: () => void
}

function timeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return '방금 전'
  if (mins < 60) return `${mins}분 전`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}시간 전`
  return `${Math.floor(hours / 24)}일 전`
}

export default function NotificationDetailScreen({ onBack }: Props) {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button type="button" onClick={onBack} className={styles.backButton} aria-label="뒤로 가기">
          <img src={backIcon} alt="" className={styles.backIcon} />
        </button>
        <span className={styles.title}>알림</span>
      </div>

      <div className={styles.list}>
        {NOTIFICATIONS.map((item, i) => (
          <div key={i} className={item.isRead ? styles.rowRead : styles.rowUnread}>
            <div className={styles.iconWrapper} style={{ backgroundColor: item.iconBg }}>
              <img src={item.icon} alt="" className={styles.icon} />
              {!item.isRead && <span className={styles.unreadDot} />}
            </div>
            <div className={styles.textCol}>
              <span className={styles.rowText}>{item.message}</span>
              <span className={styles.rowDetail}>{item.detail}</span>
              <span className={styles.rowTime}>{timeAgo(item.createdAt)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
