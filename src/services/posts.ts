import { authedRequest, IS_MOCK } from './auth'
import { type CaptionSegment } from '../utils/vtt'

export interface Author {
  id: string | null
  nickname: string
  profile_image_url: string | null
}

export type AiStatus = 'none' | 'processing' | 'done' | 'failed'
export type DescriptionStatus = AiStatus

export interface PostMediaItem {
  id: string
  media_type: string
  url: string
  sort_order: number
  description: string | null
  description_status: DescriptionStatus
  caption: CaptionSegment[] | null
  caption_status: AiStatus
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

// POST /media/videos는 이미지 업로드와 달리 업로드 시점에 processing 상태의 Post 드래프트를
// 함께 만든다(자막 생성도 즉시 시작) — media_id만 반환하는 UploadedMedia와는 응답 형태가 다르다.
export interface UploadedVideo {
  post_id: string
  media_id: string
  caption_status: AiStatus
}

export interface LikeResult {
  post_id: string
  liked: boolean
  like_count: number
}

export interface Comment {
  id: string
  post_id: string
  author: Author
  content: string
  created_at: string
  updated_at: string | null
}

export interface CommentsPage {
  items: Comment[]
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

const MOCK_VISION_DESCRIPTIONS = [
  '초록색 나뭇잎이 가득한 숲 속 풍경입니다. 맑은 햇빛이 나뭇잎 사이로 비치고 있습니다.',
  '넓은 들판 위로 푸른 하늘이 펼쳐져 있습니다. 구름이 조금 떠 있고 따뜻한 햇살이 비치는 오후 풍경입니다.',
  '하늘을 배경으로 찍은 풍경 사진입니다. 밝은 빛이 가득하고 평화로운 분위기입니다.',
  '빵집에서 찍은 사진입니다. 갓 구운 크루아상이 접시에 담겨 있고, 배경에는 따뜻한 카페 분위기가 느껴집니다.',
]

// mock 모드에서 CAPTION-01(영상 자막) 화면을 확인할 수 있도록 사용하는 샘플 영상/세그먼트.
// 실제 백엔드는 게시(publish) 시점에 자막 생성이 끝나 있어야 하므로(processing이면 409) 게시된
// 피드에는 원래 done/failed만 노출되지만, FE에서 "방금 올린 영상" 자막 생성 중 UI를 미리 볼 수 있도록
// mock 피드에는 예외적으로 processing 상태인 영상도 하나 섞어 둔다.
// 세그먼트 종료 시각은 샘플 영상 길이(약 5초)를 넘지 않도록 맞춘다 — 넘으면 마지막 자막이 재생되지 않는다.
const MOCK_VIDEO_URL = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4'
const MOCK_CAPTION_SEGMENTS: CaptionSegment[] = [
  { start: 0, end: 1.6, text: '안녕하세요, 오늘 소개할 영상입니다.' },
  { start: 1.6, end: 3.4, text: '청각장애인을 위한 자막 기능을 시연합니다.' },
  { start: 3.4, end: 5.0, text: '시청해주셔서 감사합니다.' },
]
const MOCK_CAPTION_DEMO_CONTENT = '영상 자막이 정상적으로 잘 나오는지 확인해보는 예시 게시물이에요. 재생 버튼을 눌러서 자막을 켜보세요!'

// mock 모드에서 VISION-01(사진 설명) 백그라운드 생성을 흉내내기 위한 상태 저장소.
// 실제 백엔드에는 전용 폴링 API가 없으므로 GET /posts/{id} 재조회로 상태 변화를 확인해야 하고,
// mock도 동일하게 getPost() 재호출 시점에 processing → done으로 전환되도록 만든다.
const mockPostStore = new Map<string, Post>()
const mockDescriptionReadyAt = new Map<string, number>()
const mockCaptionReadyAt = new Map<string, number>()
const mockCaptionShouldFail = new Map<string, boolean>()
const mockCommentStore = new Map<string, Comment[]>()

function mockDescriptionFor(mediaId: string): string {
  let h = 0
  for (let i = 0; i < mediaId.length; i++) h = (h * 31 + mediaId.charCodeAt(i)) >>> 0
  return MOCK_VISION_DESCRIPTIONS[h % MOCK_VISION_DESCRIPTIONS.length]
}

function mockMedia(idx: number): PostMediaItem[] {
  // 청각모드 자막(CAPTION-01)이 정상 동작하는 예시를 스크롤 없이 바로 확인할 수 있도록,
  // 피드 맨 앞(idx 0)은 실패 없이 항상 자막 생성이 완료된 영상으로 고정한다.
  if (idx === 0) {
    return [{
      id: crypto.randomUUID(),
      media_type: 'video',
      url: MOCK_VIDEO_URL,
      sort_order: 0,
      description: null,
      description_status: 'none',
      caption: MOCK_CAPTION_SEGMENTS,
      caption_status: 'done',
    }]
  }
  if (idx % 4 === 2) return []
  if (idx % 4 === 3) {
    // 게시글 동영상을 딱 올린 직후 — 자막을 아직 요청하지 않은 상태를 미리보기 위한 예시.
    // VideoCaptionPlayer의 "자막 생성하기" 버튼을 눌러야 processing → done으로 넘어간다.
    const notGenerated = idx % 8 === 3
    return [{
      id: crypto.randomUUID(),
      media_type: 'video',
      url: MOCK_VIDEO_URL,
      sort_order: 0,
      description: null,
      description_status: 'none',
      caption: notGenerated ? null : MOCK_CAPTION_SEGMENTS,
      caption_status: notGenerated ? 'none' : 'done',
    }]
  }
  const id = crypto.randomUUID()
  mockDescriptionReadyAt.set(id, Date.now() + 3000)
  return [{
    id,
    media_type: 'image',
    url: MOCK_IMAGES[idx % MOCK_IMAGES.length],
    sort_order: 0,
    description: null,
    description_status: 'processing',
    caption: null,
    caption_status: 'none',
  }]
}

// processing 상태인 미디어 중 준비 시각이 지난 것을 done으로 전환
function resolveMockDescriptions(post: Post): Post {
  const media = post.media.map((m) => {
    if (m.description_status !== 'processing') return m
    const readyAt = mockDescriptionReadyAt.get(m.id)
    if (!readyAt || Date.now() < readyAt) return m
    return { ...m, description_status: 'done' as const, description: mockDescriptionFor(m.id) }
  })
  const resolved = { ...post, media }
  mockPostStore.set(post.id, resolved)
  return resolved
}

// "자막 생성하기" 버튼으로 시작된 처리 중 자막 중 준비 시각이 지난 것을 done으로 전환
function resolveMockCaptions(post: Post): Post {
  const media = post.media.map((m) => {
    if (m.caption_status !== 'processing') return m
    const readyAt = mockCaptionReadyAt.get(m.id)
    if (!readyAt || Date.now() < readyAt) return m
    mockCaptionReadyAt.delete(m.id)
    const shouldFail = mockCaptionShouldFail.get(m.id) ?? false
    mockCaptionShouldFail.delete(m.id)
    return shouldFail
      ? { ...m, caption_status: 'failed' as const }
      : { ...m, caption_status: 'done' as const, caption: MOCK_CAPTION_SEGMENTS }
  })
  const resolved = { ...post, media }
  mockPostStore.set(post.id, resolved)
  return resolved
}

const mockPosts = {
  async uploadImages(files: File[]): Promise<UploadedMedia[]> {
    await sleep(800)
    return files.map(() => ({ media_id: crypto.randomUUID(), url: '/uploads/mock-image.jpg' }))
  },
  // 실제 백엔드처럼 업로드 시점에 processing 드래프트 Post를 함께 만든다.
  // 파일명에 'failtest'가 들어있으면 자막 생성이 failed로 끝나도록 해 실패 케이스를 확인할 수 있다.
  async uploadVideo(file: File): Promise<UploadedVideo> {
    await sleep(1000)
    const postId = crypto.randomUUID()
    const mediaId = crypto.randomUUID()
    const post: Post = {
      id: postId,
      author: { id: 'mock-uuid', nickname: '나', profile_image_url: null },
      content: '',
      status: 'processing',
      media: [{
        id: mediaId,
        media_type: 'video',
        url: MOCK_VIDEO_URL,
        sort_order: 0,
        description: null,
        description_status: 'none',
        caption: null,
        caption_status: 'processing',
      }],
      like_count: 0,
      comment_count: 0,
      liked_by_me: false,
      published_at: null,
      created_at: new Date().toISOString(),
    }
    mockPostStore.set(postId, post)
    mockCaptionReadyAt.set(mediaId, Date.now() + 2500)
    mockCaptionShouldFail.set(mediaId, file.name.includes('failtest'))
    return { post_id: postId, media_id: mediaId, caption_status: 'processing' }
  },
  async updatePost(postId: string, content: string): Promise<Post> {
    await sleep(300)
    const post = mockPostStore.get(postId)
    if (!post) throw { status: 404, detail: '게시물을 찾을 수 없습니다.' }
    const updated = { ...post, content }
    mockPostStore.set(postId, updated)
    return updated
  },
  async getCaptionStatus(postId: string): Promise<{ caption_status: AiStatus }> {
    await sleep(300)
    const post = mockPostStore.get(postId)
    if (!post) throw { status: 404, detail: '게시물을 찾을 수 없습니다.' }
    const resolved = resolveMockCaptions(post)
    return { caption_status: resolved.media[0]?.caption_status ?? 'none' }
  },
  async publishPost(postId: string, allowNoCaption: boolean): Promise<Post> {
    await sleep(400)
    const post = mockPostStore.get(postId)
    if (!post) throw { status: 404, detail: '게시물을 찾을 수 없습니다.' }
    if (post.status === 'published') throw { status: 400, detail: '이미 공개된 게시물이에요.' }
    const resolved = resolveMockCaptions(post)
    const captionStatus = resolved.media[0]?.caption_status ?? 'none'
    if (captionStatus === 'processing') throw { status: 409, detail: '자막을 만드는 중입니다. 잠시 후 다시 시도해 주세요.' }
    if (captionStatus === 'failed' && !allowNoCaption) throw { status: 400, detail: '자막 생성에 실패했어요. 자막 없이 게시할까요?' }
    const updated: Post = { ...resolved, status: 'published', published_at: new Date().toISOString() }
    mockPostStore.set(postId, updated)
    return updated
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
      const post: Post = {
        id: crypto.randomUUID(),
        author: {
          id: `mock-uuid-${(i % 3) + 1}`,
          nickname: MOCK_NICKNAMES[idx % MOCK_NICKNAMES.length],
          profile_image_url: null,
        },
        content: idx === 0 ? MOCK_CAPTION_DEMO_CONTENT : MOCK_CONTENTS[idx % MOCK_CONTENTS.length],
        status: 'published',
        media: mockMedia(idx),
        like_count: idx % 4,
        comment_count: idx % 3,
        liked_by_me: false,
        published_at: new Date(Date.now() - idx * 3600000).toISOString(),
        created_at: new Date(Date.now() - idx * 3600000).toISOString(),
      }
      mockPostStore.set(post.id, post)
      return post
    })
    const nextOffset = startOffset + items.length
    return { items, next_cursor: nextOffset < 10 ? String(nextOffset) : null }
  },
  async likePost(postId: string, liked: boolean): Promise<LikeResult> {
    await sleep(200)
    return { post_id: postId, liked, like_count: liked ? 1 : 0 }
  },
  async getPost(postId: string): Promise<Post> {
    await sleep(400)
    const post = mockPostStore.get(postId)
    if (!post) throw { status: 404, detail: '게시물을 찾을 수 없습니다.' }
    return resolveMockCaptions(resolveMockDescriptions(post))
  },
  async requestCaptionGeneration(postId: string, mediaId: string): Promise<Post> {
    await sleep(300)
    const post = mockPostStore.get(postId)
    if (!post) throw { status: 404, detail: '게시물을 찾을 수 없습니다.' }
    const media = post.media.map((m) => (m.id === mediaId ? { ...m, caption_status: 'processing' as const } : m))
    const updated = { ...post, media }
    mockPostStore.set(postId, updated)
    mockCaptionReadyAt.set(mediaId, Date.now() + 3000)
    return updated
  },
  async getComments(postId: string): Promise<CommentsPage> {
    await sleep(400)
    return { items: mockCommentStore.get(postId) ?? [] }
  },
  async createComment(postId: string, content: string): Promise<Comment> {
    await sleep(400)
    const comment: Comment = {
      id: crypto.randomUUID(),
      post_id: postId,
      author: { id: 'mock-uuid', nickname: '나', profile_image_url: null },
      content,
      created_at: new Date().toISOString(),
      updated_at: null,
    }
    const list = mockCommentStore.get(postId) ?? []
    list.push(comment)
    mockCommentStore.set(postId, list)
    return comment
  },
  async updateComment(commentId: string, content: string): Promise<Comment> {
    await sleep(300)
    for (const list of mockCommentStore.values()) {
      const idx = list.findIndex((c) => c.id === commentId)
      if (idx !== -1) {
        list[idx] = { ...list[idx], content, updated_at: new Date().toISOString() }
        return list[idx]
      }
    }
    throw { status: 404, detail: '댓글을 찾을 수 없습니다' }
  },
  async deleteComment(commentId: string): Promise<void> {
    await sleep(300)
    for (const list of mockCommentStore.values()) {
      const idx = list.findIndex((c) => c.id === commentId)
      if (idx !== -1) {
        list.splice(idx, 1)
        return
      }
    }
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

// mp4/webm/quicktime, 200MB 이하, 3분 이하(durationSeconds) — 업로드 시점에 processing 상태의
// Post 드래프트가 함께 생성되고 자막 생성이 자동 시작된다. 이미지와 달리 이 media_id는
// POST /posts의 media_ids로 다시 붙일 수 없다 — publishPost()로 이 드래프트를 그대로 게시해야 한다.
export async function uploadVideo(file: File, durationSeconds: number): Promise<UploadedVideo> {
  if (IS_MOCK) return mockPosts.uploadVideo(file)
  const formData = new FormData()
  formData.append('file', file)
  formData.append('duration_seconds', String(durationSeconds))
  return authedRequest<UploadedVideo>('/api/v1/media/videos', { method: 'POST', body: formData })
}

export async function createPost(content: string, mediaIds: string[] = []): Promise<Post> {
  if (IS_MOCK) return mockPosts.createPost(content)
  return authedRequest<Post>('/api/v1/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, media_ids: mediaIds }),
  })
}

// 영상 드래프트(processing 상태 Post)의 본문을 채운다 — POST /media/videos, POST .../publish
// 어느 쪽도 content를 받지 않으므로, 텍스트는 이 PATCH로 드래프트에 미리 채워둬야 한다.
export async function updatePost(postId: string, content: string): Promise<Post> {
  if (IS_MOCK) return mockPosts.updatePost(postId, content)
  return authedRequest<Post>(`/api/v1/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function getCaptionStatus(postId: string): Promise<{ caption_status: AiStatus }> {
  if (IS_MOCK) return mockPosts.getCaptionStatus(postId)
  return authedRequest<{ caption_status: AiStatus }>(`/api/v1/posts/${postId}/caption-status`)
}

// 자막이 processing → done/failed로 바뀔 때까지 폴링 — 게시(publish)는 자막 생성이 끝난
// 뒤에만 가능하다(processing이면 409). 약 30초(15회 × 2초) 후에도 processing이면 그대로 반환하고
// 호출부가 "잠시 후 다시 시도" 안내를 하도록 한다.
export async function waitForCaptionReady(postId: string): Promise<AiStatus> {
  for (let attempt = 0; attempt < 15; attempt++) {
    const { caption_status } = await getCaptionStatus(postId)
    if (caption_status !== 'processing') return caption_status
    await sleep(2000)
  }
  return 'processing'
}

// 영상 드래프트를 실제로 공개한다. 자막이 failed 상태면 서버가 400으로 막으며, 사용자가
// "자막 없이 게시"를 명시적으로 선택했을 때만 allowNoCaption=true로 우회할 수 있다(CAPTION-01 정책).
export async function publishPost(postId: string, allowNoCaption = false): Promise<Post> {
  if (IS_MOCK) return mockPosts.publishPost(postId, allowNoCaption)
  return authedRequest<Post>(`/api/v1/posts/${postId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ allow_no_caption: allowNoCaption }),
  })
}

