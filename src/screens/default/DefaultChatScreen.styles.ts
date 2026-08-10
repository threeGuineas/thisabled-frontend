import typography from '../../styles/typography'
import colors from '../../styles/colors'

export type ChatScreenTheme = 'default' | 'hearing'

export default function getStyles(theme: ChatScreenTheme = 'default') {
  const accentBg = theme === 'hearing' ? colors.bg.blue : colors.bg.yellow

  return {
    container: 'min-h-screen bg-[#F7F7F9] flex flex-col pb-24',

    header: 'flex items-center justify-between px-5 pt-6 pb-3',
    headerTitle: [typography['2xl'], typography.bold, 'text-black'].join(' '),

    // 맨 위 검색창
    searchBar: [colors.bg.white, 'flex items-center gap-2 mx-5 mb-4 px-4 py-3 rounded-2xl shadow-sm'].join(' '),
    searchIcon: 'w-4 h-4 flex-shrink-0 opacity-60',
    searchInput: [
      'flex-1 bg-transparent outline-none text-black placeholder:text-[#9898A8]',
      typography.sm, typography.regular,
    ].join(' '),
    searchClearButton: 'text-[#9898A8] text-base leading-none flex-shrink-0',

    // 친구가 아닌 사람이 보낸 채팅 요청함 배너
    requestBanner: [colors.bg.white, 'flex items-center justify-between mx-5 mb-3 px-4 py-3.5 rounded-2xl shadow-sm active:opacity-70'].join(' '),
    requestBannerLeft: 'flex items-center gap-2',
    requestBannerText: [typography.base, typography.semibold, 'text-black'].join(' '),
    requestBadge: [accentBg, 'min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-black', typography.xs, typography.bold].join(' '),
    requestBannerChevron: 'text-[#C7C7CC] text-xl leading-none',

    errorBanner: 'mx-5 mb-3 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3',
    errorBannerText: ['flex-1 text-red-500', typography.xs, typography.regular].join(' '),
    errorBannerClose: 'flex-shrink-0 text-red-400',

    listSectionTitle: [typography.sm, typography.semibold, 'block px-5 mb-1 text-[#9898A8]'].join(' '),

    // 채팅 목록 — 흰 카드 하나에 묶어 옅은 회색 캔버스 위에 띄운다
    chatList: [colors.bg.white, 'flex flex-col mx-5 rounded-3xl shadow-sm overflow-hidden divide-y divide-[#EBEBEF]'].join(' '),
    chatItem: 'flex items-center gap-3 px-4 py-3 w-full text-left',
    avatarWrapper: 'relative flex-shrink-0',
    avatar: ['w-12 h-12 rounded-full object-cover', colors.bg.gray04].join(' '),

    chatContent: 'flex-1 min-w-0 flex flex-col gap-1',
    chatTopRow: 'flex items-center justify-between gap-2',
    chatNickname: ['text-black truncate', typography.base, typography.semibold].join(' '),
    chatMetaRow: 'flex items-center gap-1.5 flex-shrink-0',
    restrictedText: [typography.xs, typography.regular, 'text-red-400'].join(' '),

    chatRight: 'flex flex-col items-end gap-1.5 flex-shrink-0',
    chatTime: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),
    unreadBadge: [accentBg, 'min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-black', typography.xs, typography.bold].join(' '),

    emptyState: 'flex flex-1 flex-col items-center justify-center gap-4 py-20 px-6',
    emptyText: ['text-[#9898A8] text-center', typography.sm, typography.regular].join(' '),
    retryButton: [colors.bg.white, 'rounded-xl px-5 py-3 text-black shadow-sm', typography.sm, typography.regular].join(' '),

    // 채팅 요청함 화면
    subHeader: 'flex items-center gap-3 px-5 pt-6 pb-4',
    backButton: 'w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#EBEBEF]',
    backIcon: 'w-5 h-5',
    subHeaderTitle: [typography.lg, typography.bold, 'text-black'].join(' '),

    requestList: 'flex flex-col px-5 gap-3',
    requestItem: [colors.bg.white, 'flex flex-col gap-3 rounded-2xl px-4 py-4 w-full shadow-sm'].join(' '),
    requestTop: 'flex items-center gap-3',
    requestInfo: 'flex-1 min-w-0 flex flex-col gap-1',
    requestNickname: ['text-black truncate block', typography.base, typography.semibold].join(' '),
    requestTime: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),
    requestPreviewText: ['text-[#4A4A4A] leading-relaxed', typography.sm, typography.regular].join(' '),
    requestPreviewBlurred: ['flex items-center justify-between gap-3 rounded-xl px-3 py-2.5', colors.bg.gray04].join(' '),
    requestPreviewBlurredText: ['text-[#9898A8] italic', typography.sm, typography.regular].join(' '),
    requestRevealButton: ['flex-shrink-0 rounded-full border px-3 py-1.5 text-black disabled:opacity-40', colors.border.gray03, typography.xs, typography.semibold].join(' '),
    requestActions: 'flex items-center gap-2',
    acceptButton: [accentBg, 'flex-1 rounded-full px-4 py-3 text-center text-black disabled:opacity-40', typography.xs, typography.bold].join(' '),
    requestBlockButton: 'flex-shrink-0 rounded-full border border-red-300 px-4 py-3 text-center text-red-500 text-xs font-bold',

    // 차단 확인 팝업
    confirmOverlay: 'fixed inset-0 bg-black/40 z-40',
    confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl',
    confirmText: [typography.base, typography.bold, 'text-black text-center'].join(' '),
    confirmErrorText: [typography.xs, typography.regular, 'mt-2 text-red-500 text-center'].join(' '),
    confirmButtons: 'flex items-center gap-3 mt-5',
    confirmNoButton: [
      'flex-1 py-4 rounded-2xl border', colors.border.gray03,
      'flex items-center justify-center',
      'text-black active:opacity-70',
      typography.base, typography.medium,
    ].join(' '),
    confirmYesButton: [
      'flex-1 py-4 rounded-2xl bg-red-500',
      'flex items-center justify-center',
      'text-white active:opacity-80',
      typography.base, typography.bold,
    ].join(' '),
  }
}
