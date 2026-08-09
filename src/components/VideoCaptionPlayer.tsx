import { useEffect, useRef, useState } from 'react'
import { segmentsToVtt } from '../utils/vtt'
import { resolveImageUrl } from '../utils/avatar'
import { getPost, type PostMediaItem } from '../services/posts'
import { getCaptionPreferences, subscribeCaptionPreferences, type CaptionPreferences } from '../utils/captionPreferences'
import errorIcon from '../assets/images/error.svg'
import duringIcon from '../assets/images/during.svg'
import retryIcon from '../assets/images/retry.svg'
import checkIcon from '../assets/images/check-green.svg'

interface Props {
  postId: string
  media: PostMediaItem
}

const CAPTION_FONT_SIZE: Record<CaptionPreferences['size'], string> = {
  small: '100%',
  medium: '150%',
  large: '200%',
}

const CAPTION_TEXT_COLOR: Record<CaptionPreferences['color'], string> = {
  black: '#000000',
  white: '#FFFFFF',
  yellow: '#FFD60A',
}

// 검정 글자는 기본 반투명 검정 배경 위에서 보이지 않으므로, 글자색에 맞춰 배경 대비를 맞춘다.
const CAPTION_BG_COLOR: Record<CaptionPreferences['color'], string> = {
  black: 'rgba(255, 255, 255, 0.85)',
  white: 'rgba(0, 0, 0, 0.75)',
  yellow: 'rgba(0, 0, 0, 0.75)',
}

// CAPTION-01: 게시물 영상은 게시(publish) 시점에 자막 생성이 이미 끝나 있어야 하므로
// (processing 상태면 게시 자체가 막힘) 여기서는 폴링 없이 media.caption_status를 그대로 반영한다.
// 다시 시도는 별도 재생성 API가 없어 게시물을 재조회해 최신 상태를 다시 보여주는 방식으로 동작한다.
export default function VideoCaptionPlayer({ postId, media }: Props) {
  const [status, setStatus] = useState(media.caption_status)
  const [caption, setCaption] = useState(media.caption)
  const [isRetrying, setIsRetrying] = useState(false)
  const [showCaptions, setShowCaptions] = useState(false)
  const [vttUrl, setVttUrl] = useState<string | null>(null)
  const [captionPrefs, setCaptionPrefs] = useState(getCaptionPreferences)
  const trackRef = useRef<HTMLTrackElement>(null)

  // 마이페이지의 자막 크기·색상 설정이 바뀌면 이미 재생 중인 영상의 자막에도 바로 반영한다.
  useEffect(() => subscribeCaptionPreferences(setCaptionPrefs), [])

  useEffect(() => {
    if (status !== 'done' || !caption) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 캡션 없음/실패 상태로 전환 시 이전 blob URL 해제
      setVttUrl(null)
      return
    }
    const url = URL.createObjectURL(new Blob([segmentsToVtt(caption)], { type: 'text/vtt' }))
    setVttUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [caption, status])

  useEffect(() => {
    if (trackRef.current) trackRef.current.track.mode = showCaptions ? 'showing' : 'hidden'
  }, [showCaptions, vttUrl])

  // 마이페이지에서 영상 자막 표시를 꺼두면 이 영상의 자막 버튼도 노출하지 않고, 켜져 있던 자막도 함께 끈다.
  useEffect(() => {
    if (!captionPrefs.enabled) setShowCaptions(false)
  }, [captionPrefs.enabled])

  const handleRetry = async () => {
    if (isRetrying) return
    setIsRetrying(true)
    try {
      const refreshed = await getPost(postId)
      const updated = refreshed.media.find((m) => m.id === media.id)
      if (updated) {
        setStatus(updated.caption_status)
        setCaption(updated.caption)
      }
    } catch {
      // 재조회 실패 시 상태를 유지하고 버튼으로 다시 시도할 수 있게 둔다
    } finally {
      setIsRetrying(false)
    }
  }

  const isReady = status === 'done' && !!vttUrl
  const toggleLabel = showCaptions ? '자막 끄기' : '자막 켜기'
  const cueScopeClass = `caption-cue-${media.id}`

  // 자막 토글 버튼은 <video controls>의 네이티브 컨트롤 바(재생/음량/전체화면 등)와 같은 자리에
  // absolute로 겹치면 브라우저 네이티브 UI에 가려지거나 클릭이 씹히므로, 영상 아래 별도 바에 둔다.
  return (
    <div className="w-full rounded-2xl overflow-hidden">
      {/* 네이티브 <track> 자막(::cue)은 Tailwind 클래스로 스타일링할 수 없어, 마이페이지에서
          고른 자막 크기·색상을 이 영상에만 적용되도록 스코프를 잡아 인라인 스타일 태그로 주입한다. */}
      <style>{`
        video.${cueScopeClass}::cue {
          font-size: ${CAPTION_FONT_SIZE[captionPrefs.size]};
          color: ${CAPTION_TEXT_COLOR[captionPrefs.color]};
          background-color: ${CAPTION_BG_COLOR[captionPrefs.color]};
        }
      `}</style>
      <video src={resolveImageUrl(media.url)} controls className={`w-full block bg-black ${cueScopeClass}`}>
        {vttUrl && <track ref={trackRef} kind="subtitles" srcLang="ko" label="한국어" src={vttUrl} />}
      </video>

      {captionPrefs.enabled && (
        <div className="flex items-center justify-between gap-2 bg-[#F7F7F9] px-3 py-2">
          {status === 'processing' && (
            <span className="flex items-center gap-1.5 text-xs text-[#F5A623]">
              <img src={duringIcon} alt="" className="w-3 h-3" />
              자막을 생성하고 있어요
            </span>
          )}
          {status === 'failed' && (
            <span className="flex items-center gap-1.5 text-xs text-[#E64545]">
              <img src={errorIcon} alt="" className="w-3 h-3" />
              자막을 생성하지 못했어요
            </span>
          )}
          {status === 'done' && (
            <span className="flex items-center gap-1.5 text-xs text-[#34D27A]">
              <img src={checkIcon} alt="" className="w-3.5 h-3.5" />
              자막 생성을 완료했어요.
            </span>
          )}

          {status === 'failed' ? (
            <button
              type="button"
              onClick={handleRetry}
              disabled={isRetrying}
              className="ml-auto flex items-center gap-1.5 rounded-full bg-[#E64545] px-3 py-1.5 text-white text-xs flex-shrink-0 disabled:opacity-60"
            >
              <img src={retryIcon} alt="" className="w-3 h-3" />
              {isRetrying ? '다시 시도 중...' : '다시 시도'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowCaptions((prev) => !prev)}
              disabled={!isReady}
              aria-label={toggleLabel}
              aria-pressed={showCaptions}
              title={toggleLabel}
              className={[
                'ml-auto w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
                'transition-colors disabled:opacity-40',
                showCaptions ? 'bg-[#FFD60A]' : 'bg-white shadow-sm active:bg-[#EDEDF2]',
              ].join(' ')}
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className={`w-5 h-5 ${showCaptions ? 'text-black' : 'text-[#5A5A66]'}`}
                aria-hidden="true"
              >
                <rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" strokeWidth="1.8" />
                <path d="M7 10.5h4M7 13.5h7M13.5 10.5h3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
