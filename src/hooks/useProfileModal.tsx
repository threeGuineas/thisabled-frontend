import { useState } from 'react'
import BlindUserProfileModal, { type ProfileModalUser } from '../components/BlindUserProfileModal'

// 홈 피드/댓글 등 여러 화면에서 동일하게 쓰이는 "작성자 프로필 팝업" 열기/닫기 상태와
// 렌더링을 한곳에 모은 훅. onMessage는 팝업의 '메시지 보내기'를 눌렀을 때, 대상 유저 정보와 함께 호출된다.
export function useProfileModal(onMessage: (user: ProfileModalUser) => void) {
  const [profileUser, setProfileUser] = useState<ProfileModalUser | null>(null)

  const profileModal = profileUser ? (
    <BlindUserProfileModal
      user={profileUser}
      onClose={() => setProfileUser(null)}
      onMessage={() => {
        setProfileUser(null)
        onMessage(profileUser)
      }}
    />
  ) : null

  return { openProfile: setProfileUser, profileModal }
}
