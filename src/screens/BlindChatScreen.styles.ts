import typography from '../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col pb-24',

  header: 'flex items-center justify-between px-6 pt-7 pb-4',
  headerLeft: 'flex items-center gap-2',
  headerTitle: ['text-white', typography['3xl'], typography.bold].join(' '),
  badgeWrapper: 'w-6 h-6 rounded-full bg-[#FFD60A] flex items-center justify-center',
  badgeText: ['text-black', typography.xs, typography.bold].join(' '),
  searchIconWrapper: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center',
  searchIcon: 'w-6 h-6',

  activeRow: 'flex items-center gap-2 px-6 pb-5',
  activeDot: 'w-2.5 h-2.5 rounded-full bg-[#22C55E] flex-shrink-0',
  activeText: ['text-white', typography.sm, typography.medium].join(' '),

  chatList: 'flex flex-col px-4 gap-2',

  chatItem: 'flex items-start gap-3 bg-[#111111] rounded-2xl px-4 py-4 w-full text-left',
  avatarWrapper: 'relative flex-shrink-0',
  avatar: 'w-12 h-12 rounded-full object-cover',
  avatarActiveDot: 'absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-[#111111]',

  chatContent: 'flex-1 min-w-0',
  chatTopRow: 'flex items-center justify-between mb-1',
  chatNickname: ['text-white', typography.sm, typography.semibold].join(' '),
  chatTime: ['text-white/40', typography.xs, typography.regular].join(' '),
  chatMessage: ['text-white/60 truncate block', typography.sm, typography.regular].join(' '),
  chatBottomRow: 'flex items-center gap-3 mt-2',

  readRow: 'flex items-center gap-1 border border-[#2A2A2A] bg-[#1F1F1F] rounded-full px-2.5 py-1',
  readCheckIcon: 'w-3 h-3 flex-shrink-0',
  readText: ['text-[#8A8A8A]', typography.xs, typography.regular].join(' '),
  unreadRow: 'flex items-center gap-1 bg-[#FFD60A] rounded-full px-2.5 py-1',
  unreadDot: 'w-2 h-2 rounded-full bg-black flex-shrink-0',
  unreadText: ['text-black', typography.xs, typography.bold].join(' '),

  activeStatusRow: 'flex items-center gap-1',
  activeStatusDot: 'w-2 h-2 rounded-full bg-[#22C55E] flex-shrink-0',
  activeStatusText: ['text-[#22C55E]', typography.xs, typography.regular].join(' '),
}

export default styles
