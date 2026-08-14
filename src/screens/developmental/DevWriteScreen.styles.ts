import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: 'min-h-screen bg-white flex flex-col',

  header: 'flex items-center gap-2 px-4 py-4 border-b border-[#F0F0F0]',
  backButton: 'w-11 h-11 -ml-1 rounded-full flex items-center justify-center active:bg-[#F4FBF7]',
  backIcon: 'w-6 h-6',
  headerTitle: [typography.lg, typography.bold, 'text-black'].join(' '),

  body: 'flex-1 flex flex-col gap-4 px-5 pt-5 pb-28',
  guideText: [typography.lg, typography.semibold, 'text-black'].join(' '),

  textarea: [
    'w-full min-h-[200px] resize-none outline-none text-black placeholder:text-[#B3B3BD]',
    typography.lg, typography.regular, 'leading-relaxed',
  ].join(' '),
  charCount: [typography.sm, typography.medium, 'text-[#B3B3BD] text-right'].join(' '),

  // COMM-02 문장 완성
  commmButton: [colors.bg.green01, 'flex items-center justify-center gap-2 rounded-2xl px-5 py-4 active:opacity-80 disabled:opacity-50'].join(' '),
  commmButtonText: [typography.base, typography.bold, colors.text.green].join(' '),
  commmSuggestionList: 'flex flex-col gap-2.5',
  commmSuggestionCard: [colors.bg.white, 'rounded-2xl border-2 px-4 py-3.5 text-left active:opacity-80'].join(' '),
  commmSuggestionText: [typography.base, typography.medium, 'text-black leading-relaxed'].join(' '),
  commmBadge: [typography.xs, typography.bold, colors.text.green].join(' '),
  commmErrorText: [typography.sm, typography.medium, 'text-red-500'].join(' '),

  // 사진/동영상 — 한 화면에서 한 장(또는 한 편)만 첨부(DEV-01 선택지 줄이기)
  attachRow: 'flex items-center gap-3',
  attachButton: [colors.bg.gray04, 'flex-1 flex flex-col items-center justify-center gap-2 rounded-2xl py-5 active:opacity-80 disabled:opacity-50'].join(' '),
  attachButtonText: [typography.base, typography.semibold, 'text-black'].join(' '),
  attachIcon: 'w-7 h-7',

  photoPreviewWrapper: 'relative w-full',
  photoPreviewImg: ['w-full max-h-72 rounded-2xl object-cover', colors.bg.gray04].join(' '),
  videoPreviewWrapper: 'relative w-full',
  videoPreviewVideo: 'w-full max-h-72 rounded-2xl bg-black',
  mediaRemoveButton: [
    'absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 text-white flex items-center justify-center',
    typography.base,
  ].join(' '),
  mediaLoadingText: [typography.sm, typography.medium, colors.text.gray01].join(' '),

  errorText: [typography.sm, typography.medium, 'text-red-500 text-center'].join(' '),

  footer: 'fixed bottom-0 left-0 right-0 bg-white border-t border-[#F0F0F0] px-5 py-4',
  nextButtonActive: [colors.bg.green, 'w-full py-5 rounded-2xl flex items-center justify-center active:opacity-90'].join(' '),
  nextButtonInactive: [colors.bg.gray03, 'w-full py-5 rounded-2xl flex items-center justify-center'].join(' '),
  nextButtonTextActive: [typography.lg, typography.bold, 'text-white'].join(' '),
  nextButtonTextInactive: [typography.lg, typography.bold, 'text-[#B3B3BD]'].join(' '),
  retryButtonActive: [colors.border.green, 'w-full py-5 rounded-2xl border-2 flex items-center justify-center active:opacity-70 disabled:opacity-50'].join(' '),
  retryButtonTextActive: [typography.lg, typography.bold, colors.text.green].join(' '),

  // 확인(게시) 단계
  confirmBody: 'flex-1 flex flex-col gap-5 px-5 pt-6 pb-28',
  confirmTitle: [typography['2xl'], typography.extrabold, 'text-black text-center'].join(' '),
  confirmSubtitle: [typography.base, typography.medium, 'text-[#8E8E93] text-center'].join(' '),
  confirmPreviewCard: [colors.bg.gray04, 'rounded-3xl p-5 flex flex-col gap-4'].join(' '),
  confirmPreviewText: [typography.lg, typography.medium, 'text-black leading-relaxed whitespace-pre-wrap'].join(' '),
  confirmPreviewImage: 'w-full rounded-2xl object-cover',
  confirmPreviewVideo: 'w-full rounded-2xl bg-black',
}

export default styles
