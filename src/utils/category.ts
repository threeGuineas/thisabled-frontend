export const FILTERS = ['전체', '일상', '정보', '취미', '고민', '모임']

// Post에는 실제 카테고리 필드가 없어 id를 해시해 고정된 카테고리를 부여한다 (표시/필터용).
export function categoryFor(id: string): string {
  const categories = FILTERS.slice(1)
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0
  return categories[h % categories.length]
}
