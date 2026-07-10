import { authedRequest, IS_MOCK } from './auth'

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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const mockRecommendations: RecommendedPerson[] = [
  {
    user_id: 'mock-rec-1',
    nickname: '초록언덕',
    bio: '반려견과 매일 산책해요',
    profile_image_url: null,
    tags: ['pet_강아지'],
    score: 0.91,
    reasons: ['관심사가 비슷해요'],
  },
  {
    user_id: 'mock-rec-2',
    nickname: '느린발걸음',
    bio: '같은 동네에 살아요',
    profile_image_url: null,
    tags: ['daily_일상 나누기'],
    score: 0.85,
    reasons: [],
  },
  {
    user_id: 'mock-rec-3',
    nickname: '따뜻한차',
    bio: '독서 모임 함께해요',
    profile_image_url: null,
    tags: ['book_독서'],
    score: 0.8,
    reasons: ['관심사가 비슷해요'],
  },
]

const mockRecommendationsApi = {
  async getRecommendations(): Promise<RecommendationListOut> {
    await sleep(400)
    return { items: mockRecommendations, message: null }
  },
}

export function getRecommendations(): Promise<RecommendationListOut> {
  if (IS_MOCK) return mockRecommendationsApi.getRecommendations()
  return authedRequest<RecommendationListOut>('/api/v1/recommendations')
}
