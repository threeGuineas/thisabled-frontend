import typography from '../../styles/typography'
import colors from '../../styles/colors'

// 발달장애 모드 전용 채팅 목록 스타일 — DevHomeScreen/DevMyScreen과 같은 톤(민트 배경, 흰 카드, 큰 글자)
const styles = {
  container: 'min-h-screen bg-[#F4FBF7] flex flex-col pb-28',

  header: 'px-6 pt-8 pb-4',
  headerTitle: [typography['3xl'], typography.extrabold, 'text-black'].join(' '),

  requestBanner: [
    colors.bg.white, 'flex items-center justify-between mx-6 mb-5 px-5 py-5 rounded-3xl shadow-sm active:opacity-80',
  ].join(' '),
  requestBannerLeft: 'flex items-center gap-2.5',
  requestBannerText: [typography.lg, typography.bold, 'text-black'].join(' '),
  requestBadge: [colors.bg.green, 'min-w-[26px] h-[26px] px-2 rounded-full flex items-center justify-center text-white', typography.sm, typography.bold].join(' '),
  requestBannerChevron: 'text-[#B3B3BD] text-2xl leading-none',

  subHeader: 'flex items-center gap-2 px-4 py-4',
  backButton: 'w-11 h-11 -ml-1 rounded-full flex items-center justify-center active:bg-white',
  backIcon: 'w-6 h-6',
  subHeaderTitle: [typography.lg, typography.bold, 'text-black'].join(' '),

  chatList: 'flex flex-col px-6 gap-3',
  chatItem: [colors.bg.white, 'flex items-center gap-4 w-full text-left rounded-3xl shadow-sm px-5 py-4 active:opacity-90'].join(' '),
  avatarWrapper: 'relative flex-shrink-0',
  avatar: ['w-14 h-14 rounded-full object-cover', colors.bg.gray04].join(' '),

  chatContent: 'flex-1 min-w-0 flex flex-col gap-1',
  chatTopRow: 'flex items-center justify-between gap-2',
  chatNickname: ['text-black truncate', typography.lg, typography.bold].join(' '),
  chatMetaRow: 'flex items-center gap-1.5 flex-shrink-0',
  restrictedText: [typography.sm, typography.medium, 'text-red-400'].join(' '),

  chatRight: 'flex flex-col items-end gap-1.5 flex-shrink-0',
  chatTime: ['text-[#9898A8]', typography.sm, typography.regular].join(' '),
  unreadBadge: [colors.bg.green, 'min-w-[24px] h-6 px-2 rounded-full flex items-center justify-center text-white', typography.sm, typography.bold].join(' '),

  emptyState: 'flex flex-1 flex-col items-center justify-center gap-4 py-20 px-6 text-center',
  emptyText: [typography.lg, typography.medium, 'text-[#8E8E93]'].join(' '),
  retryButton: [colors.bg.white, 'rounded-2xl px-6 py-4 text-black shadow-sm', typography.base, typography.bold].join(' '),

  requestList: 'flex flex-col px-6 gap-4',
  requestItem: [colors.bg.white, 'flex flex-col gap-3 rounded-3xl px-5 py-5 w-full shadow-sm'].join(' '),
  requestTop: 'flex items-center gap-3',
  requestInfo: 'flex-1 min-w-0 flex flex-col gap-1',
  requestNickname: ['text-black truncate block', typography.lg, typography.bold].join(' '),
  requestTime: ['text-[#9898A8]', typography.sm, typography.regular].join(' '),
  requestPreviewText: ['text-[#4A4A4A] leading-relaxed', typography.base, typography.regular].join(' '),
  requestPreviewBlurred: ['flex items-center justify-between gap-3 rounded-2xl px-4 py-3', colors.bg.gray04].join(' '),
  requestPreviewBlurredText: ['text-[#9898A8]', typography.base, typography.regular].join(' '),
  requestRevealButton: ['flex-shrink-0 rounded-full border-2 px-4 py-2 text-black disabled:opacity-40', colors.border.green, typography.sm, typography.bold].join(' '),
  requestActions: 'flex items-center gap-2',
  acceptButton: [colors.bg.green, 'flex-1 rounded-2xl px-4 py-4 text-center text-white disabled:opacity-40', typography.base, typography.bold].join(' '),
  requestBlockButton: [typography.sm, typography.bold, 'flex-shrink-0 rounded-2xl border border-red-300 px-4 py-4 text-center text-red-500'].join(' '),

  errorBanner: 'mx-6 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3',
  errorBannerText: ['flex-1 text-red-500', typography.sm, typography.regular].join(' '),
  errorBannerClose: 'flex-shrink-0 text-red-400',

  confirmOverlay: 'fixed inset-0 bg-black/40 z-40',
  confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl',
  confirmText: [typography.lg, typography.bold, 'text-black text-center'].join(' '),
  confirmErrorText: [typography.sm, typography.regular, 'mt-2 text-red-500 text-center'].join(' '),
  confirmButtons: 'flex items-center gap-3 mt-5',
  confirmNoButton: [
    'flex-1 py-4 rounded-2xl border', colors.border.gray03,
    'flex items-center justify-center text-black active:opacity-70',
    typography.base, typography.medium,
  ].join(' '),
  confirmYesButton: [
    'flex-1 py-4 rounded-2xl bg-red-500',
    'flex items-center justify-center text-white active:opacity-80',
    typography.base, typography.bold,
  ].join(' '),
}

export default styles
