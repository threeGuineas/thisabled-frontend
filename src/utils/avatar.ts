import { API_BASE_URL } from '../services/posts'

export function resolveImageUrl(imageUrl: string): string {
  return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`
}

// UUID 문자열을 안정적인 정수 인덱스로 변환 (프로필 이미지 없는 사용자의 임시 아바타용)
function hashId(id: string): number {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return h
}

export function avatarUrlFor(profileImageUrl: string | null, seed: string): string {
  if (profileImageUrl) return resolveImageUrl(profileImageUrl)
  const idx = (hashId(seed) % 70) + 1
  return `https://i.pravatar.cc/80?img=${idx}`
}
