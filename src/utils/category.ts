import type { PostCategory } from '../services/posts'

export const FILTERS = ['전체', '일상', '정보', '취미', '고민', '모임']

// 화면에 노출하는 한글 카테고리 라벨 ↔ 백엔드 PostCategory 코드 매핑 (POST-01)
export const CATEGORY_CODE: Record<string, PostCategory> = {
  '일상': 'daily',
  '정보': 'info',
  '취미': 'hobby',
  '고민': 'concern',
  '모임': 'meetup',
}

export const CATEGORY_LABEL: Record<PostCategory, string> = {
  daily: '일상',
  info: '정보',
  hobby: '취미',
  concern: '고민',
  meetup: '모임',
}

// post.category(백엔드 코드)를 화면에 표시할 한글 라벨로 변환한다.
export function categoryFor(category: PostCategory | null | undefined): string {
  return category ? CATEGORY_LABEL[category] : '기타'
}
