import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: 'min-h-screen bg-white flex flex-col',

  header: 'flex items-center justify-between px-5 pt-6 pb-3',
  headerLeft: 'flex items-center gap-3',
  backButton: 'w-10 h-10 -ml-2 rounded-full flex items-center justify-center active:bg-[#F7F7F9]',
  backIcon: 'w-5 h-5',
  headerTitle: [typography.lg, typography.bold, 'text-black'].join(' '),

  submitButton: 'rounded-full px-4 py-2 active:opacity-80',
  submitButtonActive: [colors.bg.yellow, 'rounded-full px-4 py-2 active:opacity-80'].join(' '),
  submitButtonInactive: [colors.bg.gray04, 'rounded-full px-4 py-2'].join(' '),
  submitTextActive: [typography.sm, typography.bold, 'text-black'].join(' '),
  submitTextInactive: [typography.sm, typography.bold, 'text-[#9898A8]'].join(' '),

  retryButtonActive: ['bg-transparent border-2', colors.border.gray02, 'rounded-full px-4 py-2 active:opacity-70 disabled:opacity-50'].join(' '),
  retryTextActive: [typography.sm, typography.bold, colors.text.gray02].join(' '),

  categorySection: ['px-5 py-3 border-b overflow-x-auto scrollbar-hide', colors.border.gray03].join(' '),
  categoryList: 'flex gap-2 w-max',
  categoryChipActive: [colors.bg.gray02, colors.text.white, 'rounded-full px-4 py-2', typography.sm, typography.bold].join(' '),
  categoryChipInactive: [colors.bg.gray04, colors.text.gray01, 'rounded-full px-4 py-2', typography.sm, typography.medium].join(' '),

  contentSection: 'flex-1 px-5 py-4 flex flex-col',
  textarea: [
    'flex-1 w-full outline-none resize-none min-h-[200px]',
    'text-black placeholder:text-[#9898A8]',
    typography.base, typography.regular, 'leading-relaxed',
  ].join(' '),

  imagePreviewRow: 'flex gap-2 px-5 pb-3',
  imagePreviewItem: 'relative w-20 h-20 flex-shrink-0',
  imagePreviewImg: ['w-full h-full rounded-xl object-cover', colors.bg.gray04].join(' '),
  imageRemoveButton: 'absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-black/60 flex items-center justify-center text-white text-xs leading-none',

  errorText: 'px-5 pb-3 text-xs text-red-500',

  footer: ['flex items-center justify-between px-5 py-4 border-t', colors.border.gray03].join(' '),
  photoButton: 'flex items-center gap-1.5 active:opacity-70 disabled:opacity-40',
  photoIcon: 'w-5 h-5',
  photoText: [typography.sm, typography.medium, 'text-black'].join(' '),
  charCount: [typography.xs, typography.medium, 'text-[#9898A8]'].join(' '),
}

export default styles
