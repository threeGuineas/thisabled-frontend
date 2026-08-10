export interface CaptionSegment {
  start: number
  end: number
  text: string
}

function formatVttTime(t: number): string {
  const h = Math.floor(t / 3600).toString().padStart(2, '0')
  const m = Math.floor((t % 3600) / 60).toString().padStart(2, '0')
  const s = (t % 60).toFixed(3).padStart(6, '0')
  return `${h}:${m}:${s}`
}

// CAPTION-01: 서버는 세그먼트 JSON만 주고 표준 자막 파일을 만들지 않으므로 <track>에 붙일 VTT는 클라이언트에서 변환한다.
export function segmentsToVtt(segments: CaptionSegment[]): string {
  const body = segments
    .map((seg) => `${formatVttTime(seg.start)} --> ${formatVttTime(seg.end)}\n${seg.text}`)
    .join('\n\n')
  return `WEBVTT\n\n${body}\n`
}
