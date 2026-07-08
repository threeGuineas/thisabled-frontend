import typography from '../styles/typography'
import colors from '../styles/colors'

const styles = {
  container: [
    'flex min-h-screen flex-col',
    'bg-white px-6 pb-10',
  ].join(' '),

  header: 'mt-14 flex items-start justify-between',

  title: [
    typography['3xl'], typography.bold,
    colors.text.black,
  ].join(' '),

  subtitle: [
    'mt-1',
    typography.sm, typography.medium,
    colors.text.gray02,
  ].join(' '),

  skipButton: [
    'mt-1 px-3 py-1.5',
    typography.sm, typography.semibold,
    colors.text.gray02,
  ].join(' '),

  form: 'mt-8 flex flex-col gap-5',

  fieldWrapper: 'flex flex-col gap-1',

  label: [
    typography.sm, typography.semibold,
    colors.text.gray01,
  ].join(' '),

  optionalLabel: [
    typography.xs, typography.medium,
    colors.text.gray02,
  ].join(' '),

  errorText: [
    typography.xs, typography.medium,
    'text-[#FF3B30] mt-1',
  ].join(' '),

  // 프로필 사진
  photoSection: 'flex flex-col items-center gap-2 self-center',

  avatarWrapper: 'relative w-24 h-24',

  avatarImage: [
    'w-24 h-24 rounded-full object-cover',
    `border ${colors.border.gray03}`,
  ].join(' '),

  avatarPlaceholder: [
    'w-24 h-24 rounded-full flex items-center justify-center',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
  ].join(' '),

  avatarPlaceholderIcon: 'w-9 h-9 opacity-40',

  avatarEditButton: [
    'absolute bottom-0 right-0 w-8 h-8 rounded-full',
    colors.bg.yellow,
    'flex items-center justify-center border-2 border-white',
  ].join(' '),

  avatarEditIcon: 'w-4 h-4 brightness-0 invert',

  avatarRemoveButton: [
    typography.xs, typography.medium,
    'text-[#9898A8] underline underline-offset-2',
  ].join(' '),

  // 자기소개
  textareaWrapper: 'relative',

  textarea: [
    'w-full rounded-2xl resize-none',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    'px-5 py-4 pb-7',
    typography.sm, typography.medium,
    colors.text.gray01,
    `outline-none placeholder:${colors.text.gray02}`,
    `focus:${colors.border.yellow} focus:ring-2 focus:ring-[#FFD60A]/20`,
  ].join(' '),

  charCounter: [
    'absolute bottom-3 right-4',
    typography.xs, typography.medium,
    colors.text.gray02,
  ].join(' '),

  // 관심사 태그
  interestList: 'flex flex-col gap-2',

  categoryGroup: 'flex flex-col',

  categoryButton: [
    'w-full flex items-center justify-between rounded-2xl',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    'px-4 py-3.5 transition-colors',
  ].join(' '),

  categoryButtonOpen: [
    'w-full flex items-center justify-between rounded-2xl rounded-b-none',
    'border border-[#FFD60A] bg-[#FFFAE1]',
    'px-4 py-3.5 transition-colors',
  ].join(' '),

  categoryButtonLeft: 'flex items-center gap-2',

  categoryLabel: [
    typography.sm, typography.semibold,
    colors.text.gray01,
  ].join(' '),

  categoryLabelOpen: [
    typography.sm, typography.semibold,
    colors.text.black,
  ].join(' '),

  categoryCount: [
    typography.xs, typography.bold,
    'text-[#E6C009]',
  ].join(' '),

  chevronIcon: 'w-4 h-4 transition-transform duration-150',

  chevronIconOpen: 'w-4 h-4 transition-transform duration-150 rotate-90',

  tagPanel: [
    'flex flex-wrap gap-2 rounded-2xl rounded-t-none',
    'border border-t-0 border-[#FFD60A] bg-white',
    'px-4 py-3.5',
  ].join(' '),

  tagChip: [
    'px-3 py-2 rounded-full',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    typography.xs, typography.medium,
    colors.text.gray01,
    'transition-colors',
  ].join(' '),

  tagChipSelected: [
    'px-3 py-2 rounded-full',
    'border border-[#FFD60A] bg-[#FFD60A]',
    typography.xs, typography.semibold,
    'text-white',
    'transition-colors',
  ].join(' '),

  tagChipDisabled: [
    'px-3 py-2 rounded-full',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    typography.xs, typography.medium,
    'text-[#C4C4CC] cursor-not-allowed',
    'transition-colors',
  ].join(' '),

  interestCounter: [
    typography.xs, typography.medium,
    colors.text.gray02,
  ].join(' '),

  submitButtonBase: [
    'mt-8 w-full rounded-2xl py-4',
    typography.sm, typography.bold,
    'transition-colors',
  ].join(' '),

  submitButtonActive: [
    colors.bg.yellow,
    'text-white',
    colors.active.yellow,
  ].join(' '),

  submitButtonDisabled: [
    colors.bg.gray04,
    'text-[#9898A8] cursor-not-allowed',
  ].join(' '),

  apiError: [
    'mt-3 w-full rounded-xl',
    'bg-[#FFF5F5] px-4 py-3',
    typography.xs, typography.medium,
    'text-[#FF3B30] text-center',
  ].join(' '),
}

export default styles
