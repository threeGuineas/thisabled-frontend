import { authedRequest } from './auth'
import { type CaptionSegment } from '../utils/vtt'

export interface Author {
  id: string | null
  nickname: string
  profile_image_url: string | null
}

export type AiStatus = 'none' | 'processing' | 'done' | 'failed'
export type DescriptionStatus = AiStatus

// POST-01 — 게시물 단일 카테고리 5종 (백엔드 PostCategory enum과 동일해야 함)
export type PostCategory = 'daily' | 'info' | 'hobby' | 'concern' | 'meetup'

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
  category: PostCategory | null
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

export async function uploadImages(files: File[]): Promise<UploadedMedia[]> {
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
  const formData = new FormData()
  formData.append('file', file)
  formData.append('duration_seconds', String(durationSeconds))
  return authedRequest<UploadedVideo>('/api/v1/media/videos', { method: 'POST', body: formData })
}

export async function createPost(category: PostCategory, content: string, mediaIds: string[] = []): Promise<Post> {
  return authedRequest<Post>('/api/v1/posts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, content, media_ids: mediaIds }),
  })
}

// 영상 드래프트(processing 상태 Post)의 본문을 채운다 — POST /media/videos, POST .../publish
// 어느 쪽도 content를 받지 않으므로, 텍스트는 이 PATCH로 드래프트에 미리 채워둬야 한다.
export async function updatePost(postId: string, content: string): Promise<Post> {
  return authedRequest<Post>(`/api/v1/posts/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function getCaptionStatus(postId: string): Promise<{ caption_status: AiStatus }> {
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

// 자막 생성이 failed로 끝난 뒤 재시도를 트리거한다. 성공하면 caption_status가 다시 processing으로
// 바뀌므로 호출부는 waitForCaptionReady로 이어서 폴링해야 한다.
export async function retryCaption(postId: string): Promise<{ caption_status: AiStatus }> {
  return authedRequest<{ caption_status: AiStatus }>(`/api/v1/posts/${postId}/caption/retry`, {
    method: 'POST',
  })
}

// 영상 드래프트를 실제로 공개한다. 자막이 failed 상태면 서버가 400으로 막으며, 사용자가
// "자막 없이 게시"를 명시적으로 선택했을 때만 allowNoCaption=true로 우회할 수 있다(CAPTION-01 정책).
// category·content는 업로드 시점엔 받지 않으므로 게시 확정 시점에 함께 보내야 한다.
export async function publishPost(postId: string, category: PostCategory, content: string, allowNoCaption = false): Promise<Post> {
  return authedRequest<Post>(`/api/v1/posts/${postId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category, content, allow_no_caption: allowNoCaption }),
  })
}

export async function getFeed(cursor: string | null = null, limit = 20): Promise<FeedPage> {
  const params = new URLSearchParams({ limit: String(limit) })
  if (cursor) params.set('cursor', cursor)
  return authedRequest<FeedPage>(`/api/v1/feed?${params}`)
}

// 사진 설명(VISION-01)은 전용 폴링 API가 없으므로 게시물 상세를 재조회해 description_status 변화를 확인한다.
export async function getPost(postId: string): Promise<Post> {
  return authedRequest<Post>(`/api/v1/posts/${postId}`)
}

// 백엔드는 영상 업로드 시점(POST /media/videos)에 자막 생성을 자동으로 시작하므로 별도의
// 수동 생성 API가 없다 — 피드 영상은 항상 done/failed 상태다. 호출부 호환을 위해 게시물을
// 재조회해 최신 상태만 돌려준다.
export async function requestCaptionGeneration(postId: string): Promise<Post> {
  return getPost(postId)
}

export async function likePost(postId: string): Promise<LikeResult> {
  return authedRequest<LikeResult>(`/api/v1/posts/${postId}/like`, { method: 'POST' })
}

export async function unlikePost(postId: string): Promise<LikeResult> {
  return authedRequest<LikeResult>(`/api/v1/posts/${postId}/like`, { method: 'DELETE' })
}

export async function getComments(postId: string): Promise<CommentsPage> {
  return authedRequest<CommentsPage>(`/api/v1/posts/${postId}/comments`)
}

export async function createComment(postId: string, content: string): Promise<Comment> {
  return authedRequest<Comment>(`/api/v1/posts/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

// 댓글 작성자 본인만 가능 — 403/404는 호출부에서 detail 메시지로 처리
export async function updateComment(commentId: string, content: string): Promise<Comment> {
  return authedRequest<Comment>(`/api/v1/comments/${commentId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
}

export async function deleteComment(commentId: string): Promise<void> {
  return authedRequest<void>(`/api/v1/comments/${commentId}`, { method: 'DELETE' })
}
