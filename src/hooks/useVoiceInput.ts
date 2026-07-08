import { useCallback, useEffect, useRef, useState } from 'react'
import { transcribeAudio } from '../services/voice'

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'error'

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    // speak()를 setTimeout 등으로 지연시키면 iOS Safari 등에서 사용자 제스처 컨텍스트가
    // 끊겨 음성이 아예 재생되지 않으므로, 반드시 호출 스택 내에서 동기적으로 speak()한다.
    if (speechSynthesis.speaking || speechSynthesis.pending) {
      speechSynthesis.cancel()
    }
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'ko-KR'
    // Chrome의 onend 미발화 버그 대비 타임아웃 fallback
    const timer = setTimeout(resolve, 3000)
    utterance.onend = () => { clearTimeout(timer); resolve() }
    utterance.onerror = () => { clearTimeout(timer); resolve() }
    speechSynthesis.speak(utterance)
  })
}

function vibrate(pattern: number | number[]) {
  navigator.vibrate?.(pattern)
}

export function useVoiceInput(onResult: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const onResultRef = useRef(onResult)
  useEffect(() => { onResultRef.current = onResult }, [onResult])

  useEffect(() => () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    speechSynthesis.cancel()
  }, [])

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const startRecording = useCallback(async () => {
    setVoiceError(null)

    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = '마이크를 사용하려면 HTTPS 환경이 필요해요.'
      setVoiceError(msg)
      setVoiceState('error')
      speak('보안 연결이 필요합니다.')
      return
    }

    let stream: MediaStream
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (e) {
      const isDenied = e instanceof DOMException && (e.name === 'NotAllowedError' || e.name === 'PermissionDeniedError')
      const msg = isDenied
        ? '마이크 권한이 거부됐어요. 브라우저 자물쇠 아이콘에서 허용해주세요.'
        : '마이크를 사용할 수 없어요. 연결된 마이크를 확인해주세요.'
      setVoiceError(msg)
      setVoiceState('error')
      speak(isDenied ? '마이크 권한이 필요합니다.' : '마이크를 사용할 수 없습니다.')
      return
    }

    streamRef.current = stream
    chunksRef.current = []
    vibrate(200)
    setVoiceState('recording')

    await speak('내용을 말해주세요.')

    const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
    const recorder = new MediaRecorder(stream, { mimeType })
    recorderRef.current = recorder

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      const blob = new Blob(chunksRef.current, { type: mimeType })
      chunksRef.current = []

      setVoiceState('transcribing')
      try {
        const text = await transcribeAudio(blob)
        if (text) {
          onResultRef.current(text)
          setVoiceState('idle')
        } else {
          setVoiceError('음성이 감지되지 않았어요. 다시 시도해주세요.')
          setVoiceState('error')
          speak('음성을 인식하지 못했습니다. 다시 시도해 주세요.')
        }
      } catch (e) {
        console.error('[voice] transcribe failed', e)
        setVoiceError('음성 인식에 실패했어요. 다시 시도해주세요.')
        setVoiceState('error')
        speak('음성 인식에 실패했습니다. 다시 시도해 주세요.')
      }
    }

    recorder.start()
  }, [])

  const toggleRecording = useCallback(() => {
    if (voiceState === 'recording') {
      stopRecording()
      vibrate([200, 100, 200])
      speak('잠시만 기다려주세요.')
    } else if (voiceState === 'idle' || voiceState === 'error') {
      startRecording()
    }
  }, [voiceState, startRecording, stopRecording])

  return { voiceState, voiceError, toggleRecording, stopRecording }
}
