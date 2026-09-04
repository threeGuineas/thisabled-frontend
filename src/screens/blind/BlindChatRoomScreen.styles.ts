import typography from '../../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col',

  header: 'flex flex-col px-6 pt-7 pb-4 gap-3',

  headerTopRow: 'flex items-center gap-3',
  backButton: 'w-12 h-12 rounded-2xl bg-[#1F1F1F] flex items-center justify-center flex-shrink-0',
  backIcon: 'w-6 h-6',
  callRow: 'flex items-center gap-2',
  callButton: 'flex-1 flex items-center justify-center gap-2 bg-[#1F1F1F] rounded-2xl px-4 py-4 active:opacity-70',
  callIcon: 'w-5 h-5',
  callText: ['text-white', typography.sm, typography.medium].join(' '),
  videoButton: 'flex-1 flex items-center justify-center gap-2 bg-[#1F1F1F] rounded-2xl px-4 py-4 active:opacity-70',
  videoIcon: 'w-5 h-5',
  videoText: ['text-white', typography.sm, typography.medium].join(' '),
  avatarWrapper: 'relative flex-shrink-0',
  avatar: 'w-14 h-14 rounded-full object-cover',
  userInfo: 'flex flex-col gap-1',
  userName: ['text-white', typography.xl, typography.bold].join(' '),

  dateDivider: 'flex items-center justify-center py-2',
  dateText: ['text-[#8A8A8A]', typography.xs, typography.regular].join(' '),

  loadingMoreRow: 'flex items-center justify-center py-2',
  loadingMoreText: ['text-white/40', typography.xs, typography.regular].join(' '),

  // 상대의 SAFE-05 전송 제한 해제 배너 (내가 수신자일 때만)
  restrictionBanner: 'mx-6 mt-4 flex items-center justify-between gap-3 rounded-2xl bg-[#2A1414] px-4 py-3',
  restrictionText: ['flex-1 text-red-300', typography.xs, typography.regular].join(' '),
  restrictionButton: ['flex-shrink-0 rounded-full bg-[#FFD60A] px-3 py-2 text-black disabled:opacity-40', typography.xs, typography.bold].join(' '),

  // 요청 방에서 상대 수락 대기 중 배너
  pendingBanner: 'mx-6 mt-4 rounded-2xl bg-[#1F1F1F] px-4 py-3',
  pendingBannerFixed: 'fixed left-6 right-6 bottom-6 z-30 rounded-2xl bg-[#1F1F1F] px-4 py-3',
  pendingText: ['text-white/60 text-center', typography.xs, typography.regular].join(' '),

  messageList: 'flex-1 flex flex-col px-6 gap-6 py-4 pb-40 overflow-y-auto',
  messageItem: 'flex flex-col gap-2',
  messageMeta: 'flex items-center gap-2',
  myName: ['text-[#FFD60A]', typography.sm, typography.semibold].join(' '),
  otherName: ['text-white', typography.sm, typography.semibold].join(' '),
  messageTime: ['text-[#8A8A8A]', typography.xs, typography.regular].join(' '),
  readIndicator: ['text-[#FFD60A]', typography.xs, typography.regular].join(' '),
  messageBubble: 'flex items-start gap-3',
  myBar: 'w-1 self-stretch rounded-full bg-[#FFD60A] flex-shrink-0 min-h-[1rem]',
  otherBar: 'w-1 self-stretch rounded-full bg-[#8A8A8A] flex-shrink-0 min-h-[1rem]',
  messageContent: ['text-white leading-relaxed', typography.base, typography.regular].join(' '),
  messageImage: 'max-w-[70%] rounded-2xl object-contain',
  messageVideo: 'max-w-[70%] rounded-2xl',
  messageDescription: ['mt-1 text-white/50 leading-relaxed', typography.xs, typography.regular].join(' '),

  blurredWrapper: 'flex flex-col items-start gap-2',
  blurredText: ['text-white/50 italic', typography.sm, typography.regular].join(' '),
  blurredActions: 'flex items-center gap-2',
  revealButton: ['rounded-full border border-[#FFD60A] px-3 py-1.5 text-[#FFD60A] disabled:opacity-40', typography.xs, typography.semibold].join(' '),
  blockButton: ['rounded-full border border-red-400 px-3 py-1.5 text-red-400 disabled:opacity-40', typography.xs, typography.semibold].join(' '),

  imagePreviewWrapper: 'relative mx-6 mb-2',
  imagePreview: 'w-full rounded-2xl object-contain',
  imageRemoveButton:
    'absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50 text-white text-sm font-bold',

  // 사진 전송 확인 팝업
  confirmOverlay: 'fixed inset-0 bg-black/70 z-40',
  confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-[#1A1A1A] rounded-t-3xl px-6 pt-6 pb-10',
  confirmImage: 'w-full max-h-60 object-contain rounded-2xl mb-5',
  confirmText: ['text-white text-center', typography.base, typography.bold].join(' '),
  confirmButtons: 'flex items-center gap-3 mt-5',
  confirmNoButton: [
    'flex-1 py-4 rounded-2xl border border-[#444444]',
    'flex items-center justify-center',
    'text-white active:opacity-70',
    typography.base, typography.medium,
  ].join(' '),
  confirmYesButton: [
    'flex-1 py-4 rounded-2xl bg-[#FFD60A]',
    'flex items-center justify-center',
    'text-black active:opacity-80',
    typography.base, typography.bold,
  ].join(' '),

  // 메인 바텀시트 (사진/음성 버튼)
  bottomSheet:
    'fixed bottom-0 left-0 right-0 px-6 pb-8 pt-4 bg-black flex items-stretch gap-3',
  photoButton:
    'flex-[3.5] flex flex-col items-center justify-center gap-2 bg-[#666666] rounded-2xl py-4 active:opacity-70',
  photoIcon: 'w-6 h-6',
  photoText: ['text-white', typography.xs, typography.medium].join(' '),
  voiceButton:
    'flex-[6.5] flex items-center justify-center gap-3 border border-[#FFD60A] rounded-2xl py-4 px-4 active:opacity-70',
  voiceIcon: 'w-5 h-5',
  voiceText: ['text-white', typography.base, typography.medium].join(' '),

  // 채팅 입력 바텀시트
  chatSheet: 'bg-[#1A1A1A] rounded-t-3xl px-6 pt-5 pb-8',

  sheetHeader: 'flex items-center justify-between mb-4',
  sheetTitle: ['text-white', typography.base, typography.bold].join(' '),
  sheetCancelButton: ['text-white/60 active:opacity-70', typography.sm, typography.regular].join(' '),

  sheetTextarea: [
    'w-full bg-[#2A2A2A] rounded-2xl px-4 py-3',
    'text-white resize-none h-28',
    'placeholder:text-white/30 outline-none',
    typography.sm, typography.regular,
  ].join(' '),

  sheetVoiceError: 'mt-1 text-xs text-red-400',

  sheetFooter: 'flex items-center gap-3 mt-4',
  sheetVoiceButton: [
    'flex-[4] flex items-center justify-center gap-2 border border-white/20 rounded-full py-5',
    'active:opacity-70',
  ].join(' '),
  sheetVoiceButtonRecording: [
    'flex-[4] flex items-center justify-center gap-2 border-2 border-red-400 rounded-full py-5',
    'active:opacity-70',
  ].join(' '),
  sheetVoiceButtonTranscribing: [
    'flex-[4] flex items-center justify-center gap-2 border border-white/20 rounded-full py-5 opacity-50',
  ].join(' '),
  sheetVoiceIcon: 'w-5 h-5',
  sheetVoiceIconRecording: 'w-5 h-5 animate-pulse',
  sheetVoiceText: ['text-white', typography.sm, typography.medium].join(' '),

  sheetSubmitInactive: [
    'flex-[6] flex items-center justify-center gap-2 bg-[#1F1F1F] rounded-full py-5',
  ].join(' '),
  sheetSubmitActive: [
    'flex-[6] flex items-center justify-center gap-2 bg-[#FFD60A] rounded-full py-5',
    'active:opacity-80',
  ].join(' '),
  sheetSubmitIcon: 'w-5 h-5',
  sheetSubmitTextInactive: ['text-[#8A8A8A]', typography.sm, typography.bold].join(' '),
  sheetSubmitTextActive: ['text-black', typography.sm, typography.bold].join(' '),
}

export default styles
