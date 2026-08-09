import typography from '../../styles/typography'
import colors from '../../styles/colors'

export type FriendScreenTheme = 'default' | 'hearing'

export default function getStyles(theme: FriendScreenTheme = 'default') {
  const accentBg = theme === 'hearing' ? colors.bg.blue : colors.bg.yellow

  return {
    container: 'min-h-screen bg-[#F7F7F9] flex flex-col pb-24',

    header: 'flex items-center justify-between px-5 pt-6 pb-4',
    headerTitle: [typography['2xl'], typography.bold, 'text-black'].join(' '),
    searchIconWrapper: [colors.bg.white, 'w-10 h-10 rounded-full flex items-center justify-center shadow-sm'].join(' '),
    searchIcon: 'w-5 h-5',

    // 친구 요청 배너 (탭하면 친구 요청 화면으로 이동)
    requestBanner: [colors.bg.white, 'flex items-center justify-between mx-5 mb-6 px-4 py-3.5 rounded-2xl shadow-sm active:opacity-70'].join(' '),
    requestBannerLeft: 'flex items-center gap-2',
    requestBannerText: [typography.base, typography.semibold, 'text-black'].join(' '),
    requestBadge: [accentBg, 'min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center text-black', typography.xs, typography.bold].join(' '),
    requestBannerChevron: 'text-[#C7C7CC] text-xl leading-none',

    // 친구 요청 화면 상단 (뒤로가기)
    subHeader: 'flex items-center gap-3 px-5 pt-6 pb-4',
    backButton: ['w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#EBEBEF]'].join(' '),
    backIcon: 'w-5 h-5',
    subHeaderTitle: [typography.lg, typography.bold, 'text-black'].join(' '),

    // 친구 추천
    recommendSection: 'mb-6',
    recommendTitle: [typography.base, typography.bold, 'block px-5 mb-3 text-black'].join(' '),
    recommendScrollArea: 'overflow-x-auto scrollbar-hide px-5',
    recommendInner: 'flex gap-3 w-max',
    recommendCard: [colors.bg.white, 'w-40 flex-shrink-0 rounded-2xl p-4 flex flex-col items-center gap-1.5 shadow-sm'].join(' '),
    recommendAvatar: ['w-16 h-16 rounded-full object-cover', colors.bg.gray04].join(' '),
    recommendNickname: [typography.sm, typography.semibold, 'w-full text-center truncate text-black'].join(' '),
    recommendBio: [typography.xs, typography.regular, 'w-full text-center text-[#9898A8] line-clamp-2'].join(' '),
    recommendAddButton: [accentBg, 'mt-1 w-full flex items-center justify-center gap-1.5 rounded-full py-2.5 disabled:opacity-40'].join(' '),
    recommendAddIcon: 'w-3.5 h-3.5',
    recommendAddText: [typography.xs, typography.bold, 'text-black'].join(' '),

    // 친구 목록 — 흰 카드 하나에 묶어 옅은 회색 캔버스 위에 띄운다
    listTitle: [typography.base, typography.bold, 'block px-5 mb-2 text-black'].join(' '),
    friendList: [colors.bg.white, 'flex flex-col mx-5 rounded-3xl shadow-sm overflow-hidden divide-y divide-[#EBEBEF]'].join(' '),
    friendRow: ['flex items-center gap-3 px-4 py-3 w-full active:bg-[#F7F7F9]'].join(' '),
    friendAvatar: ['w-12 h-12 rounded-full object-cover flex-shrink-0', colors.bg.gray04].join(' '),
    friendInfo: 'flex-1 min-w-0 text-left',
    friendNickname: [typography.base, typography.semibold, 'text-black truncate w-full'].join(' '),

    // 친구 요청
    requestBoxRow: [colors.bg.white, 'flex mx-5 mb-4 rounded-2xl p-1 gap-1 shadow-sm'].join(' '),
    requestBoxButtonActive: [colors.bg.gray04, 'flex-1 rounded-xl py-2.5 text-center text-black', typography.sm, typography.bold].join(' '),
    requestBoxButtonInactive: ['flex-1 rounded-xl py-2.5 text-center text-[#8E8E93]', typography.sm, typography.medium].join(' '),
    requestList: 'flex flex-col px-5 gap-3',
    requestItem: [colors.bg.white, 'flex flex-col gap-3 rounded-2xl px-4 py-4 w-full shadow-sm'].join(' '),
    requestTop: 'flex items-center gap-3',
    requestActions: 'flex gap-2',
    acceptButton: [accentBg, 'flex-1 rounded-xl py-3 text-center text-black', typography.sm, typography.bold].join(' '),
    declineButton: ['flex-1 rounded-xl py-3 text-center border text-black', colors.border.gray03, typography.sm, typography.semibold].join(' '),
    cancelButton: ['w-full rounded-xl py-3 text-center border text-black', colors.border.gray03, typography.sm, typography.semibold].join(' '),

    emptyState: 'flex flex-1 flex-col items-center justify-center gap-4 py-16 px-5',
    emptyText: [typography.sm, typography.regular, 'text-[#9898A8] text-center'].join(' '),
    retryButton: [typography.sm, typography.regular, colors.bg.white, 'rounded-xl px-5 py-3 text-black shadow-sm'].join(' '),

    // 친구 요청 수락/거절 등 확인 팝업
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
      'flex-1 py-4 rounded-2xl', accentBg,
      'flex items-center justify-center',
      'text-black active:opacity-80',
      typography.base, typography.bold,
    ].join(' '),
  }
}
