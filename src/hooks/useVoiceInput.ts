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

// 무음이 이 시간(ms) 이상 지속되면 자동으로 녹음을 종료한다.
const SILENCE_DURATION_MS = 4000
// AnalyserNode의 RMS 볼륨(0~1)이 이 값 미만이면 무음으로 판단한다.
const SILENCE_RMS_THRESHOLD = 0.02

export function useVoiceInput(onResult: (text: string) => void) {
  const [voiceState, setVoiceState] = useState<VoiceState>('idle')
  const [voiceError, setVoiceError] = useState<string | null>(null)

  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)
  const onResultRef = useRef(onResult)
  useEffect(() => { onResultRef.current = onResult }, [onResult])

  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const silenceRafRef = useRef<number | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const hasSpokenRef = useRef(false)

  const stopRecording = useCallback(() => {
    recorderRef.current?.stop()
  }, [])

  const stopSilenceDetection = useCallback(() => {
    if (silenceRafRef.current !== null) {
      cancelAnimationFrame(silenceRafRef.current)
      silenceRafRef.current = null
    }
    analyserRef.current = null
    silenceStartRef.current = null
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {})
      audioContextRef.current = null
    }
  }, [])

  const monitorSilence = useCallback(() => {
    const analyser = analyserRef.current
    if (!analyser) return

    const data = new Uint8Array(analyser.fftSize)
    analyser.getByteTimeDomainData(data)
    let sumSquares = 0
    for (let i = 0; i < data.length; i++) {
      const normalized = (data[i] - 128) / 128
      sumSquares += normalized * normalized
    }
    const rms = Math.sqrt(sumSquares / data.length)

    const now = performance.now()
    if (rms > SILENCE_RMS_THRESHOLD) {
      hasSpokenRef.current = true
      silenceStartRef.current = null
    } else if (hasSpokenRef.current) {
      // 안내 음성 직후 사용자가 말을 시작하기 전까지는 무음으로 잘리지 않도록,
      // 한 번이라도 발화가 감지된 뒤부터만 무음 타이머를 센다.
      if (silenceStartRef.current === null) {
        silenceStartRef.current = now
      } else if (now - silenceStartRef.current >= SILENCE_DURATION_MS) {
        stopRecording()
        return
      }
    }
    silenceRafRef.current = requestAnimationFrame(monitorSilence)
  }, [stopRecording])

  const startSilenceDetection = useCallback((stream: MediaStream) => {
    try {
      const AudioContextCtor = window.AudioContext ?? (window as any).webkitAudioContext
      const audioContext = new AudioContextCtor()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)

      audioContextRef.current = audioContext
      analyserRef.current = analyser
      silenceStartRef.current = null
      hasSpokenRef.current = false
      monitorSilence()
    } catch (e) {
      // 무음 감지가 불가능해도 녹음 자체는 계속 진행하고, 수동 종료로 폴백한다.
      console.error('[voice] silence detection unavailable', e)
    }
  }, [monitorSilence])

  useEffect(() => () => {
    recorderRef.current?.stop()
    streamRef.current?.getTracks().forEach(t => t.stop())
    stopSilenceDetection()
    window.speechSynthesis?.cancel()
  }, [stopSilenceDetection])

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
      stopSilenceDetection()
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
    startSilenceDetection(stream)
  }, [startSilenceDetection])

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
