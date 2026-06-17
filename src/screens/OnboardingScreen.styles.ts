import typography from '../styles/typography'
import colors from '../styles/colors'

const styles = {
  container: [
    'flex min-h-screen flex-col',
    'bg-white px-6 pt-16 pb-10',
  ].join(' '),

  title: [
    typography['3xl'], typography.bold,
    'text-black leading-snug',
  ].join(' '),

  subtitle: [
    'mt-2',
    typography.sm, typography.medium,
    colors.text.gray01,
  ].join(' '),

  cardList: [
    'mt-8 flex flex-col gap-3',
  ].join(' '),

  card: [
    'flex items-center gap-4',
    colors.bg.yellow01,
    'rounded-2xl px-5 py-4',
    'cursor-pointer border-2 border-transparent',
    'transition-all active:scale-[0.98]',
  ].join(' '),

  cardSelected: [
    'flex items-center gap-4',
    colors.bg.yellow,
    'rounded-2xl px-5 py-4',
    'transition-all active:scale-[0.98]',
  ].join(' '),

  iconWrapper: [
    'w-12 h-12 rounded-2xl flex-shrink-0',
    'bg-white border border-[#D6D6DC]',
    'flex items-center justify-center',
  ].join(' '),

  icon: [
    'w-7 h-7',
  ].join(' '),

  textWrapper: [
    'flex flex-1 flex-col gap-0.5',
  ].join(' '),

  modeName: [
    typography.xl, typography.bold,
    'text-black',
  ].join(' '),

  modeDesc: [
    typography.xs, typography.medium,
    colors.text.gray01,
  ].join(' '),

  circle: [
    'w-9 h-9 rounded-full flex-shrink-0',
    'bg-white border border-[#D6D6DC]',
    'flex items-center justify-center',
  ].join(' '),

  checkIcon: [
    'w-5 h-5',
  ].join(' '),

  nextButton: [
    'mt-8 w-full rounded-2xl py-5',
    'flex items-center justify-center gap-1',
    typography.lg, typography.bold,
    'transition-colors',
  ].join(' '),

  nextButtonActive: [
    colors.bg.yellow,
    'text-black',
    colors.active.yellow,
  ].join(' '),

  nextButtonDisabled: [
    colors.bg.gray04,
    'text-[#9898A8] cursor-not-allowed',
  ].join(' '),

  nextButtonInner: [
    'flex items-center justify-center gap-1',
  ].join(' '),

  nextIcon: [
    'w-6 h-6 ltr:ml-1',
  ].join(' '),

  footerText: [
    'mt-3 text-center',
    typography.xs, typography.medium,
    colors.text.gray02,
  ].join(' '),
}

export default styles
