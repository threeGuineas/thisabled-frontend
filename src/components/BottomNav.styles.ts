import typography from '../styles/typography'
import colors from '../styles/colors'

const shared = {
  tab: 'flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer',
  iconWrapper: 'px-4 py-1.5 flex items-center justify-center',
  icon: 'w-6 h-6',
  iconDim: 'w-6 h-6 opacity-40',
}

const styles = {
  default: {
    ...shared,
    nav: [
      'fixed bottom-0 left-0 right-0',
      'h-20 bg-white',
      'border-t', colors.border.gray03,
      'flex items-center',
    ].join(' '),
    iconWrapperActive: [colors.bg.yellow, 'rounded-2xl px-4 py-1.5 flex items-center justify-center'].join(' '),
    labelActive: [typography.xs, typography.bold, 'text-black'].join(' '),
    label: [typography.xs, typography.medium, colors.text.gray02].join(' '),
  },
  blind: {
    ...shared,
    nav: [
      'fixed bottom-0 left-0 right-0',
      'h-20 bg-black',
      'border-t-2 border-[#FFD60A]',
      'flex items-center',
    ].join(' '),
    iconWrapperActive: 'bg-[#FFD60A]/20 border-2 border-[#FFD60A] rounded-2xl px-4 py-1.5 flex items-center justify-center',
    labelActive: 'text-xs font-bold text-[#FFD60A]',
    label: 'text-xs font-medium text-white/40',
  },
  hearing: {
    ...shared,
    nav: [
      'fixed bottom-0 left-0 right-0',
      'h-20', colors.bg.blue01,
      'border-t', colors.border.gray03,
      'flex items-center',
    ].join(' '),
    iconWrapperActive: [colors.bg.white, 'rounded-2xl px-4 py-1.5 flex items-center justify-center shadow-sm'].join(' '),
    labelActive: [typography.xs, typography.bold, colors.text.blue].join(' '),
    label: [typography.xs, typography.medium, colors.text.gray02].join(' '),
  },
  // 발달장애 모드 — DEV-01 "큰 버튼" 기준으로 터치 영역·아이콘·글자를 다른 모드보다 크게 키운다
  developmental: {
    tab: 'flex-1 flex flex-col items-center justify-center gap-1.5 py-3 cursor-pointer',
    iconWrapper: 'px-4 py-2 flex items-center justify-center',
    icon: 'w-8 h-8',
    iconDim: 'w-8 h-8 opacity-40',
    nav: [
      'fixed bottom-0 left-0 right-0',
      'h-24', colors.bg.green01,
      'border-t-2', colors.border.green,
      'flex items-center',
    ].join(' '),
    iconWrapperActive: [colors.bg.white, 'rounded-2xl px-4 py-2 flex items-center justify-center shadow-sm'].join(' '),
    labelActive: [typography.base, typography.bold, colors.text.green].join(' '),
    label: [typography.base, typography.semibold, colors.text.gray02].join(' '),
  },
}

export default styles
