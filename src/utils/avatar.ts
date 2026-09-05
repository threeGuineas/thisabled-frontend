import { API_BASE_URL } from '../services/posts'

export function resolveImageUrl(imageUrl: string): string {
  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`
}

// 프로필 이미지를 등록하지 않은 사용자에게 보여줄 기본 아바타 (회색 배경 + 사람 아이콘)
const DEFAULT_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80">
<circle cx="40" cy="40" r="40" fill="#F7F7F9"/>
<path d="M40 40C46.6274 40 52 34.6274 52 28C52 21.3726 46.6274 16 40 16C33.3726 16 28 21.3726 28 28C28 34.6274 33.3726 40 40 40Z" stroke="#C4C4CC" stroke-width="4"/>
<path d="M14 68C14 54 24.6 44 40 44C55.4 44 66 54 66 68" stroke="#C4C4CC" stroke-width="4" stroke-linecap="round"/>
</svg>`

const DEFAULT_AVATAR_URL = `data:image/svg+xml,${encodeURIComponent(DEFAULT_AVATAR_SVG)}`

export function avatarUrlFor(profileImageUrl: string | null): string {
  if (profileImageUrl) return resolveImageUrl(profileImageUrl)
  return DEFAULT_AVATAR_URL
}
