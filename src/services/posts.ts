import { tokenStorage, IS_MOCK } from './auth'

export interface Post {
  id: number
  user_id: number
  content: string
  image_url: string | null
  created_at: string
}

export const API_BASE_URL = ''


const BASE_URL = API_BASE_URL
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

const mockPosts = {
  async upload(_file: File): Promise<{ url: string }> {
    await sleep(800)
    return { url: '/uploads/mock-image.jpg' }
  },
  async createPost(content: string, image_url: string | null): Promise<Post> {
    await sleep(600)
    return { id: Date.now(), user_id: 1, content, image_url, created_at: new Date().toISOString() }
  },
  async getPosts(offset: number, limit: number): Promise<Post[]> {
    await sleep(600)
    if (offset >= 10) return []
    return Array.from({ length: Math.min(limit, 5) }, (_, i) => {
      const idx = offset + i
      return {
        id: idx + 1,
        user_id: (i % 3) + 1,
        content: MOCK_CONTENTS[idx % MOCK_CONTENTS.length],
        image_url: idx % 3 !== 2 ? MOCK_IMAGES[idx % MOCK_IMAGES.length] : null,
        created_at: new Date(Date.now() - idx * 3600000).toISOString(),
      }
    })
  },
}

async function authedFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get()
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail ?? '오류가 발생했습니다.' }
  }
  return res.json() as Promise<T>
}

export async function uploadImage(file: File): Promise<{ url: string }> {
  if (IS_MOCK) return mockPosts.upload(file)
  const formData = new FormData()
  formData.append('file', file)
  // Content-Type을 직접 지정하지 않음 — 브라우저가 multipart/form-data로 자동 설정
  return authedFetch<{ url: string }>('/api/v1/upload', { method: 'POST', body: formData })
}

export async function createPost(content: string, imageUrl: string | null): Promise<Post> {
  if (IS_MOCK) return mockPosts.createPost(content, imageUrl)
  return authedFetch<Post>('/api/v1/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, image_url: imageUrl }),
  })
}

export async function getPosts(offset = 0, limit = 20): Promise<Post[]> {
  if (IS_MOCK) return mockPosts.getPosts(offset, limit)
  const params = new URLSearchParams({ offset: String(offset), limit: String(limit) })
  const res = await fetch(`${BASE_URL}/api/v1/posts?${params}`)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw { status: res.status, detail: body.detail ?? '피드를 불러오지 못했습니다.' }
  }
  return res.json() as Promise<Post[]>
}
