import typography from '../../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col',

  header: 'px-6 pt-7 pb-4',
  headerTitle: ['text-white', typography['3xl'], typography.bold].join(' '),

  section: 'px-6 mt-4',

  profileCard: 'bg-[#1F1F1F] rounded-2xl px-5 py-6 flex flex-col gap-5',

  profileRow: 'flex items-center gap-4',
  avatar: 'w-16 h-16 rounded-2xl object-cover',
  nickname: ['text-white', typography.xl, typography.bold].join(' '),

  editButton: [
    'w-full rounded-xl border border-white/10 py-3',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  editButtonText: ['text-white', typography.sm, typography.semibold].join(' '),

  modeSection: 'px-6 mt-6',
  modeSectionTitle: ['text-white', typography.xl, typography.bold].join(' '),
  modeCard: 'mt-3 bg-[#1F1F1F] rounded-2xl flex flex-col',
  modeList: 'flex flex-col',

  modeButton: [
    'w-full flex items-center justify-between px-4 py-4',
    'rounded-2xl bg-[#1F1F1F]',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  modeButtonActive: [
    'w-full flex items-center justify-between px-4 py-4',
    'bg-[#FFD60A1A]',
    'active:opacity-80 transition-opacity',
  ].join(' '),

  modeDivider: 'h-px bg-white/5 mx-1',

  modeTextGroup: 'flex flex-col gap-0.5 text-left',
  modeTitle: ['text-white', typography.sm, typography.extrabold].join(' '),
  modeDesc: ['text-white/50', typography.xs, typography.regular].join(' '),
  modeIcon: 'w-5 h-5 flex-shrink-0',

  etcSection: 'px-6 mt-6',
  etcSectionTitle: ['text-white', typography.xl, typography.bold].join(' '),
  etcCard: 'mt-3 bg-[#1F1F1F] rounded-2xl flex flex-col',
  etcList: 'flex flex-col',
  etcDivider: 'h-px bg-white/5 mx-1',

  etcButton: [
    'w-full flex items-center gap-3 px-4 py-4',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  etcIconWrapper: 'w-9 h-9 rounded-xl bg-[#666666] flex items-center justify-center flex-shrink-0',
  etcIcon: 'w-5 h-5',
  etcTextGroup: 'flex-1 flex flex-col gap-0.5 text-left',
  etcTitle: ['text-white', typography.sm, typography.extrabold].join(' '),
  etcDesc: ['text-white/50', typography.xs, typography.regular].join(' '),
  etcRightIcon: 'w-5 h-5 flex-shrink-0',

  logoutButton: [
    'mx-6 mt-4 w-[calc(100%-3rem)] rounded-2xl border border-[#2A2A2A] py-4',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  logoutText: ['text-white', typography.sm, typography.semibold].join(' '),

  overlay: 'fixed inset-0 bg-black/60 z-40',

  bottomSheet: [
    'fixed bottom-0 left-0 right-0 z-50',
    'bg-[#1A1A1A] rounded-t-3xl px-6 pt-6 pb-10',
    'flex flex-col items-center gap-4',
    'transition-transform duration-300',
  ].join(' '),
  bottomSheetOpen: 'translate-y-0',
  bottomSheetClosed: 'translate-y-full',

  sheetHandle: 'w-10 h-1 rounded-full bg-white/20 mb-1',

  sheetTitle: ['text-white', typography['2xl'], typography.bold].join(' '),

  sheetTextGroup: 'flex flex-col items-center gap-1 text-center',
  sheetQuestion: ['text-white', typography.base, typography.regular].join(' '),
  sheetQuestionHighlight: ['text-[#FFD60A]', typography.base, typography.semibold].join(' '),
  sheetDesc: ['text-white', typography.base, typography.regular].join(' '),

  sheetConfirmButton: [
    'w-full bg-[#FFD60A] rounded-2xl py-4',
    'flex items-center justify-center mt-2',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  sheetConfirmText: ['text-black', typography.base, typography.bold].join(' '),

  sheetCancelButton: [
    'w-full rounded-2xl py-4 border border-[#2A2A2A]',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  sheetCancelText: ['text-white/60', typography.base, typography.medium].join(' '),

  errorText: ['text-[#FF6B6B]', typography.xs, typography.medium, 'mt-2 text-center'].join(' '),

  // 관심사 태그 (마이페이지 요약)
  tagsSection: 'px-6 mt-6',
  tagsSectionTitle: ['text-white', typography.xl, typography.bold].join(' '),
  tagsCard: 'mt-3 bg-[#1F1F1F] rounded-2xl px-5 py-5 flex flex-col gap-4',
  tagsChipRow: 'flex flex-wrap gap-2',
  tagsChip: ['px-3 py-1.5 rounded-full bg-[#2A2A2A] text-white', typography.xs, typography.medium].join(' '),
  tagsEmptyText: ['text-white/40', typography.xs, typography.regular].join(' '),
  tagsEditButton: [
    'w-full rounded-xl border border-white/10 py-3',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  tagsEditButtonText: ['text-white', typography.sm, typography.semibold].join(' '),

  // 설정 (비친구 메시지 요청 허용 등)
  settingsSection: 'px-6 mt-6',
  settingsSectionTitle: ['text-white', typography.xl, typography.bold].join(' '),
  settingsCard: 'mt-3 bg-[#1F1F1F] rounded-2xl flex flex-col',
  settingsRow: 'w-full flex items-center gap-3 px-4 py-4',
  settingsTextGroup: 'flex-1 flex flex-col gap-0.5 text-left',
  settingsTitle: ['text-white', typography.sm, typography.extrabold].join(' '),
  settingsDesc: ['text-white/50', typography.xs, typography.regular].join(' '),

  toggleTrack: 'w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0',
  toggleTrackOn: 'bg-[#FFD60A]',
  toggleTrackOff: 'bg-[#3A3A3A]',
  toggleKnob: 'w-5 h-5 rounded-full bg-white transition-transform',
  toggleKnobOn: 'translate-x-5',
  toggleKnobOff: 'translate-x-0',

  withdrawLink: 'mx-6 mt-4 flex items-center justify-center py-2 active:opacity-70 transition-opacity',
  withdrawLinkText: ['text-white/40', typography.xs, typography.medium].join(' '),

  // 하위 화면 공통 헤더 (프로필 편집 · 태그 편집 · 회원 탈퇴)
  subHeader: 'px-6 pt-7 pb-4 flex items-center gap-3',
  subBackButton: 'w-8 h-8 flex items-center justify-center active:opacity-70 transition-opacity',
  subBackIcon: 'w-5 h-5',
  subHeaderTitle: ['text-white', typography.xl, typography.bold].join(' '),

  // 프로필 편집
  editForm: 'px-6 flex flex-col gap-6 pb-10',
  editAvatarRow: 'flex flex-col items-center gap-3',
  editAvatarWrapper: 'relative w-24 h-24',
  editAvatar: 'w-24 h-24 rounded-full object-cover bg-[#2A2A2A]',
  editAvatarButton: [
    typography.xs, typography.semibold,
    'text-[#FFD60A] active:opacity-70 transition-opacity',
  ].join(' '),
  editFieldWrapper: 'flex flex-col gap-2',
  editLabel: ['text-white', typography.sm, typography.semibold].join(' '),
  editInput: [
    'w-full rounded-xl bg-[#1F1F1F] border border-white/10 px-4 py-3',
    'text-white', typography.base, typography.regular,
    'placeholder:text-white/30 outline-none focus:border-[#FFD60A]',
  ].join(' '),
  editTextarea: [
    'w-full rounded-xl bg-[#1F1F1F] border border-white/10 px-4 py-3 min-h-28 resize-none',
    'text-white', typography.base, typography.regular,
    'placeholder:text-white/30 outline-none focus:border-[#FFD60A]',
  ].join(' '),
  editCounter: ['text-white/40', typography.xs, typography.regular, 'self-end'].join(' '),
  editFieldError: ['text-[#FF6B6B]', typography.xs, typography.medium].join(' '),
  editApiError: [
    'rounded-xl bg-[#2A1414] px-4 py-3',
    'text-[#FF6B6B]', typography.xs, typography.medium,
  ].join(' '),
  editSaveButton: [
    'w-full bg-[#FFD60A] rounded-2xl py-4',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity disabled:opacity-40',
  ].join(' '),
  editSaveButtonText: ['text-black', typography.base, typography.bold].join(' '),

  // 태그 편집 (다크 테마)
  tagEditBody: 'px-6 flex flex-col gap-4 pb-10',
  tagEditCounter: ['text-white/50', typography.xs, typography.medium, 'text-right'].join(' '),
  categoryGroup: 'flex flex-col',
  categoryButton: [
    'w-full flex items-center justify-between rounded-2xl bg-[#1F1F1F]',
    'px-4 py-3.5 transition-colors',
  ].join(' '),
  categoryButtonOpen: [
    'w-full flex items-center justify-between rounded-2xl rounded-b-none',
    'bg-[#2A2610] border border-[#FFD60A] border-b-0',
    'px-4 py-3.5 transition-colors',
  ].join(' '),
  categoryButtonLeft: 'flex items-center gap-2',
  categoryLabel: ['text-white/80', typography.sm, typography.semibold].join(' '),
  categoryLabelOpen: ['text-white', typography.sm, typography.semibold].join(' '),
  categoryCount: ['text-[#FFD60A]', typography.xs, typography.bold].join(' '),
  chevronIcon: 'w-4 h-4 transition-transform duration-150',
  chevronIconOpen: 'w-4 h-4 transition-transform duration-150 rotate-90',
  tagPanel: [
    'flex flex-wrap gap-2 rounded-2xl rounded-t-none',
    'border border-t-0 border-[#FFD60A] bg-[#161616]',
    'px-4 py-3.5',
  ].join(' '),
  tagChip: ['px-3 py-2 rounded-full bg-[#2A2A2A] text-white/70', typography.xs, typography.medium].join(' '),
  tagChipSelected: ['px-3 py-2 rounded-full bg-[#FFD60A] text-black', typography.xs, typography.semibold].join(' '),
  tagChipDisabled: ['px-3 py-2 rounded-full bg-[#2A2A2A] text-white/20', typography.xs, typography.medium].join(' '),

  // 회원 탈퇴
  withdrawBody: 'px-6 flex flex-col gap-6 pb-10',
  withdrawWarning: [
    'rounded-2xl bg-[#2A1414] px-5 py-4',
    'text-[#FF6B6B]', typography.sm, typography.medium,
  ].join(' '),
  withdrawOptionGroup: 'flex flex-col gap-3',
  withdrawOption: 'w-full flex items-start gap-3 rounded-2xl bg-[#1F1F1F] px-4 py-4 text-left active:opacity-80 transition-opacity',
  withdrawOptionSelected: 'w-full flex items-start gap-3 rounded-2xl bg-[#2A2610] border border-[#FFD60A] px-4 py-4 text-left active:opacity-80 transition-opacity',
  withdrawRadio: 'w-4 h-4 rounded-full border border-white/30 mt-0.5 flex-shrink-0',
  withdrawRadioSelected: 'w-4 h-4 rounded-full border-[5px] border-[#FFD60A] mt-0.5 flex-shrink-0',
  withdrawOptionTextGroup: 'flex flex-col gap-0.5',
  withdrawOptionTitle: ['text-white', typography.sm, typography.semibold].join(' '),
  withdrawOptionDesc: ['text-white/50', typography.xs, typography.regular].join(' '),
  withdrawSubmitButton: [
    'w-full rounded-2xl py-4 bg-[#FF3B30]',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity disabled:opacity-40',
  ].join(' '),
  withdrawSubmitText: ['text-white', typography.base, typography.bold].join(' '),

  confirmOverlay: 'fixed inset-0 bg-black/60 z-40',
  confirmModal: [
    'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50',
    'w-[calc(100%-3rem)] max-w-sm rounded-2xl bg-[#1F1F1F] px-6 py-6',
    'flex flex-col items-center gap-4',
  ].join(' '),
  confirmText: ['text-white', typography.base, typography.medium, 'text-center'].join(' '),
  confirmButtons: 'w-full flex gap-3',
  confirmNoButton: [
    'flex-1 rounded-xl py-3 border border-[#2A2A2A]',
    'text-white/60', typography.sm, typography.medium,
    'active:opacity-80 transition-opacity',
  ].join(' '),
  confirmYesButton: [
    'flex-1 rounded-xl py-3 bg-[#FF3B30]',
    'text-white', typography.sm, typography.bold,
    'active:opacity-80 transition-opacity disabled:opacity-40',
  ].join(' '),

  // 글자 크기 · 대비
  fontSettingsBody: 'px-6 flex flex-col gap-6 pb-10',
  fontPreviewCard: 'rounded-2xl bg-[#1F1F1F] px-6 py-10 flex items-center justify-center',
  fontPreviewCardHighContrast: 'rounded-2xl bg-black border-2 border-white px-6 py-10 flex items-center justify-center',
  fontPreviewTextSmall: ['text-white', typography.sm, typography.medium].join(' '),
  fontPreviewTextMedium: ['text-white', typography.lg, typography.semibold].join(' '),
  fontPreviewTextLarge: ['text-white', typography['3xl'], typography.bold].join(' '),
  fontScaleRow: 'flex gap-2',
  fontScaleButton: [
    'flex-1 rounded-xl bg-[#1F1F1F] border border-white/10 py-3',
    'flex items-center justify-center',
    'text-white/70', typography.sm, typography.medium,
    'active:opacity-80 transition-opacity',
  ].join(' '),
  fontScaleButtonActive: [
    'flex-1 rounded-xl bg-[#2A2610] border border-[#FFD60A] py-3',
    'flex items-center justify-center',
    'text-[#FFD60A]', typography.sm, typography.bold,
    'active:opacity-80 transition-opacity',
  ].join(' '),

  // 친구 및 차단 사용자 관리
  contactsBody: 'px-6 flex flex-col gap-3 pb-10',
  contactsSectionTitle: ['text-white mt-3', typography.base, typography.bold].join(' '),
  contactsList: 'flex flex-col gap-2',
  contactsRow: 'w-full flex items-center gap-3 rounded-2xl bg-[#1F1F1F] px-4 py-3',
  contactsAvatar: 'w-10 h-10 rounded-full object-cover flex-shrink-0',
  contactsNickname: ['flex-1 text-white', typography.sm, typography.semibold].join(' '),
  contactsActionButton: [
    'rounded-lg border border-white/15 px-3 py-2',
    'text-white/70', typography.xs, typography.medium,
    'active:opacity-80 transition-opacity',
  ].join(' '),
}

export default styles
