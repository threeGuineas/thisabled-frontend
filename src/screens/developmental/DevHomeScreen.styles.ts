import typography from '../../styles/typography'
import colors from '../../styles/colors'

// DEV-01: 한 화면의 정보와 선택지를 줄이고, 큰 버튼·쉬운 문장·일관된 아이콘을 쓴다.
// 검색창처럼 텍스트 입력이 필요한 요소는 빼고, 카테고리는 한 줄의 큰 알약 버튼으로만 고른다.
const styles = {
  container: 'min-h-screen bg-[#F4FBF7] flex flex-col pb-28',

  header: 'px-6 pt-8 pb-1',
  headerTitle: [typography['3xl'], typography.extrabold, 'text-black'].join(' '),

  writeButton: [
    colors.bg.green, 'mx-6 mt-5 mb-5 rounded-3xl px-6 py-5',
    'flex items-center justify-center gap-3 shadow-[0_8px_20px_-6px_rgba(34,176,125,0.55)] active:opacity-90 active:scale-[0.99] transition',
  ].join(' '),
  writeButtonIcon: 'w-7 h-7',
  writeButtonText: [typography.xl, typography.bold, 'text-white'].join(' '),

  // 카테고리 — 한 줄 스크롤, 큰 알약 버튼 하나씩(DEV-01 큰 버튼)
  filterContainer: 'overflow-x-auto scrollbar-hide',
  filterInner: 'flex gap-2.5 px-6 pb-5 w-max',
  filterActive: [
    colors.bg.green, 'text-white rounded-full px-5 py-3 shadow-sm',
    typography.base, typography.bold,
  ].join(' '),
  filterInactive: [
    colors.bg.white, 'text-[#5B6B63] rounded-full px-5 py-3 shadow-sm',
    typography.base, typography.semibold,
  ].join(' '),

  list: 'flex-1 flex flex-col px-6 gap-4',

  row: [
    'flex flex-col gap-3 rounded-[28px] bg-white shadow-sm p-5 cursor-pointer',
    'border border-transparent active:border-[#CDEDDD] active:opacity-95 transition',
  ].join(' '),
  rowCategory: [colors.bg.green01, colors.text.green, 'self-start rounded-full px-3 py-1', typography.sm, typography.bold].join(' '),
  rowTopRow: 'flex items-center gap-3',
  rowThumbWrapper: 'relative flex-shrink-0',
  rowThumb: ['w-16 h-16 rounded-2xl object-cover', colors.bg.gray04].join(' '),
  rowThumbPlayBadge: 'absolute inset-0 flex items-center justify-center rounded-2xl bg-black/25',
  rowThumbPlayIcon: 'w-6 h-6',
  rowBody: [
    typography.lg, typography.medium,
    'text-black leading-relaxed line-clamp-3',
  ].join(' '),

  rowMeta: 'flex items-center gap-4 mt-1',
  rowMetaButton: 'flex items-center gap-1.5',
  rowMetaIcon: 'w-5 h-5 opacity-50',
  rowMetaIconActive: 'w-5 h-5',
  rowMetaText: [typography.base, typography.semibold, 'text-[#9898A8]'].join(' '),
  rowMetaTextActive: [typography.base, typography.bold, 'text-[#FF5A5F]'].join(' '),
  rowTime: [typography.sm, typography.medium, 'text-[#B3B3BD]'].join(' '),

  emptyState: 'flex flex-1 flex-col items-center justify-center gap-4 py-20 px-6 text-center',
  emptyText: [typography.lg, typography.medium, 'text-[#8E8E93] whitespace-pre-line'].join(' '),
  retryButton: [colors.bg.white, 'rounded-2xl px-6 py-4 text-black shadow-sm', typography.base, typography.bold].join(' '),

  loadingMoreText: [typography.base, typography.medium, 'text-center text-[#9898A8] py-4'].join(' '),
}

export default styles
