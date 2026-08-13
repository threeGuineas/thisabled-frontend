import typography from '../../styles/typography'
import colors from '../../styles/colors'

export type ChatRoomScreenTheme = 'default' | 'hearing' | 'developmental'

export default function getStyles(theme: ChatRoomScreenTheme = 'default') {
  const accentBg = theme === 'hearing' ? colors.bg.blue : theme === 'developmental' ? colors.bg.green : colors.bg.yellow
  const accentReadText = theme === 'hearing' ? 'text-[#4C7DFF]' : theme === 'developmental' ? 'text-[#22B07D]' : 'text-[#FFD60A]'
  // 발달장애 모드(DEV-01) — 말풍선 글자와 입력창을 다른 모드보다 크게 키운다
  const isDev = theme === 'developmental'

  return {
    container: [isDev ? 'bg-[#F4FBF7]' : colors.bg.gray03, 'min-h-screen flex flex-col'].join(' '),

    header: [colors.bg.white, 'flex items-center gap-3 px-4 py-3 shadow-sm relative z-10'].join(' '),
    backButton: 'w-9 h-9 -ml-1 rounded-full flex items-center justify-center flex-shrink-0 active:bg-[#F7F7F9]',
    backIcon: 'w-5 h-5',
    avatar: ['w-9 h-9 rounded-full object-cover flex-shrink-0', colors.bg.gray04].join(' '),
    userName: [typography.base, typography.bold, 'text-black truncate flex-1 min-w-0'].join(' '),

    headerActions: 'flex items-center gap-1 flex-shrink-0',
    headerActionButton: 'w-9 h-9 rounded-full flex items-center justify-center active:bg-[#F7F7F9]',
    headerActionIcon: 'w-5 h-5',

    // 상대의 SAFE-05 전송 제한 해제 배너
    restrictionBanner: 'mx-4 mt-3 flex items-center justify-between gap-3 rounded-2xl bg-red-50 px-4 py-3 shadow-sm',
    restrictionText: ['flex-1 text-red-500', typography.xs, typography.regular].join(' '),
    restrictionButton: [accentBg, 'flex-shrink-0 rounded-full px-3 py-2 text-black disabled:opacity-40', typography.xs, typography.bold].join(' '),

    // 요청 방에서 상대 수락 대기 중 배너
    pendingBanner: [colors.bg.white, 'mx-4 mt-3 rounded-2xl px-4 py-3 shadow-sm'].join(' '),
    pendingBannerFixed: [colors.bg.white, 'fixed left-4 right-4 bottom-4 z-30 rounded-2xl px-4 py-3 shadow-sm'].join(' '),
    pendingText: ['text-[#757575] text-center', typography.xs, typography.regular].join(' '),

    dateDivider: 'flex items-center justify-center py-3',
    dateText: [typography.xs, typography.regular, 'text-[#9898A8] bg-[#F7F7F9] rounded-full px-3 py-1'].join(' '),

    loadingMoreRow: 'flex items-center justify-center py-2',
    loadingMoreText: [typography.xs, typography.regular, 'text-[#9898A8]'].join(' '),

    messageList: 'flex-1 flex flex-col px-4 gap-3 py-3 pb-28 overflow-y-auto',

    // 상대 메시지
    otherRow: 'flex items-end gap-2 max-w-[85%]',
    otherAvatar: ['w-8 h-8 rounded-full object-cover flex-shrink-0 self-start', colors.bg.gray04].join(' '),
    otherCol: 'flex flex-col gap-1 items-start',
    otherName: [typography.xs, typography.medium, 'text-[#757575]'].join(' '),
    otherBubbleRow: 'flex items-end gap-1.5',
    otherBubble: [colors.bg.white, 'rounded-2xl rounded-bl-sm px-3.5 py-2.5 shadow-sm'].join(' '),
    otherText: [isDev ? typography.base : typography.sm, typography.regular, 'text-black leading-relaxed whitespace-pre-wrap break-words'].join(' '),
    otherTime: [typography.xs, typography.regular, 'text-[#B3B3BD] flex-shrink-0 mb-0.5'].join(' '),

    // 내 메시지
    myRow: 'flex justify-end',
    myGroup: 'flex items-end gap-1.5 max-w-[85%]',
    myMetaCol: 'flex flex-col items-end gap-0.5 flex-shrink-0 mb-0.5',
    myReadText: [typography.xs, typography.bold, accentReadText].join(' '),
    myTime: [typography.xs, typography.regular, 'text-[#B3B3BD]'].join(' '),
    myBubble: [accentBg, 'rounded-2xl rounded-br-sm px-3.5 py-2.5 shadow-sm'].join(' '),
    myText: [isDev ? typography.base : typography.sm, typography.regular, isDev ? 'text-white' : 'text-black', 'leading-relaxed whitespace-pre-wrap break-words'].join(' '),

    messageImage: 'max-w-full rounded-2xl object-contain',
    messageVideo: 'max-w-full rounded-2xl',

    blurredBubble: [colors.bg.white, 'flex flex-col items-start gap-2 rounded-2xl px-3.5 py-3 shadow-sm'].join(' '),
    blurredText: [typography.sm, typography.regular, 'text-[#9898A8] italic'].join(' '),
    blurredActions: 'flex items-center gap-2',
    revealButton: ['rounded-full border px-3 py-1.5 disabled:opacity-40 text-black', colors.border.gray03, typography.xs, typography.semibold].join(' '),
    blockButton: [typography.xs, typography.semibold, 'rounded-full border border-red-300 px-3 py-1.5 text-red-500 disabled:opacity-40'].join(' '),

    // 사진 전송 확인 팝업
    confirmOverlay: 'fixed inset-0 bg-black/40 z-40',
    confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl',
    confirmImage: 'w-full max-h-60 object-contain rounded-2xl mb-5',
    confirmText: [isDev ? typography.lg : typography.base, typography.bold, 'text-black text-center'].join(' '),
    confirmError: [typography.xs, typography.regular, 'mt-1 text-red-500 text-center'].join(' '),
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

    // 하단 입력 바
    inputBarWrapper: ['fixed bottom-0 left-0 right-0 bg-white border-t', colors.border.gray03].join(' '),
    inputBar: 'flex items-center gap-2 px-3 py-2.5',
    attachButton: [colors.bg.gray04, 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-30'].join(' '),
    attachIcon: 'w-5 h-5',
    textInputWrapper: [colors.bg.gray04, 'flex-1 rounded-full px-4 py-2.5 min-w-0'].join(' '),
    textInput: [
      'w-full bg-transparent outline-none text-black placeholder:text-[#9898A8] resize-none max-h-24',
      isDev ? typography.base : typography.sm, typography.regular,
    ].join(' '),
    sendButton: 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 disabled:opacity-40',
    sendButtonActive: [accentBg, 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0'].join(' '),
    sendIcon: 'w-4 h-4',

    sendError: [typography.xs, typography.regular, 'px-4 pt-2 text-red-500'].join(' '),
  }
}
