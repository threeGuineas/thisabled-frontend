import DefaultFriendScreen from '../default/DefaultFriendScreen'
import type { Tab } from '../../components/BottomNav'
import type { Author } from '../../services/posts'

interface Props {
  onTabChange: (tab: Tab) => void
  onOpenChat: (friend: Author) => void
}

// 친구 목록/추천/요청 UI는 DefaultFriendScreen을 그대로 재사용하되 큰 버튼·초록 강조색 테마만 적용한다.
export default function DevFriendScreen({ onTabChange, onOpenChat }: Props) {
  return <DefaultFriendScreen onTabChange={onTabChange} onOpenChat={onOpenChat} theme="developmental" />
}
