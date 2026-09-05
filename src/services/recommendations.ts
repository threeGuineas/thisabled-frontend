import { authedRequest } from './auth'

export interface RecommendedPerson {
  user_id: string
  nickname: string
  bio: string | null
  profile_image_url: string | null
  tags: string[]
  score: number
  reasons: string[]
}

export interface RecommendationListOut {
  items: RecommendedPerson[]
  message: string | null
}

// 백엔드가 items: []와 함께 내려주는 안내 메시지 — 문서(recommendation-frontend-integration.md) 권장대로 상수로 관리
export const RECOMMENDATION_MESSAGE = {
  notEnough: '추천 정보가 부족합니다',
  temporary: '지금은 추천을 만들 수 없어요. 잠시 후 다시 시도해 주세요',
} as const

// 마지막으로 성공한 추천 결과. 매치 서비스가 scale-to-zero라 콜드 스타트 동안
// items:[]+temporary나 오류가 섞여 오는데, 화면 진입마다 이걸 그대로 보여주면
// 추천이 나왔다 안 나왔다 하는 것처럼 보인다. 재시도로도 못 살리면 이 캐시로 대체한다.
let lastSuccess: RecommendationListOut | null = null

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getRecommendations(): Promise<RecommendationListOut> {
  const MAX_ATTEMPTS = 3
  let lastError: unknown = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const page = await authedRequest<RecommendationListOut>('/api/v1/recommendations')
      const isTransientEmpty = page.items.length === 0 && page.message === RECOMMENDATION_MESSAGE.temporary

      if (isTransientEmpty && attempt < MAX_ATTEMPTS - 1) {
        await delay(1500 * (attempt + 1))
        continue
      }
      if (isTransientEmpty && lastSuccess) return lastSuccess

      lastSuccess = page
      return page
    } catch (err) {
      lastError = err
      if (attempt < MAX_ATTEMPTS - 1) {
        await delay(1500 * (attempt + 1))
      }
    }
  }

  if (lastSuccess) return lastSuccess
  throw lastError
}
