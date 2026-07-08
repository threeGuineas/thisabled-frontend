import typography from '../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col',

  header: 'flex items-center gap-4 px-6 pt-7 pb-4',
  backButton: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center flex-shrink-0',
  backIcon: 'w-6 h-6',
  headerTextGroup: 'flex flex-col',
  headerTitle: ['text-white', typography['2xl'], typography.bold].join(' '),
  headerCount: 'text-[#FFD60A]',
  headerSubtitle: ['text-white/70 mt-0.5', typography.sm, typography.regular].join(' '),

  divider: 'border-t border-[#FFD60A]',

  commentList: 'flex-1 px-6 pt-5 flex flex-col gap-6 overflow-y-auto',

  commentItem: 'flex flex-col gap-2',
  commentTop: 'flex items-start gap-3',
  avatar: 'w-11 h-11 rounded-full object-cover flex-shrink-0',
  commentMeta: 'flex flex-col justify-center pt-0.5',
  nickname: ['text-white', typography.sm, typography.semibold].join(' '),
  time: ['text-white/60 mt-0.5', typography.xs, typography.regular].join(' '),
  commentBody: ['text-white leading-relaxed pl-14', typography.sm, typography.regular].join(' '),
  editedTag: 'text-white/40 ml-1',

  commentActions: 'flex items-center gap-4 pl-14',
  commentActionButton: ['text-white/50 active:opacity-70 disabled:opacity-40', typography.xs, typography.medium].join(' '),
  commentActionButtonDanger: ['text-red-400 active:opacity-70 disabled:opacity-40', typography.xs, typography.medium].join(' '),

  floatingButton: [
    'fixed bottom-6 left-6 right-6 z-30',
    'flex items-center justify-center gap-3',
    'bg-[#FFD60A] rounded-2xl px-5 py-4',
    'active:opacity-90 transition-opacity',
  ].join(' '),
  chatIcon: 'w-5 h-5',
  addCommentText: ['text-black', typography.base, typography.bold].join(' '),

  // 바텀시트
  overlay: 'fixed inset-0 bg-black/60 z-40',
  bottomSheet: [
    'fixed bottom-0 left-0 right-0 z-50',
    'bg-[#1A1A1A] rounded-t-3xl px-6 pt-5 pb-8',
    'transition-transform duration-300',
  ].join(' '),
  bottomSheetOpen: 'translate-y-0',
  bottomSheetClosed: 'translate-y-full',

  sheetHeader: 'flex items-center justify-between mb-4',
  sheetTitle: ['text-white', typography.base, typography.bold].join(' '),
  sheetCancelButton: ['text-white/60 active:opacity-70', typography.sm, typography.regular].join(' '),

  sheetTextarea: [
    'w-full bg-[#2A2A2A] rounded-2xl px-4 py-3',
    'text-white resize-none h-28',
    'placeholder:text-white/30 outline-none',
    typography.sm, typography.regular,
  ].join(' '),

  sheetFooter: 'flex items-center justify-between mt-2',
  voiceButton: [
    'flex items-center gap-2 border border-white/20 rounded-full px-8 py-5',
    'active:opacity-70',
  ].join(' '),
  voiceButtonRecording: [
    'flex items-center gap-2 border-2 border-red-400 rounded-full px-8 py-5',
    'active:opacity-70',
  ].join(' '),
  voiceButtonTranscribing: [
    'flex items-center gap-2 border border-white/20 rounded-full px-8 py-5 opacity-50',
  ].join(' '),
  voiceIcon: 'w-5 h-5',
  voiceIconRecording: 'w-5 h-5 animate-pulse',
  voiceText: ['text-white', typography.sm, typography.medium].join(' '),

  submitButtonInactive: [
    'flex items-center gap-2 bg-[#1F1F1F] rounded-full px-10 py-5',
  ].join(' '),
  submitButtonActive: [
    'flex items-center gap-2 bg-[#FFD60A] rounded-full px-10 py-5',
    'active:opacity-80',
  ].join(' '),
  submitIcon: 'w-5 h-5',
  submitTextInactive: ['text-[#8A8A8A]', typography.sm, typography.bold].join(' '),
  submitTextActive: ['text-black', typography.sm, typography.bold].join(' '),
}

export default styles