export async function getFeed(cursor: string | null = null, limit = 20): Promise<FeedPage> {
  if (IS_MOCK) return mockPosts.getFeed(cursor, limit)
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return authedRequest<FeedPage>(`/api/v1/feed?${params}`)
}

// 사진 설명(VISION-01)은 전용 폴링 API가 없으므로 게시물 상세를 재조회해 description_status 변화를 확인한다.
export async function getPost(postId: string): Promise<Post> {
  if (IS_MOCK) return mockPosts.getPost(postId)
  return authedRequest<Post>(`/api/v1/posts/${postId}`)
}

// 실제 백엔드는 영상 업로드 시점(POST /media/videos)에 자막 생성이 자동으로 시작돼 별도의
// 수동 생성 API가 없다 — mock 모드에서 "자막 생성하기" 버튼을 눌러 생성 과정을 미리 볼 수 있도록
// FE 전용으로 추가한 트리거이며, 실제 API 모드에서는 호출될 일이 없다(피드 영상은 항상 done/failed).
export async function requestCaptionGeneration(postId: string, mediaId: string): Promise<Post> {
  if (IS_MOCK) return mockPosts.requestCaptionGeneration(postId, mediaId)
  return getPost(postId)
}

export async function likePost(postId: string): Promise<LikeResult> {
  if (IS_MOCK) return mockPosts.likePost(postId, true)
  return authedRequest<LikeResult>(`/api/v1/posts/${postId}/like`, { method: 'POST' })
}

export async function unlikePost(postId: string): Promise<LikeResult> {
  if (IS_MOCK) return mockPosts.likePost(postId, false)
  return authedRequest<LikeResult>(`/api/v1/posts/${postId}/like`, { method: 'DELETE' })
}

export async function getComments(postId: string): Promise<CommentsPage> {
  if (IS_MOCK) return mockPosts.getComments(postId)
  return authedRequest<CommentsPage>(`/api/v1/posts/${postId}/comments`)
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  if (IS_MOCK) return mockPosts.createComment(postId, content)
  return authedRequest<Comment>(`/api/v1/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

// 댓글 작성자 본인만 가능 — 403/404는 호출부에서 detail 메시지로 처리
export async function updateComment(commentId: string, content: string): Promise<Comment> {
  if (IS_MOCK) return mockPosts.updateComment(commentId, content)
  return authedRequest<Comment>(`/api/v1/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deleteComment(commentId: string): Promise<void> {
  if (IS_MOCK) return mockPosts.deleteComment(commentId)
  return authedRequest<void>(`/api/v1/comments/${commentId}`, { method: 'DELETE' })
}
