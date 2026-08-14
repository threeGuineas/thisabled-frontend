import { useState } from 'react'
import { uploadVideo, updatePost, waitForCaptionReady, publishPost, retryCaption, type Post, type AiStatus } from '../services/posts'

type Phase = 'idle' | 'submitting' | 'waiting-caption' | 'caption-failed'

// waitForCaptionReady 한 번 호출은 약 30초(15회 × 2초) 폴링 후 processing이면 그대로 반환한다.
// 실제 자막 생성(AI)이 30초보다 오래 걸리는 경우가 흔해서, 사용자가 다시 게시 버튼을 누르게
// 하는 대신 이 총 대기 한도(3분) 안에서는 자동으로 폴링을 이어간다.
const MAX_CAPTION_WAIT_MS = 3 * 60 * 1000

// 영상 게시물은 텍스트/사진과 경로가 완전히 다르다(POST /media/videos가 자체적으로
// processing 드래프트 Post를 만들고, POST /posts/{id}/publish로 공개해야 한다 — POST /posts에
// 영상 media_id를 media_ids로 넣으면 400). 이 훅이 업로드→본문 채우기→자막 폴링→게시까지 묶는다.
// 실패 시 재시도가 같은 드래프트(postId)를 그대로 이어써야 하므로 postId를 훅 상태로 들고 있는다.
export function useVideoPost() {
  const [postId, setPostId] = useState<string | null>(null)
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const finishWithStatus = async (id: string, status: AiStatus, startedAt = Date.now()): Promise<Post | null> => {
    if (status === 'processing') {
      setPhase('waiting-caption')
      status = await waitForCaptionReady(id)
    }

    if (status === 'failed') {
      setPhase('caption-failed')
      return null
    }
    if (status === 'processing') {
      // 자막이 아직 안 끝났어도 총 대기 한도 안이면 사용자 재조작 없이 폴링을 계속한다.
      if (Date.now() - startedAt < MAX_CAPTION_WAIT_MS) {
        return await finishWithStatus(id, 'processing', startedAt)
      }
      setError('자막 생성이 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.')
      setPhase('idle')
      return null
    }

    const post = await publishPost(id, false)
    setPhase('idle')
    return post
  }

  const publish = async (file: File, durationSeconds: number, content: string): Promise<Post | null> => {
    setPhase('submitting')
    setError(null)
    try {
      if (postId) {
        // 자막 대기 타임아웃 뒤 재시도 — 같은 드래프트의 자막 상태만 다시 확인한다
        return await finishWithStatus(postId, 'processing')
      }
      const uploaded = await uploadVideo(file, durationSeconds)
      setPostId(uploaded.post_id)
      await updatePost(uploaded.post_id, content)
      return await finishWithStatus(uploaded.post_id, uploaded.caption_status)
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setError(e.detail ?? '게시에 실패했어요. 잠시 후 다시 시도해주세요.')
      setPhase('idle')
      return null
    }
  }

  // 자막 생성 실패(failed) 후 사용자가 재시도를 선택했을 때 호출한다. 백엔드 재시도 API로
  // 자막 생성을 다시 트리거한 뒤, 같은 폴링/자동 게시 경로(finishWithStatus)를 그대로 탄다.
  const retry = async (): Promise<Post | null> => {
    if (!postId) return null
    setPhase('waiting-caption')
    setError(null)
    try {
      await retryCaption(postId)
      return await finishWithStatus(postId, 'processing')
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setError(e.detail ?? '자막 재시도에 실패했어요. 잠시 후 다시 시도해주세요.')
      setPhase('caption-failed')
      return null
    }
  }

  const publishWithoutCaption = async (): Promise<Post | null> => {
    if (!postId) return null
    setPhase('submitting')
    setError(null)
    try {
      const post = await publishPost(postId, true)
      setPhase('idle')
      return post
    } catch (err: unknown) {
      const e = err as { detail?: string }
      setError(e.detail ?? '게시에 실패했어요. 잠시 후 다시 시도해주세요.')
      setPhase('idle')
      return null
    }
  }

  return { phase, error, publish, retry, publishWithoutCaption }
}
