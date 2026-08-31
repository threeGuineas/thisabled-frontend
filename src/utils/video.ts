export const MAX_VIDEO_BYTES = 200 * 1024 * 1024
export const MAX_VIDEO_DURATION_SECONDS = 180
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime']

// 파일을 실제로 업로드하기 전에 브라우저에서 영상 길이를 미리 읽어온다(서버 3분 제한 사전 검증용)
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src)
      resolve(video.duration)
    }
    video.onerror = () => {
      URL.revokeObjectURL(video.src)
      reject(new Error('영상 정보를 읽을 수 없어요.'))
    }
    video.src = URL.createObjectURL(file)
  })
}
