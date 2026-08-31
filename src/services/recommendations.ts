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

export function getRecommendations(): Promise<RecommendationListOut> {
  return authedRequest<RecommendationListOut>('/api/v1/recommendations')
}
