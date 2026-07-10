import typography from '../styles/typography'

const styles = {
  overlay: 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6',
  modal: 'w-full max-w-sm bg-[#1A1A1A] rounded-3xl px-6 pt-6 pb-7 relative',
  closeButton: 'absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white/60 text-lg leading-none',

  avatarWrapper: 'flex flex-col items-center pt-3',
  avatar: 'w-24 h-24 rounded-full object-cover',
  nickname: ['mt-4 text-white text-center', typography.xl, typography.bold].join(' '),
  bio: ['mt-2 text-white/60 text-center', typography.sm, typography.regular].join(' '),

  actions: 'flex flex-col gap-2.5 mt-7',
  requestButton: ['w-full py-4 rounded-2xl bg-[#FFD60A] text-center text-black active:opacity-80', typography.base, typography.bold].join(' '),
  requestButtonSent: ['w-full py-4 rounded-2xl bg-[#2A2A2A] text-center text-white/40', typography.base, typography.bold].join(' '),
  messageButton: ['w-full py-4 rounded-2xl border border-[#FFD60A] text-center text-[#FFD60A] active:opacity-70', typography.base, typography.bold].join(' '),
  blockButton: ['w-full py-3 text-center text-white/40 active:opacity-70', typography.sm, typography.medium].join(' '),

  // 차단 확인 단계
  confirmText: ['text-white text-center px-1', typography.base, typography.semibold].join(' '),
  confirmSubText: ['mt-2 text-white/50 text-center', typography.sm, typography.regular].join(' '),
  confirmButtons: 'flex items-center gap-3 mt-6',
  confirmNoButton: [
    'flex-1 py-4 rounded-2xl border border-[#444444]',
    'flex items-center justify-center',
    'text-white active:opacity-70',
    typography.base, typography.medium,
  ].join(' '),
  confirmYesButton: [
    'flex-1 py-4 rounded-2xl bg-[#E5484D]',
    'flex items-center justify-center',
    'text-white active:opacity-80',
    typography.base, typography.bold,
  ].join(' '),
}

export default styles
