import typography from '../styles/typography'
import colors from '../styles/colors'

const styles = {
  container: 'min-h-screen bg-white flex flex-col pb-24',

  header: 'flex items-center px-5 pt-6 pb-2',
  backButton: 'w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#F7F7F9]',
  backIcon: 'w-5 h-5',

  body: 'px-5 pt-2',
  category: [
    'inline-block rounded-full px-3 py-1',
    colors.bg.yellow, colors.text.black,
    typography.xs, typography.bold,
  ].join(' '),

  userInfo: 'flex items-center gap-3 mt-3',
  avatar: 'w-11 h-11 rounded-full object-cover flex-shrink-0',
  avatarFallback: 'w-11 h-11 rounded-full flex items-center justify-center text-black font-bold text-base flex-shrink-0',
  userMeta: 'flex flex-col',
  nickname: [typography.sm, typography.semibold, 'text-black'].join(' '),
  time: [typography.xs, typography.regular, 'text-[#9898A8] mt-0.5'].join(' '),

  content: [typography.sm, typography.regular, 'text-black leading-relaxed mt-4 whitespace-pre-wrap'].join(' '),

  mediaList: 'flex flex-col gap-3 mt-4',
  mediaImage: ['w-full rounded-2xl object-cover', colors.bg.gray04].join(' '),

  statsRow: ['flex items-center gap-5 mt-5 pt-4 border-t', colors.border.gray03].join(' '),
  statButton: 'flex items-center gap-1.5',
  statIcon: 'w-4 h-4 opacity-50',
  statIconActive: 'w-4 h-4',
  statText: [typography.sm, typography.medium, 'text-[#9898A8]'].join(' '),
  statTextActive: [typography.sm, typography.bold, 'text-[#FF5A5F]'].join(' '),

  divider: ['h-2 mt-4', colors.bg.gray04].join(' '),

  commentsSection: 'px-5 pt-5 flex flex-col gap-5',
  commentsHeader: [typography.base, typography.bold, 'text-black'].join(' '),
  commentsHeaderCount: colors.text.gray01,

  commentList: 'flex flex-col gap-5',
  commentItem: 'flex flex-col gap-2',
  commentTop: 'flex items-start gap-3',
  commentAvatar: 'w-9 h-9 rounded-full object-cover flex-shrink-0',
  commentAvatarFallback: 'w-9 h-9 rounded-full flex items-center justify-center text-black font-bold text-sm flex-shrink-0',
  commentMeta: 'flex flex-col justify-center items-start text-left',
  commentNickname: [typography.sm, typography.semibold, 'text-black'].join(' '),
  commentTime: [typography.xs, typography.regular, 'text-[#9898A8] mt-0.5'].join(' '),
  commentBody: [typography.sm, typography.regular, 'text-black leading-relaxed pl-12'].join(' '),

  emptyState: 'flex items-center justify-center py-10',
  emptyStateText: [typography.sm, 'text-[#9898A8]'].join(' '),

  inputBar: [
    'fixed bottom-0 left-0 right-0 z-30',
    'flex items-center gap-2 bg-white border-t px-4 py-3',
    colors.border.gray03,
  ].join(' '),
  textInput: [
    'flex-1 rounded-full px-4 py-2.5 outline-none min-w-0',
    colors.bg.gray04, typography.sm, 'text-black placeholder:text-[#9898A8]',
  ].join(' '),
  sendButton: 'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 active:opacity-80',
  sendButtonActive: colors.bg.yellow,
  sendButtonInactive: colors.bg.gray04,
  sendIcon: 'w-4 h-4',
  sendIconInactive: 'w-4 h-4 opacity-30',
}

export default styles
