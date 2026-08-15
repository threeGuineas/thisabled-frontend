import type { PostCategory } from '../services/posts'

export const FILTERS = ['전체', '일상', '정보', '취미', '고민', '모임']

// Post에는 실제 카테고리 필드가 없어 id를 해시해 고정된 카테고리를 부여한다 (표시/필터용).
export function categoryFor(id: string): string {
  const categories = FILTERS.slice(1)
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return categories[h % categories.length]
}

// 화면에 노출하는 한글 카테고리 라벨 ↔ 백엔드 PostCategory 코드 매핑 (POST-01)
export const CATEGORY_CODE: Record<string, PostCategory> = {
  '일상': 'daily',
  '정보': 'info',
  '취미': 'hobby',
  '고민': 'concern',
  '모임': 'meetup',
}
