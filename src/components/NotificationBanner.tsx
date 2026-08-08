import { useEffect, useState } from 'react'
import alarmIcon from '../assets/images/alarm-b.svg'
import { NOTIFICATIONS } from '../utils/notifications'

const ROTATE_INTERVAL_MS = 3000

interface Props {
  unreadCount: number
  onMoreClick?: () => void
}

// 청각모드 전용 — 소리 대신 화면에 남는 시각 알림 배너. 광고 배너처럼 알림 내용이 옆으로 넘어가며 순환된다.
export default function NotificationBanner({ unreadCount, onMoreClick }: Props) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % NOTIFICATIONS.length)
    }, ROTATE_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [])

  if (unreadCount <= 0) return null

  return (
    <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-[#EAF0FF] px-4 py-3 shadow-sm">
      <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center flex-shrink-0">
        <img src={alarmIcon} alt="" className="w-5 h-5" />
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <span className="text-sm font-bold text-[#4C7DFF]">확인하지 않은 알림 {unreadCount}건</span>
        <div className="overflow-hidden h-4">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${index * 100}%)` }}
          >
            {NOTIFICATIONS.map((item, i) => (
              <span key={i} className="basis-full shrink-0 flex items-center gap-1.5 min-w-0">
                <img src={item.icon} alt="" className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate text-xs text-[#00000]/70">{item.message}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        onClick={onMoreClick}
        className="flex-shrink-0 text-xs font-semibold text-white bg-[#4C7DFF] rounded-full px-3 py-1.5"
      >
        더보기
      </button>
    </div>
  )
}
