import typography from '../styles/typography'


const styles = {
  container: 'min-h-screen bg-black flex flex-col pb-24',

  header: 'flex items-center justify-between px-6 pt-7 pb-4',
  headerTitle: ['text-white', typography['3xl'], typography.bold].join(' '),
  searchIconWrapper: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center',
  searchIcon: 'w-6 h-6',

  section: 'px-6',

  writeButton: [
    'w-full flex items-center justify-center gap-3',
    'bg-[#FFD60A] rounded-2xl px-5 py-4',
    'active:opacity-90 transition-opacity',
  ].join(' '),
  plusIcon: 'w-5 h-5 flex-shrink-0',
  writeText: ['text-black', typography.base, typography.bold].join(' '),

  filterContainer: 'mt-3 overflow-x-auto scrollbar-hide',
  filterInner: 'flex gap-2 px-6 w-max',

  filterActive: [
    'bg-[#FFD60A] text-black rounded-full px-5 py-3',
    typography.base, typography.bold,
  ].join(' '),

  filterInactive: [
    'border border-[#FFD60A] text-[#FFD60A] rounded-full px-5 py-3',
    typography.base, typography.semibold,
  ].join(' '),

  newPostsBadge: ['px-6 mt-3 text-white', typography.sm, typography.medium].join(' '),
  newPostsCount: 'text-[#FFD60A]',

  content: 'flex-1',

  // 카드 스와이프 영역
  cardScrollArea: 'mt-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4',
  cardScrollInner: 'flex gap-4 items-start',

  // 글 카드
  card: [
    'w-[calc(100vw-2rem)] flex-shrink-0 snap-center rounded-2xl border border-yellow-400',
    'bg-[#111111] px-4 py-4 flex flex-col gap-3',
  ].join(' '),

  // 카드 상단 영역
  cardHeader: 'flex flex-col gap-2',
  cardAuthorRow: 'flex items-start gap-3',
  cardAvatarCol: 'flex flex-col items-center gap-1',
  cardAvatar: 'w-11 h-11 rounded-full object-cover',
  cardTag: ['text-yellow-400 mt-1.5 border border-yellow-400 rounded-full px-3 py-1', typography.xs, typography.semibold].join(' '),
  cardAuthorInfo: 'flex flex-col justify-center pt-0.5',
  cardNickname: ['text-white', typography.sm, typography.semibold].join(' '),
  cardTime: ['text-white/60', typography.xs, typography.regular].join(' '),

  // 본문
  cardBody: ['text-white leading-relaxed', typography.sm, typography.regular].join(' '),

  // 첨부 이미지
  cardImage: 'w-full h-36 object-cover rounded-xl',

  // 카드 하단
  cardFooter: 'flex items-center justify-between mt-1',
  cardFooterLeft: 'flex items-center gap-1.5 border border-yellow-400 rounded-full px-3 py-1',
  cardFooterLeftActive: 'flex items-center gap-1.5 bg-yellow-400 border border-yellow-400 rounded-full px-3 py-1',
  cardFooterRight: 'flex items-center gap-1.5 border border-yellow-400 rounded-full px-3 py-1',
  cardFooterTextActive: ['text-black', typography.xs, typography.regular].join(' '),
  cardFooterIcon: 'w-5 h-5',
  cardFooterText: ['text-white', typography.xs, typography.regular].join(' '),
}

export default styles
