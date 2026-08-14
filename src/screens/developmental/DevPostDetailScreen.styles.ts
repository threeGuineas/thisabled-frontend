import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: 'min-h-screen bg-[#F4FBF7] flex flex-col pb-24',

  header: [colors.bg.white, 'flex items-center gap-2 px-4 py-4 shadow-sm sticky top-0 z-10'].join(' '),
  backButton: 'w-11 h-11 -ml-1 rounded-full flex items-center justify-center active:bg-[#F4FBF7]',
  backIcon: 'w-6 h-6',
  headerTitle: [typography.lg, typography.bold, 'text-black'].join(' '),

  body: 'flex flex-col gap-4 px-5 pt-5',

  userInfo: 'flex items-center gap-3',
  avatar: ['w-12 h-12 rounded-full object-cover', colors.bg.gray04].join(' '),
  avatarFallback: 'w-12 h-12 rounded-full flex items-center justify-center text-black font-bold text-lg',
  userMeta: 'flex flex-col items-start text-left',
  nickname: [typography.lg, typography.bold, 'text-black'].join(' '),
  time: [typography.sm, typography.medium, 'text-[#9898A8]'].join(' '),

  content: [typography.xl, typography.medium, 'text-black leading-relaxed whitespace-pre-wrap'].join(' '),

  // COMM-01 쉬운 문장 변환
  commmSection: [colors.bg.green01, 'rounded-3xl p-5 flex flex-col gap-3'].join(' '),
  commmToggleRow: 'flex items-center justify-between gap-3',
  commmToggleButton: [colors.bg.white, 'flex items-center gap-2 rounded-full px-4 py-2.5 shadow-sm active:opacity-80'].join(' '),
  commmToggleText: [typography.base, typography.bold, colors.text.green].join(' '),
  commmBadge: [colors.bg.green, 'rounded-full px-3 py-1', typography.xs, typography.bold, 'text-white'].join(' '),
  commmResultText: [typography.lg, typography.medium, 'text-black leading-relaxed whitespace-pre-wrap'].join(' '),
  commmLoadingText: [typography.base, typography.medium, colors.text.gray01].join(' '),
  commmErrorText: [typography.sm, typography.medium, 'text-red-500'].join(' '),

  mediaList: 'flex flex-col gap-3',
  mediaImage: 'w-full rounded-2xl object-cover',

  statsRow: 'flex items-center gap-5 py-2',
  statButton: 'flex items-center gap-2',
  statIcon: 'w-6 h-6 opacity-50',
  statIconActive: 'w-6 h-6',
  statText: [typography.base, typography.semibold, 'text-[#9898A8]'].join(' '),
  statTextActive: [typography.base, typography.bold, 'text-[#FF5A5F]'].join(' '),

  divider: [colors.bg.gray03, 'h-2 mt-2'].join(' '),

  commentsSection: 'flex flex-col px-5 pt-5 gap-4',
  commentsHeader: [typography.lg, typography.bold, 'text-black'].join(' '),
  commentsHeaderCount: [colors.text.green].join(' '),

  emptyState: 'flex flex-col items-center justify-center gap-2 py-10',
  emptyStateText: [typography.base, typography.medium, 'text-[#9898A8] text-center'].join(' '),

  commentList: 'flex flex-col gap-4',
  commentItem: [colors.bg.white, 'rounded-2xl p-4 shadow-sm flex flex-col gap-2'].join(' '),
  commentTop: 'flex items-center gap-2.5',
  commentAvatar: ['w-9 h-9 rounded-full object-cover', colors.bg.gray04].join(' '),
  commentAvatarFallback: 'w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-sm',
  commentMeta: 'flex items-center gap-2 text-left',
  commentNickname: [typography.base, typography.bold, 'text-black'].join(' '),
  commentTime: [typography.xs, typography.medium, 'text-[#B3B3BD]'].join(' '),
  commentBody: [typography.base, typography.regular, 'text-black leading-relaxed whitespace-pre-wrap'].join(' '),

  inputBar: [colors.bg.white, 'fixed bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]'].join(' '),
  textInput: [
    colors.bg.gray04, 'min-w-0 flex-1 rounded-full px-4 py-2 outline-none text-black placeholder:text-[#9898A8]',
    typography.base, typography.regular,
  ].join(' '),
  sendButton: 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0',
  sendButtonActive: [colors.bg.green, 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0'].join(' '),
  sendButtonInactive: [colors.bg.gray03, 'w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0'].join(' '),
  sendIcon: 'w-4 h-4',

  // 댓글 게시 전 확인
  confirmOverlay: 'fixed inset-0 bg-black/40 z-40',
  confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl',
  confirmText: [typography.lg, typography.bold, 'text-black text-center'].join(' '),
  confirmPreview: [colors.bg.gray04, 'mt-3 rounded-2xl px-4 py-3 text-black', typography.base, typography.regular].join(' '),
  confirmErrorText: [typography.sm, typography.regular, 'mt-2 text-red-500 text-center'].join(' '),
  confirmButtons: 'flex items-center gap-3 mt-5',
  confirmNoButton: [
    'flex-1 py-4 rounded-2xl border', colors.border.gray03,
    'flex items-center justify-center text-black active:opacity-70',
    typography.base, typography.medium,
  ].join(' '),
  confirmYesButton: [
    'flex-1 py-4 rounded-2xl', colors.bg.green,
    'flex items-center justify-center text-white active:opacity-80',
    typography.base, typography.bold,
  ].join(' '),
}

export default styles
