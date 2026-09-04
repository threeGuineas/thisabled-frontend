import typography from '../styles/typography'
import colors from '../styles/colors'

const shared = {
  tab: 'flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer',
  iconWrapper: 'px-4 py-1.5 flex items-center justify-center',
  icon: 'w-6 h-6',
  iconDim: 'w-6 h-6 opacity-40',
}

// nav는 각 화면의 (flex-col) container 안 마지막 자식으로 렌더된다.
// fixed 대신 sticky+mt-auto를 쓰는 이유: fixed는 transform으로 만든 #root의
// containing block에 의존하는데, 실기기 브라우저에서 스크롤 중 이 관계가 깨지는
// 경우가 있다(특히 iOS Safari). sticky는 그런 트릭 없이 스크롤 컨테이너를 그대로
// 따라가므로 더 확실하고, mt-auto는 콘텐츠가 화면보다 짧을 때도 nav를 화면 맨
// 아래로 밀어준다. (container의 pb-* 패딩은 이제 필요 없다 — nav가 실제 공간을
// 차지하므로 콘텐츠와 겹치지 않는다.)
const styles = {
  default: {
    ...shared,
    nav: [
      'sticky bottom-0 mt-auto',
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
      'sticky bottom-0 mt-auto',
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
      'sticky bottom-0 mt-auto',
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
      'sticky bottom-0 mt-auto',
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
