import { authedRequest } from './auth'

export interface MediaUploadItem {
  media_id: string
  url: string
}

export interface MediaUploadResponse {
  items: MediaUploadItem[]
}

// 인증 필요, multipart/form-data, 'files' 필드. 게시물용 공용 업로드 API지만 프로필 이미지는 1장만 사용.
export function uploadImages(files: File[]): Promise<MediaUploadResponse> {
  const formData = new FormData()
  files.forEach((file) => formData.append('files', file))
  return authedRequest<MediaUploadResponse>('/api/v1/media/images', { method: 'POST', body: formData })
}
