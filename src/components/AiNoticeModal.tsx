import typography from '../styles/typography'
import colors from '../styles/colors'

interface Props {
  onConfirm: () => void
  onCancel: () => void
}

// COMM 기능 최초 사용 시 노출하는 외부 AI 전송 고지(§17.2) — "확인"을 눌러야 실제 기능이 실행된다.
export default function AiNoticeModal({ onConfirm, onCancel }: Props) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/40" onClick={onCancel} />
      <div className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-white px-6 pt-6 pb-8 shadow-2xl">
        <p className={[typography.lg, typography.bold, 'text-black text-center'].join(' ')}>
          AI에게 도움을 요청할까요?
        </p>
        <p className={[typography.base, typography.regular, 'mt-3 text-center leading-relaxed', colors.text.gray01].join(' ')}>
          입력한 문장이나 대화 내용 일부가 AI 서비스로 전달되어 처리돼요.
        </p>
        <div className="flex items-center gap-3 mt-6">
          <button
            type="button"
            onClick={onCancel}
            className={['flex-1 py-4 rounded-2xl border', colors.border.gray03, 'text-black active:opacity-70', typography.base, typography.medium].join(' ')}
          >
            아니오
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={['flex-1 py-4 rounded-2xl', colors.bg.green, 'text-white active:opacity-80', typography.base, typography.bold].join(' ')}
          >
            네, 도움받기
          </button>
        </div>
      </div>
    </>
  )
}
