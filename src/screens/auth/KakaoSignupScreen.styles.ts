import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: [
    'flex min-h-screen flex-col',
    'bg-white px-6 pb-10',
  ].join(' '),

  backButton: [
    'mt-14 self-start pl-2 pr-3 py-2.5 rounded-xl',
    colors.bg.gray04,
  ].join(' '),

  backIcon: 'w-6 h-6',

  title: [
    'mt-6',
    typography['3xl'], typography.bold,
    colors.text.black,
  ].join(' '),

  subtitle: [
    'mt-1',
    typography.sm, typography.medium,
    colors.text.gray02,
  ].join(' '),

  form: 'mt-8 flex flex-col gap-5',

  fieldWrapper: 'flex flex-col gap-1',

  label: [
    typography.sm, typography.semibold,
    colors.text.gray01,
  ].join(' '),

  input: [
    'w-full rounded-2xl',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    'px-5 py-4',
    typography.sm, typography.medium,
    colors.text.gray01,
    `outline-none placeholder:${colors.text.gray02}`,
    `focus:${colors.border.yellow} focus:ring-2 focus:ring-[#FFD60A]/20`,
  ].join(' '),

  inputError: [
    'w-full rounded-2xl',
    'border border-[#FF3B30] bg-[#FFF5F5]',
    'px-5 py-4',
    typography.sm, typography.medium,
    colors.text.gray01,
    `outline-none placeholder:${colors.text.gray02}`,
    'focus:border-[#FF3B30] focus:ring-2 focus:ring-[#FF3B30]/20',
  ].join(' '),

  errorText: [
    typography.xs, typography.medium,
    'text-[#FF3B30] mt-1',
  ].join(' '),

  optionalLabel: [
    typography.xs, typography.medium,
    colors.text.gray02,
  ].join(' '),

  // 프로필 사진
  photoSection: 'flex flex-col items-center gap-2',

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

  agreementSection: [
    'rounded-2xl',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    'px-4 py-3 flex flex-col gap-2',
  ].join(' '),

  allAgreeRow: 'flex items-center gap-3 py-1 w-full',

  allAgreeText: [
    typography.sm, typography.semibold,
    colors.text.black,
  ].join(' '),

  divider: `h-px ${colors.bg.gray03} my-1`,

  agreeRow: 'flex items-center gap-3 py-1 w-full',

  agreeText: [
    typography.xs, typography.medium,
    colors.text.gray01,
  ].join(' '),

  checkboxUnchecked: [
    'w-5 h-5 flex-shrink-0 rounded',
    'border-2 border-[#EBEBEF] bg-white',
  ].join(' '),

  checkboxChecked: [
    'w-5 h-5 flex-shrink-0 rounded',
    'border-2 border-[#FFD60A] bg-[#FFD60A]',
    'flex items-center justify-center',
  ].join(' '),

  checkIcon: 'w-3 h-3 brightness-0 invert',

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
