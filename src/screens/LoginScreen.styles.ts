import typography from '../styles/typography'
import colors from '../styles/colors'

const styles = {
  container: [
    'flex min-h-screen flex-col',
    'bg-white px-6',
  ].join(' '),

  header: [
    'mt-20 flex flex-col items-center',
  ].join(' '),

  title: [
    typography['4xl'], typography.semibold,
    'tracking-tight text-black-400',
  ].join(' '),

  subtitle: [
    'mt-1',
    typography.sm, typography.medium,
    colors.text.gray01,
  ].join(' '),

  form: [
    'mt-16 flex flex-col gap-5',
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

  loginError: [
    'mt-3 w-full rounded-xl',
    'bg-[#FFF5F5] px-4 py-3',
    typography.xs, typography.medium,
    'text-[#FF3B30] text-center',
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

  loginButtonBase: [
    'mt-6 w-full rounded-2xl py-4',
    typography.sm, typography.bold,
    'transition-colors',
  ].join(' '),

  loginButtonActive: [
    colors.bg.yellow,
    'text-white',
    colors.active.yellow,
  ].join(' '),

  loginButtonDisabled: [
    colors.bg.gray04,
    'text-[#9898A8] cursor-not-allowed',
  ].join(' '),

  signupSection: [
    'mt-8 flex flex-col items-center gap-3',
  ].join(' '),

  signupDivider: [
    'mb-4 flex items-center gap-3 w-full',
  ].join(' '),

  signupDividerLine: [
    `flex-1 border-t ${colors.border.gray03}`,
  ].join(' '),

  signupGuide: [
    typography.xs, typography.medium,
    colors.text.gray02,
    'shrink-0',
  ].join(' '),

  signupButton: [
    ' w-full rounded-2xl',
    `border-2 ${colors.border.yellow} py-4`,
    typography.sm, typography.bold,
    colors.text.black,
    'active:bg-[#FFD60A]/10',
  ].join(' '),
}

export default styles
