import typography from '../../styles/typography'
import colors from '../../styles/colors'

const styles = {
  container: 'min-h-screen bg-black flex flex-col',

  header: 'flex items-center gap-4 px-6 pt-7 pb-4',
  backButton: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center flex-shrink-0',
  backIcon: 'w-6 h-6',
  headerTextGroup: 'flex flex-col',
  headerTitle: ['text-white', typography['2xl'], typography.bold].join(' '),
  headerSubtitle: ['text-white/70 mt-0.5', typography.sm, typography.regular].join(' '),

  divider: `border-t ${colors.border.yellow}`,

  body: 'flex flex-col px-6 pt-7 gap-5',
  bodyTitle: ['text-white', typography.lg, typography.bold].join(' '),

  categoryList: 'flex flex-col gap-3',

  card: 'flex items-center justify-between bg-[#161616] rounded-2xl px-5 py-4 border border-transparent',
  cardActive: `flex items-center justify-between bg-[#161616] rounded-2xl px-5 py-4 border-2 ${colors.border.yellow}`,
  cardLeft: 'flex flex-col gap-0.5 items-start',
  cardLabel: ['text-white', typography.xl, typography.bold].join(' '),
  cardLabelActive: [colors.text.yellow, typography.xl, typography.bold].join(' '),
  cardDesc: ['text-[#8A8A8A]', typography.sm, typography.regular].join(' '),
  cardDescActive: [colors.text.yellow, typography.sm, typography.regular].join(' '),

  checkButton: 'w-8 h-8 rounded-full border border-[#2A2A2A] bg-[#1F1F1F] flex items-center justify-center flex-shrink-0',
  checkButtonActive: `w-8 h-8 rounded-full border ${colors.border.yellow} ${colors.bg.yellow} flex items-center justify-center flex-shrink-0`,
  checkIcon: 'w-10 h-10',

  nextButton: [
    'mx-6 mb-8 mt-5 flex items-center justify-center gap-2',
    `${colors.bg.yellow} rounded-2xl px-5 py-6`,
    'active:opacity-90 transition-opacity',
  ].join(' '),
  nextText: ['text-black', typography.xl, typography.bold].join(' '),
  nextIcon: 'w-5 h-5',

  // 내용 작성
  textareaWrapper: 'flex-1 flex flex-col overflow-y-auto pb-52',
  textarea: [
    'flex-1 block mt-4 px-5 py-4 bg-[#161616] rounded-2xl mx-5 min-h-[200px]',
    'text-white resize-none overflow-hidden',
    'placeholder:text-[#8A8A8A] outline-none',
    typography.base, typography.regular,
  ].join(' '),

  editorFooter: 'fixed bottom-0 left-0 right-0 px-6 pb-8 pt-3 flex flex-col gap-3 bg-black',
  editorActions: 'flex items-center flex-wrap gap-2',

  photoButton: [
    'flex items-center justify-center gap-2 bg-[#161616] rounded-2xl px-5 py-5',
    'active:opacity-70',
  ].join(' '),
  photoIcon: 'w-5 h-5',
  photoText: ['text-white', typography.sm, typography.medium].join(' '),

  voiceButton: [
    'flex items-center gap-2 bg-[#161616] rounded-2xl px-6 py-5',
    'active:opacity-70',
  ].join(' '),
  voiceButtonRecording: [
    'flex items-center gap-2 bg-[#161616] border-2 border-red-400 rounded-2xl px-6 py-5',
    'active:opacity-70',
  ].join(' '),
  voiceButtonTranscribing: [
    'flex items-center gap-2 bg-[#161616] rounded-2xl px-6 py-5 opacity-50',
  ].join(' '),
  voiceIcon: 'w-5 h-5',
  voiceIconRecording: 'w-5 h-5 animate-pulse',
  voiceText: ['text-white', typography.sm, typography.medium].join(' '),

  submitButtonActive: [
    'flex items-center justify-center gap-3',
    `${colors.bg.yellow} rounded-2xl px-5 py-5`,
    'active:opacity-90 transition-opacity',
  ].join(' '),
  submitButtonInactive: [
    'flex items-center justify-center gap-3',
    'bg-[#1F1F1F] rounded-2xl px-5 py-5',
  ].join(' '),
  submitIcon: 'w-5 h-5',
  submitTextActive: ['text-black', typography.base, typography.bold].join(' '),
  submitTextInactive: ['text-[#8A8A8A]', typography.base, typography.bold].join(' '),

  retryButtonActive: [
    'flex items-center justify-center gap-3',
    `bg-transparent border-2 ${colors.border.yellow} rounded-2xl px-5 py-5`,
    'active:opacity-70 transition-opacity disabled:opacity-50',
  ].join(' '),
  retryTextActive: [colors.text.yellow, typography.base, typography.bold].join(' '),
}

export default styles