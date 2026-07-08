import { authedRequest, IS_MOCK } from './auth'

export interface MediaUploadItem {
  media_id: string
  url: string
}

export interface MediaUploadResponse {
  items: MediaUploadItem[]
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const mockMedia = {
  async uploadImages(): Promise<MediaUploadResponse> {
    await sleep(600)
    return { items: [{ media_id: crypto.randomUUID(), url: '/uploads/mock-profile.jpg' }] }
  },
}

// 인증 필요, multipart/form-data, 'files' 필드. 게시물용 공용 업로드 API지만 프로필 이미지는 1장만 사용.
export function uploadImages(files: File[]): Promise<MediaUploadResponse> {
  if (IS_MOCK) return mockMedia.uploadImages()
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return authedRequest<MediaUploadResponse>('/api/v1/media/images', { method: 'POST', body: formData })
}
