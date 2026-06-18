import { useCallback, useEffect, useRef, useState } from 'react'

export type VoiceState = 'idle' | 'recording' | 'transcribing' | 'error'

type SpeechRecognitionCtor = new () => SpeechRecognition

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as Record<string, unknown>
  return (w['SpeechRecognition'] ?? w['webkitSpeechRecognition'] ?? null) as SpeechRecognitionCtor | null
}

function speak(text: string): Promise<void> {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) { resolve(); return }
    speechSynthesis.cancel()
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

  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const onResultRef = useRef(onResult)
  useEffect(() => { onResultRef.current = onResult }, [onResult])

  useEffect(() => () => {
    recognitionRef.current?.abort()
    speechSynthesis.cancel()
  }, [])

  const stopRecording = useCallback(() => {
    recognitionRef.current?.stop()
    recognitionRef.current = null
  }, [])

  const startRecording = useCallback(async () => {
    setVoiceError(null)

    const SpeechRecognitionClass = getSpeechRecognition()
    if (!SpeechRecognitionClass) {
      setVoiceError('이 브라우저는 음성 인식을 지원하지 않아요. Chrome을 사용해주세요.')
      setVoiceState('error')
      speak('이 브라우저는 음성 인식을 지원하지 않아요.')
      return
    }

    vibrate(200)
    setVoiceState('recording')

    // TTS가 끝나거나 3초 타임아웃 후 인식 시작
    await speak('내용을 말해주세요.')

    const recognition = new SpeechRecognitionClass()
    recognition.lang = 'ko-KR'
    recognition.continuous = true
    recognition.interimResults = false

    recognition.onresult = (e: SpeechRecognitionEvent) => {
      let transcript = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) transcript += e.results[i][0].transcript
      }
      if (transcript) onResultRef.current(transcript)
    }

    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      const msg = e.error === 'not-allowed'
        ? '마이크 권한이 거부됐어요. 브라우저 자물쇠 아이콘에서 허용해주세요.'
        : '음성이 감지되지 않았어요. 다시 시도해주세요.'
      setVoiceError(msg)
      setVoiceState('error')
      speak('음성을 인식하지 못했습니다. 다시 시도해 주세요.')
    }

    recognition.onend = () => {
      setVoiceState(prev => prev === 'recording' ? 'idle' : prev)
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [])

  const toggleRecording = useCallback(() => {
    if (voiceState === 'recording') {
      stopRecording()
      vibrate([200, 100, 200])
      speak('입력이 완료되었습니다.')
    } else if (voiceState === 'idle' || voiceState === 'error') {
      startRecording()
    }
  }, [voiceState, startRecording, stopRecording])

  return { voiceState, voiceError, toggleRecording, stopRecording }
}
