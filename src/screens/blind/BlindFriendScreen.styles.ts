import typography from '../../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col pb-24',

  header: 'flex items-center justify-between px-6 pt-7 pb-4',
  headerTitle: ['text-white', typography['3xl'], typography.bold].join(' '),
  searchIconWrapper: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center',
  searchIcon: 'w-6 h-6',

  // 친구 목록 / 친구 요청 전환 탭
  segmentRow: 'flex mx-6 mb-6 bg-[#111111] rounded-2xl p-1.5 gap-1',
  segmentButtonActive: ['flex-1 rounded-xl py-3.5 text-center bg-[#FFD60A] text-black', typography.base, typography.bold].join(' '),
  segmentButtonInactive: ['flex-1 rounded-xl py-3.5 text-center text-white/50', typography.base, typography.semibold].join(' '),

  // 친구 추천
  recommendSection: 'mb-6',
  recommendTitle: ['block px-6 mb-3 text-white', typography.lg, typography.bold].join(' '),
  recommendScrollArea: 'overflow-x-auto scrollbar-hide px-6',
  recommendInner: 'flex gap-3 w-max',
  recommendCard: 'w-40 flex-shrink-0 rounded-2xl border border-[#FFD60A] bg-[#111111] p-4 flex flex-col items-center gap-2.5',
  recommendProfile: 'flex flex-col items-center gap-1 w-full',
  recommendAvatar: 'w-16 h-16 rounded-full object-cover',
  recommendNickname: ['w-full text-center truncate text-white', typography.sm, typography.semibold].join(' '),
  recommendBio: ['w-full text-center text-white/60 line-clamp-2', typography.xs, typography.regular].join(' '),
  recommendActions: 'mt-auto flex flex-col items-center gap-1.5 w-full',
  recommendReasonList: 'flex flex-col items-center gap-0.5 w-full',
  recommendReason: ['inline-flex max-w-full items-center gap-1 text-white/45 truncate', typography.xs, typography.medium].join(' '),
  recommendReasonDot: 'w-1.5 h-1.5 rounded-full flex-shrink-0 bg-[#FFD60A]',
  recommendAddButton: 'w-full flex items-center justify-center gap-1.5 bg-[#FFD60A] rounded-full py-2.5 disabled:opacity-40',
  recommendAddIcon: 'w-3.5 h-3.5',
  recommendAddText: ['text-black', typography.xs, typography.bold].join(' '),

  // 친구 목록
  listTitle: ['block px-6 mb-3 text-white', typography.base, typography.bold].join(' '),
  friendList: 'flex flex-col px-4 gap-2',
  friendItem: 'flex items-center gap-3 bg-[#111111] rounded-2xl px-4 py-4 w-full',
  friendAvatarButton: 'flex-shrink-0',
  friendAvatar: 'w-14 h-14 rounded-full object-cover flex-shrink-0',
  friendInfo: 'flex-1 min-w-0 flex flex-col gap-1',
  friendNickname: ['text-white truncate block', typography.base, typography.semibold].join(' '),
  friendActions: 'flex flex-col items-end gap-1.5 flex-shrink-0',
  chatButton: 'flex items-center gap-1.5 bg-[#FFD60A] rounded-full px-4 py-3 flex-shrink-0',
  chatButtonText: ['text-black', typography.xs, typography.bold].join(' '),

  // 친구 요청
  requestBoxRow: 'flex mx-6 mb-4 bg-[#111111] rounded-2xl p-1.5 gap-1',
  requestBoxButtonActive: ['flex-1 rounded-xl py-2.5 text-center bg-[#FFD60A] text-black', typography.sm, typography.bold].join(' '),
  requestBoxButtonInactive: ['flex-1 rounded-xl py-2.5 text-center text-white/50', typography.sm, typography.semibold].join(' '),
  requestList: 'flex flex-col px-4 gap-3',
  requestItem: 'flex flex-col gap-3 bg-[#111111] rounded-2xl px-4 py-4 w-full',
  requestTop: 'flex items-center gap-3',
  requestActions: 'flex gap-2',
  acceptButton: ['flex-1 bg-[#FFD60A] rounded-xl py-3 text-center text-black', typography.sm, typography.bold].join(' '),
  declineButton: ['flex-1 border border-[#FFD60A] rounded-xl py-3 text-center text-[#FFD60A]', typography.sm, typography.semibold].join(' '),
  cancelButton: ['w-full border border-[#FFD60A] rounded-xl py-3 text-center text-[#FFD60A]', typography.sm, typography.semibold].join(' '),

  emptyState: 'flex flex-1 flex-col items-center justify-center gap-4 py-20 px-6',
  emptyText: ['text-white/50 text-center', typography.sm, typography.regular].join(' '),
  retryButton: ['rounded-xl bg-[#1F1F1F] px-5 py-3 text-white', typography.sm, typography.regular].join(' '),

  // 친구 요청 수락/거절 확인 팝업
  confirmOverlay: 'fixed inset-0 bg-black/70 z-40',
  confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] rounded-t-3xl px-6 pt-6 pb-10',
  confirmText: ['text-white text-center', typography.base, typography.bold].join(' '),
  confirmErrorText: ['mt-2 text-red-400 text-center', typography.xs, typography.regular].join(' '),
  confirmButtons: 'flex items-center gap-3 mt-5',
  confirmNoButton: [
    'flex-1 py-4 rounded-2xl border border-[#444444]',
    'flex items-center justify-center',
    'text-white active:opacity-70',
    typography.base, typography.medium,
  ].join(' '),
  confirmYesButton: [
    'flex-1 py-4 rounded-2xl bg-[#FFD60A]',
    'flex items-center justify-center',
    'text-black active:opacity-80',
    typography.base, typography.bold,
  ].join(' '),
}

export default styles
