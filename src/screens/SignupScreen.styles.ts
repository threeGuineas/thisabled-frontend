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

  backIcon: [
    'w-6 h-6',
  ].join(' '),

  title: [
    'mt-6',
    typography['3xl'], typography.bold,
    colors.text.black,
  ].join(' '),

  form: [
    'mt-8 flex flex-col gap-5',
  ].join(' '),

  fieldWrapper: [
    'flex flex-col gap-1',
  ].join(' '),

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

  passwordWrapper: [
    'relative flex items-center',
  ].join(' '),

  eyeButton: [
    'absolute right-4',
    'flex items-center justify-center',
    'p-1',
  ].join(' '),

  eyeIcon: [
    'w-5 h-5',
  ].join(' '),

  termsContainer: [
    'w-full rounded-2xl cursor-pointer select-none',
    `border ${colors.border.gray03} ${colors.bg.gray04}`,
    'px-5 py-4',
  ].join(' '),

  termsRow: [
    'flex items-center gap-3',
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

  checkIcon: [
    'w-3 h-3 brightness-0 invert',
  ].join(' '),

  termsTextWrapper: [
    'flex flex-col gap-0.5',
  ].join(' '),

  termsMain: [
    typography.sm, typography.semibold,
    colors.text.black,
  ].join(' '),

  termsSub: [
    typography.xs, typography.medium,
    colors.text.gray02,
  ].join(' '),

  signupButtonBase: [
    'mt-8 w-full rounded-2xl py-4',
    typography.sm, typography.bold,
    'transition-colors',
  ].join(' '),

  signupButtonActive: [
    colors.bg.yellow,
    'text-white',
    colors.active.yellow,
  ].join(' '),

  signupButtonDisabled: [
    colors.bg.gray04,
    'text-[#9898A8] cursor-not-allowed',
  ].join(' '),
}

export default styles
