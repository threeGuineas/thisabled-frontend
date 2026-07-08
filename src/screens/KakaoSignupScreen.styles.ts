import typography from '../styles/typography'
import colors from '../styles/colors'

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

  modeGrid: 'grid grid-cols-3 gap-2',

  modeCard: [
    'flex flex-col items-center gap-2',
    'rounded-2xl',
    `border-2 ${colors.border.gray03} ${colors.bg.gray04}`,
    'py-4 cursor-pointer select-none transition-colors',
  ].join(' '),

  modeCardSelected: [
    'flex flex-col items-center gap-2',
    'rounded-2xl',
    'border-2 border-[#FFD60A] bg-[#FFFAE1]',
    'py-4 cursor-pointer select-none transition-colors',
  ].join(' '),

  modeIcon: 'w-6 h-6',

  modeLabel: [
    typography.xs, typography.medium,
    colors.text.gray01,
  ].join(' '),

  modeLabelSelected: [
    typography.xs, typography.semibold,
    colors.text.black,
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
