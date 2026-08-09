import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: [
    'flex min-h-screen flex-col',
    'bg-white px-6',
  ].join(' '),

  header: [
    'mt-[30vh] flex flex-col items-center',
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

  buttonSection: [
    'mt-16 flex flex-col gap-3',
  ].join(' '),

  kakaoButton: [
    'flex items-center justify-center gap-2.5',
    'w-full rounded-2xl py-4',
    'bg-[#FEE500]',
    typography.sm, typography.bold,
    'text-[rgba(0,0,0,0.85)]',
    'transition-opacity',
    'active:opacity-80',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),

  errorText: [
    'w-full rounded-xl',
    'bg-[#FFF5F5] px-4 py-3',
    typography.xs, typography.medium,
    'text-[#FF3B30] text-center',
  ].join(' '),
}

export default styles
