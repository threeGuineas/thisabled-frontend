import { authedRequest, IS_MOCK } from './auth'

export interface Author {
  id: string | null
  nickname: string
  profile_image_url: string | null
}

export interface PostMediaItem {
  id: string
  media_type: string
  url: string
  sort_order: number
  description: string | null
  description_status: string
  caption: unknown[] | null
  caption_status: string
}

export interface Post {
  id: string
  author: Author
  content: string
  status: string
  media: PostMediaItem[]
  like_count: number
  comment_count: number
  liked_by_me: boolean
  published_at: string | null
  created_at: string
}

export interface FeedPage {
  items: Post[]
  next_cursor: string | null
}

export interface UploadedMedia {
  media_id: string
  url: string
}

export interface LikeResult {
  post_id: string
  liked: boolean
  like_count: number
}

// dev: vite proxy가 /api를 백엔드로 전달하므로 상대 경로 사용. prod: 정적 빌드엔 프록시가 없으므로 백엔드 주소 직접 지정.
export const API_BASE_URL = import.meta.env.PROD ? (import.meta.env.VITE_BACKEND_URL as string) : ''

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const MOCK_CONTENTS = [
  '오늘 처음 가본 동네 베이커리인데 크루아상이 정말 맛있었어요. 겉은 바삭하고 속은 촉촉해서 감동받았습니다. 근처 오시는 분들께 강추해요!',
  '점자 블록이 없는 횡단보도를 만났는데 너무 불편했어요. 이런 정보 같이 공유해요!',
  '주말에 같이 보드게임 하실 분 구해요. 초보도 환영합니다 :)',
  '요즘 독서에 빠졌어요. 추천 책 있으면 댓글로 알려주세요.',
  '복지관에서 배운 요리 오늘 처음 혼자 해봤는데 성공했어요!',
]

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80',
  'https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=400&q=80',
  'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=400&q=80',
  'https://images.unsplash.com/photo-1490730141103-6cac27aaab94?w=400&q=80',
]

const MOCK_NICKNAMES = ['달콤한하루', '하늘산책', '달빛여행', '봄바람', '초록잎']

function mockMedia(idx: number): PostMediaItem[] {
  if (idx % 3 === 2) return []
  return [{
    id: crypto.randomUUID(),
    media_type: 'image',
    url: MOCK_IMAGES[idx % MOCK_IMAGES.length],
    sort_order: 0,
    description: null,
    description_status: 'idle',
    caption: null,
    caption_status: 'idle',
  }]
}

const mockPosts = {
  async uploadImages(files: File[]): Promise<UploadedMedia[]> {
    await sleep(800)
    return files.map(() => ({ media_id: crypto.randomUUID(), url: '/uploads/mock-image.jpg' }))
  },
  async createPost(content: string): Promise<Post> {
    await sleep(600)
    return {
      id: crypto.randomUUID(),
      author: { id: 'mock-uuid', nickname: '나', profile_image_url: null },
      content,
      status: 'published',
      media: [],
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
      published_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }
  },
  async getFeed(cursor: string | null, limit: number): Promise<FeedPage> {
    await sleep(600)
    const startOffset = cursor ? Number(cursor) : 0
    if (startOffset >= 10) return { items: [], next_cursor: null }
    const items = Array.from({ length: Math.min(limit, 5) }, (_, i) => {
      const idx = startOffset + i
      return {
        id: crypto.randomUUID(),
        author: {
          id: `mock-uuid-${(i % 3) + 1}`,
          nickname: MOCK_NICKNAMES[idx % MOCK_NICKNAMES.length],
          profile_image_url: null,
        },
        content: MOCK_CONTENTS[idx % MOCK_CONTENTS.length],
        status: 'published',
        media: mockMedia(idx),
        like_count: idx % 4,
        comment_count: idx % 3,
        liked_by_me: false,
        published_at: new Date(Date.now() - idx * 3600000).toISOString(),
        created_at: new Date(Date.now() - idx * 3600000).toISOString(),
      }
    })
    const nextOffset = startOffset + items.length
    return { items, next_cursor: nextOffset < 10 ? String(nextOffset) : null }
  },
  async likePost(postId: string, liked: boolean): Promise<LikeResult> {
    await sleep(200)
    return { post_id: postId, liked, like_count: liked ? 1 : 0 }
  },
}

export async function uploadImages(files: File[]): Promise<UploadedMedia[]> {
  if (IS_MOCK) return mockPosts.uploadImages(files)
  const formData = new FormData()
  for (const file of files) formData.append('files', file)
  // Content-Type은 FormData 사용 시 직접 설정하지 않음 — 브라우저가 multipart/form-data로 자동 설정
  const { items } = await authedRequest<{ items: UploadedMedia[] }>('/api/v1/media/images', {
    method: 'POST',
    body: formData,
  })
  return items
}

export async function createPost(content: string, mediaIds: string[] = []): Promise<Post> {
  if (IS_MOCK) return mockPosts.createPost(content)
  return authedRequest<Post>('/api/v1/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, media_ids: mediaIds }),
  })
}

export async function getFeed(cursor: string | null = null, limit = 20): Promise<FeedPage> {
  if (IS_MOCK) return mockPosts.getFeed(cursor, limit)
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return authedRequest<FeedPage>(`/api/v1/feed?${params}`)
}

export async function likePost(postId: string): Promise<LikeResult> {
  if (IS_MOCK) return mockPosts.likePost(postId, true)
  return authedRequest<LikeResult>(`/api/v1/posts/${postId}/like`, { method: 'POST' })
}

export async function unlikePost(postId: string): Promise<LikeResult> {
  if (IS_MOCK) return mockPosts.likePost(postId, false)
  return authedRequest<LikeResult>(`/api/v1/posts/${postId}/like`, { method: 'DELETE' })
}
