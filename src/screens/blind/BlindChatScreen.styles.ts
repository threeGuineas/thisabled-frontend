import typography from '../../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col',

  header: 'flex items-center justify-between px-6 pt-7 pb-4',
  headerLeft: 'flex items-center gap-2',
  headerTitle: ['text-white', typography['3xl'], typography.bold].join(' '),
  badgeWrapper: 'w-6 h-6 rounded-full bg-[#FFD60A] flex items-center justify-center',
  badgeText: ['text-black', typography.xs, typography.bold].join(' '),
  searchIconWrapper: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center',
  searchIcon: 'w-6 h-6',

  // 전체 대화 / 받은 요청 전환 탭
  segmentRow: 'flex mx-6 mb-5 bg-[#111111] rounded-2xl p-1.5 gap-1',
  segmentButtonActive: ['flex-1 rounded-xl py-3.5 text-center bg-[#FFD60A] text-black', typography.base, typography.bold].join(' '),
  segmentButtonInactive: ['flex-1 rounded-xl py-3.5 text-center text-white/50', typography.base, typography.semibold].join(' '),

  chatList: 'flex flex-col px-4 gap-2',

  chatItem: 'flex items-start gap-3 bg-[#111111] rounded-2xl px-4 py-4 w-full text-left',
  avatarWrapper: 'relative flex-shrink-0',
  avatar: 'w-12 h-12 rounded-full object-cover',

  chatContent: 'flex-1 min-w-0',
  chatTopRow: 'flex items-center justify-between mb-1',
  chatNickname: ['text-white', typography.sm, typography.semibold].join(' '),
  chatTime: ['text-white/40', typography.xs, typography.regular].join(' '),
  chatBottomRow: 'flex items-center gap-3 mt-2',

  readRow: 'flex items-center gap-1 border border-[#2A2A2A] bg-[#1F1F1F] rounded-full px-2.5 py-1',
  readCheckIcon: 'w-3 h-3 flex-shrink-0',
  readText: ['text-[#8A8A8A]', typography.xs, typography.regular].join(' '),
  unreadRow: 'flex items-center gap-1 bg-[#FFD60A] rounded-full px-2.5 py-1',
  unreadDot: 'w-2 h-2 rounded-full bg-black flex-shrink-0',
  unreadText: ['text-black', typography.xs, typography.bold].join(' '),

  restrictedRow: 'flex items-center gap-1',
  restrictedDot: 'w-2 h-2 rounded-full bg-red-500 flex-shrink-0',
  restrictedText: ['text-red-400', typography.xs, typography.regular].join(' '),

  // 상대와의 방을 새로 만들 수 없을 때(차단·연령 보호 정책 등) 뜨는 알림 배너
  errorBanner: 'mx-6 mb-4 flex items-center justify-between gap-3 rounded-2xl bg-[#2A1414] px-4 py-3',
  errorBannerText: ['flex-1 text-red-300', typography.xs, typography.regular].join(' '),
  errorBannerClose: 'flex-shrink-0 text-red-300/70',

  // 받은 요청 목록
  requestList: 'flex flex-col px-4 gap-2',
  requestItem: 'flex flex-col gap-3 bg-[#111111] rounded-2xl px-4 py-4 w-full',
  requestTop: 'flex items-center gap-3',
  requestInfo: 'flex-1 min-w-0 flex flex-col gap-1',
  requestNickname: ['text-white truncate block', typography.sm, typography.semibold].join(' '),
  requestTime: ['text-white/40', typography.xs, typography.regular].join(' '),
  requestPreviewText: ['text-white/70 leading-relaxed', typography.sm, typography.regular].join(' '),
  requestPreviewBlurred: 'flex items-center justify-between gap-3 rounded-xl bg-[#1F1F1F] px-3 py-2.5',
  requestPreviewBlurredText: ['text-white/50 italic', typography.sm, typography.regular].join(' '),
  requestRevealButton: ['flex-shrink-0 rounded-full border border-[#FFD60A] px-3 py-1.5 text-[#FFD60A] disabled:opacity-40', typography.xs, typography.semibold].join(' '),
  requestActions: 'flex items-center gap-2',
  acceptButton: ['flex-1 bg-[#FFD60A] rounded-full px-4 py-3 text-center text-black disabled:opacity-40', typography.xs, typography.bold].join(' '),
  requestBlockButton: ['flex-shrink-0 rounded-full border border-red-400 px-4 py-3 text-center text-red-400', typography.xs, typography.bold].join(' '),

  emptyState: 'flex flex-1 flex-col items-center justify-center gap-4 py-20 px-6',
  emptyText: ['text-white/50 text-center', typography.sm, typography.regular].join(' '),
  retryButton: ['rounded-xl bg-[#1F1F1F] px-5 py-3 text-white', typography.sm, typography.regular].join(' '),

  // 차단 확인 팝업
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
    'flex-1 py-4 rounded-2xl bg-red-500',
    'flex items-center justify-center',
    'text-white active:opacity-80',
    typography.base, typography.bold,
  ].join(' '),
}

export default styles
