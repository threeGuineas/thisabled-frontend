import typography from '../styles/typography'
import colors from '../styles/colors'

const styles = {
  container: 'min-h-screen bg-[#F5F8FF] flex flex-col pb-24',

  searchWrapper: 'px-5 pt-6 pb-3',
  searchBox: [
    'flex items-center gap-2 rounded-2xl px-4 py-3 shadow-sm',
    colors.bg.white,
  ].join(' '),
  searchIcon: 'w-5 h-5 flex-shrink-0',
  searchInput: [
    'flex-1 bg-transparent outline-none min-w-0',
    typography.sm, 'text-black placeholder:text-[#9898A8]',
  ].join(' '),

  filterContainer: 'overflow-x-auto scrollbar-hide',
  filterInner: 'flex gap-2 px-5 pb-4 w-max',

  filterActive: [
    colors.bg.blue, colors.text.white, 'rounded-full px-4 py-2 shadow-sm',
    typography.sm, typography.bold,
  ].join(' '),
  filterInactive: [
    colors.bg.white, colors.text.gray01, 'rounded-full px-4 py-2 shadow-sm',
    typography.sm, typography.medium,
  ].join(' '),

  list: 'flex-1 flex flex-col px-5 gap-3 pt-1',

  row: [
    'flex items-center gap-3 rounded-2xl bg-white shadow-sm p-4 cursor-pointer',
    'active:opacity-90 transition-opacity',
  ].join(' '),
  rowMain: 'flex-1 min-w-0 flex flex-col gap-1',
  rowCategory: [typography.xs, typography.bold, 'text-[#8E8E93]'].join(' '),
  rowBody: [
    typography.sm, typography.regular,
    'text-black leading-snug line-clamp-2',
  ].join(' '),

  rowMeta: 'flex items-center gap-1.5 mt-1',
  rowMetaText: [typography.xs, typography.medium, 'text-[#9898A8]'].join(' '),
  rowMetaDot: 'text-[#D6D6DC] text-xs',
  rowMetaButton: 'flex items-center gap-1',
  rowMetaIcon: 'w-3.5 h-3.5 opacity-50',
  rowMetaIconActive: 'w-3.5 h-3.5',
  rowMetaTextActive: [typography.xs, typography.bold, 'text-[#FF5A5F]'].join(' '),

  rowThumb: ['w-16 h-16 rounded-xl object-cover flex-shrink-0', colors.bg.gray04].join(' '),

  fab: [
    'fixed bottom-24 right-5 w-14 h-14 rounded-full z-40',
    colors.bg.blue, 'flex items-center justify-center shadow-lg',
    'active:opacity-90 transition-opacity',
  ].join(' '),
  fabIcon: 'w-6 h-6',
}

export default styles
