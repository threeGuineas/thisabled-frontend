import typography from '../styles/typography'

const shared = {
  overlay: 'fixed inset-0 z-50 bg-black/70 flex items-center justify-center px-6',
  avatarWrapper: 'flex flex-col items-center pt-3',
  avatar: 'w-24 h-24 rounded-full object-cover',
  actions: 'flex flex-col gap-2.5 mt-7',
  confirmButtons: 'flex items-center gap-3 mt-6',
}

const styles = {
  blind: {
    ...shared,
    modal: 'w-full max-w-sm bg-[#1A1A1A] rounded-3xl px-6 pt-6 pb-7 relative',
    closeButton: 'absolute top-4 right-4 w-8 h-8 rounded-full bg-[#2A2A2A] flex items-center justify-center text-white/60 text-lg leading-none',

    nickname: ['mt-4 text-white text-center', typography.xl, typography.bold].join(' '),
    bio: ['mt-2 text-white/60 text-center', typography.sm, typography.regular].join(' '),

    requestButton: ['w-full py-4 rounded-2xl bg-[#FFD60A] text-center text-black active:opacity-80', typography.base, typography.bold].join(' '),
    requestButtonSent: ['w-full py-4 rounded-2xl bg-[#2A2A2A] text-center text-white/40', typography.base, typography.bold].join(' '),
    messageButton: ['w-full py-4 rounded-2xl border border-[#FFD60A] text-center text-[#FFD60A] active:opacity-70', typography.base, typography.bold].join(' '),
    blockButton: ['w-full py-3 text-center text-white/40 active:opacity-70', typography.sm, typography.medium].join(' '),

    confirmText: ['text-white text-center px-1', typography.base, typography.semibold].join(' '),
    confirmSubText: ['mt-2 text-white/50 text-center', typography.sm, typography.regular].join(' '),
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
  },
  default: {
    ...shared,
    modal: 'w-full max-w-sm bg-white rounded-3xl px-6 pt-6 pb-7 relative shadow-xl',
    closeButton: 'absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F7F9] flex items-center justify-center text-[#8E8E93] text-lg leading-none',

    nickname: ['mt-4 text-black text-center', typography.xl, typography.bold].join(' '),
    bio: ['mt-2 text-[#757575] text-center', typography.sm, typography.regular].join(' '),

    requestButton: ['w-full py-4 rounded-2xl bg-[#FFD60A] text-center text-black active:opacity-80', typography.base, typography.bold].join(' '),
    requestButtonSent: ['w-full py-4 rounded-2xl bg-[#F7F7F9] text-center text-[#9898A8]', typography.base, typography.bold].join(' '),
    messageButton: ['w-full py-4 rounded-2xl border border-[#FFD60A] text-center text-black active:opacity-70', typography.base, typography.bold].join(' '),
    blockButton: ['w-full py-3 text-center text-[#9898A8] active:opacity-70', typography.sm, typography.medium].join(' '),

    confirmText: ['text-black text-center px-1', typography.base, typography.semibold].join(' '),
    confirmSubText: ['mt-2 text-[#757575] text-center', typography.sm, typography.regular].join(' '),
    confirmNoButton: [
      'flex-1 py-4 rounded-2xl border border-[#EBEBEF]',
      'flex items-center justify-center',
      'text-black active:opacity-70',
      typography.base, typography.medium,
    ].join(' '),
    confirmYesButton: [
      'flex-1 py-4 rounded-2xl bg-[#E5484D]',
      'flex items-center justify-center',
      'text-white active:opacity-80',
      typography.base, typography.bold,
    ].join(' '),
  },
  // 발달장애 모드 — DEV-01 기준으로 글자를 키우고, 차단/친구 끊기 전 확인 문구를 더 크게 강조한다
  developmental: {
    ...shared,
    modal: 'w-full max-w-sm bg-white rounded-3xl px-6 pt-6 pb-7 relative shadow-xl',
    closeButton: 'absolute top-4 right-4 w-8 h-8 rounded-full bg-[#F7F7F9] flex items-center justify-center text-[#8E8E93] text-lg leading-none',

    nickname: ['mt-4 text-black text-center', typography['2xl'], typography.bold].join(' '),
    bio: ['mt-2 text-[#757575] text-center', typography.base, typography.regular].join(' '),

    requestButton: ['w-full py-5 rounded-2xl bg-[#22B07D] text-center text-white active:opacity-80', typography.lg, typography.bold].join(' '),
    requestButtonSent: ['w-full py-5 rounded-2xl bg-[#F7F7F9] text-center text-[#9898A8]', typography.lg, typography.bold].join(' '),
    messageButton: ['w-full py-5 rounded-2xl border-2 border-[#22B07D] text-center text-black active:opacity-70', typography.lg, typography.bold].join(' '),
    blockButton: ['w-full py-3 text-center text-[#9898A8] active:opacity-70', typography.base, typography.medium].join(' '),

    confirmText: ['text-black text-center px-1', typography.lg, typography.bold].join(' '),
    confirmSubText: ['mt-2 text-[#757575] text-center', typography.base, typography.regular].join(' '),
    confirmNoButton: [
      'flex-1 py-4 rounded-2xl border border-[#EBEBEF]',
      'flex items-center justify-center',
      'text-black active:opacity-70',
      typography.base, typography.medium,
    ].join(' '),
    confirmYesButton: [
      'flex-1 py-4 rounded-2xl bg-[#E5484D]',
      'flex items-center justify-center',
      'text-white active:opacity-80',
      typography.base, typography.bold,
    ].join(' '),
  },
}

export default styles
