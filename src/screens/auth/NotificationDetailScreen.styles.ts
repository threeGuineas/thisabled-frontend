import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: 'min-h-screen bg-white flex flex-col',

  header: 'flex items-center gap-2 px-5 pt-6 pb-2',
  backButton: 'w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#F5F8FF]',
  backIcon: 'w-5 h-5',
  title: [typography.base, typography.bold, 'text-black'].join(' '),

  list: 'flex flex-col px-5 pt-3 gap-2',
  rowUnread: ['flex items-start gap-3 w-full text-left rounded-2xl px-4 py-3', colors.bg.blue01].join(' '),
  rowRead: 'flex items-start gap-3 w-full text-left rounded-2xl px-4 py-3 bg-white',

  iconWrapper: 'relative w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0',
  icon: 'w-5 h-5',
  unreadDot: 'absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-[#FF6A4D] border-2 border-white',

  textCol: 'flex-1 min-w-0 flex flex-col gap-0.5 pt-0.5',
  rowText: [typography.sm, typography.semibold, 'text-black'].join(' '),
  rowDetail: [typography.xs, typography.regular, 'text-[#757575] leading-snug'].join(' '),
  rowTime: [typography.xs, typography.regular, 'text-[#9898A8] mt-0.5'].join(' '),
}

export default styles
