import { useEffect, useRef, useState } from 'react'
import { getNotifications, markNotificationsRead, connectNotificationSocket, type NotificationRecord } from '../services/notifications'
import { toNotificationItem, type NotificationItem } from '../utils/notifications'
import { vibrate } from '../utils/haptics'

export function useNotifications(vibrationEnabled = true) {
  const [records, setRecords] = useState<NotificationRecord[]>([])

  // 진동 설정(마이페이지)이 실시간 알림 콜백 안에서 항상 최신 값을 참조하도록 ref로 보관 —
  // 값이 바뀔 때마다 WS를 재연결할 필요는 없다.
  const vibrationEnabledRef = useRef(vibrationEnabled)
  useEffect(() => {
    vibrationEnabledRef.current = vibrationEnabled
  }, [vibrationEnabled])

  useEffect(() => {
    let cancelled = false
    getNotifications().then((page) => {
      if (!cancelled) setRecords(page.items)
    })

    const socket = connectNotificationSocket((record) => {
      setRecords((prev) => [record, ...prev])
      if (vibrationEnabledRef.current) vibrate(200)
    })

    return () => {
      cancelled = true
      socket.close()
    }
  }, [])

  const markAsRead = (id: string) => {
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, is_read: true } : r)))
    markNotificationsRead([id]).catch(() => {})
  }

  const notifications: NotificationItem[] = records.map(toNotificationItem)
  const unreadCount = notifications.filter((item) => !item.isRead).length

  return { notifications, unreadCount, markAsRead }
}
