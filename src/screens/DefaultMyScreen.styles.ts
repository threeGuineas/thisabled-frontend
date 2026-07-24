import typography from '../styles/typography'
import colors from '../styles/colors'

const styles = {
  // 목록형 메인 화면 — 옅은 회색 캔버스 위에 흰 카드를 얹어 입체감을 준다
  container: 'min-h-screen bg-[#F7F7F9] flex flex-col pb-24',
  // 편집/상세 화면 — 단일 목적 폼이라 카드 구분 없이 흰 배경 그대로 사용
  subContainer: 'min-h-screen bg-white flex flex-col pb-10',

  header: 'px-5 pt-6 pb-2',
  headerTitle: [typography['2xl'], typography.bold, 'text-black'].join(' '),

  section: 'px-5 mt-5',

  profileCard: 'bg-white rounded-3xl px-5 py-5 flex flex-col gap-4 shadow-sm',
  profileRow: 'flex items-center justify-between gap-3',
  profileInfo: 'flex items-center gap-4 min-w-0',
  avatar: [colors.bg.gray04, 'w-16 h-16 rounded-2xl object-cover ring-1 ring-black/5'].join(' '),
  nickname: ['text-black truncate', typography.xl, typography.bold].join(' '),

  editButton: [
    'flex-shrink-0 rounded-full px-4 py-2', colors.bg.gray04,
    'flex items-center justify-center',
    'active:bg-[#EBEBEF] transition-colors',
  ].join(' '),
  editButtonText: ['text-black', typography.xs, typography.semibold].join(' '),

  modeSection: 'px-5 mt-8',
  modeSectionTitle: ['text-[#666666]', typography.sm, typography.bold, 'px-1'].join(' '),
  modeCard: 'mt-2 bg-white rounded-3xl flex flex-col shadow-sm overflow-hidden',
  modeList: 'flex flex-col',

  modeButton: [
    'w-full flex items-center justify-between pl-[13px] pr-4 py-4',
    'border-l-[3px] border-transparent bg-white',
    'active:bg-[#F7F7F9] transition-colors',
  ].join(' '),
  modeButtonActive: [
    'w-full flex items-center justify-between pl-[13px] pr-4 py-4',
    'border-l-[3px] border-[#FFD60A]', colors.bg.yellow01,
    'transition-colors',
  ].join(' '),

  modeDivider: ['h-px mx-1', colors.bg.gray03].join(' '),

  modeTextGroup: 'flex flex-col gap-0.5 text-left',
  modeTitle: ['text-black', typography.sm, typography.extrabold].join(' '),
  modeDesc: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),
  modeIcon: 'w-5 h-5 flex-shrink-0',

  etcSection: 'px-5 mt-8',
  etcSectionTitle: ['text-[#666666]', typography.sm, typography.bold, 'px-1'].join(' '),
  etcCard: 'mt-2 bg-white rounded-3xl flex flex-col shadow-sm overflow-hidden',
  etcList: 'flex flex-col',
  etcDivider: ['h-px mx-1', colors.bg.gray03].join(' '),

  etcButton: [
    'w-full flex items-center gap-3 px-4 py-4',
    'active:bg-[#F7F7F9] transition-colors',
  ].join(' '),
  etcIconWrapper: [colors.bg.yellow01, 'w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0'].join(' '),
  etcIcon: 'w-5 h-5',
  etcTextGroup: 'flex-1 flex flex-col gap-0.5 text-left',
  etcTitle: ['text-black', typography.sm, typography.extrabold].join(' '),
  etcDesc: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),
  etcRightIcon: 'w-5 h-5 flex-shrink-0',

  logoutButton: [
    'mx-5 mt-6 w-[calc(100%-2.5rem)] rounded-2xl bg-white shadow-sm py-4',
    'flex items-center justify-center',
    'active:bg-[#F7F7F9] transition-colors',
  ].join(' '),
  logoutText: ['text-black', typography.sm, typography.semibold].join(' '),

  overlay: 'fixed inset-0 bg-black/40 z-40',

  bottomSheet: [
    'fixed bottom-0 left-0 right-0 z-50',
    'bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl',
    'flex flex-col items-center gap-4',
    'transition-transform duration-300',
  ].join(' '),
  bottomSheetOpen: 'translate-y-0',
  bottomSheetClosed: 'translate-y-full',

  sheetHandle: ['w-10 h-1 rounded-full mb-1', colors.bg.gray03].join(' '),

  sheetTitle: ['text-black', typography['2xl'], typography.bold].join(' '),

  sheetTextGroup: 'flex flex-col items-center gap-1 text-center',
  sheetQuestion: ['text-black', typography.base, typography.regular].join(' '),
  sheetQuestionHighlight: ['text-black', typography.base, typography.extrabold].join(' '),
  sheetDesc: ['text-[#9898A8]', typography.base, typography.regular].join(' '),

  sheetConfirmButton: [
    'w-full rounded-2xl py-4', colors.bg.yellow,
    'flex items-center justify-center mt-2',
    'active:opacity-80 transition-opacity',
  ].join(' '),
  sheetConfirmText: ['text-black', typography.base, typography.bold].join(' '),

  sheetCancelButton: [
    'w-full rounded-2xl py-4 border', colors.border.gray03,
    'flex items-center justify-center',
    'active:bg-[#F7F7F9] transition-colors',
  ].join(' '),
  sheetCancelText: ['text-[#9898A8]', typography.base, typography.medium].join(' '),

  errorText: ['text-red-500', typography.xs, typography.medium, 'mt-2 text-center'].join(' '),

  // 관심사 태그 (마이페이지 요약)
  tagsSection: 'px-5 mt-8',
  tagsSectionHeader: 'flex items-center justify-between mb-2 px-1',
  tagsSectionTitle: ['text-[#666666]', typography.sm, typography.bold].join(' '),
  tagsCard: 'bg-white rounded-3xl px-5 py-5 flex flex-col gap-3 shadow-sm',
  tagsChipRow: 'flex flex-wrap gap-2',
  tagsChip: [colors.bg.gray04, 'px-3 py-1.5 rounded-full text-black', typography.xs, typography.medium].join(' '),
  tagsEmptyText: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),
  tagsEditButton: [
    'flex-shrink-0 rounded-full px-3 py-1.5 bg-white shadow-sm',
    'flex items-center justify-center',
    'active:bg-[#F7F7F9] transition-colors',
  ].join(' '),
  tagsEditButtonText: ['text-black', typography.xs, typography.semibold].join(' '),

  // 설정 (비친구 메시지 요청 허용 등)
  settingsSection: 'px-5 mt-8',
  settingsSectionTitle: ['text-[#666666]', typography.sm, typography.bold, 'px-1'].join(' '),
  settingsCard: 'mt-2 bg-white rounded-3xl flex flex-col shadow-sm',
  settingsRow: 'w-full flex items-center gap-3 px-4 py-4',
  settingsTextGroup: 'flex-1 flex flex-col gap-0.5 text-left',
  settingsTitle: ['text-black', typography.sm, typography.extrabold].join(' '),
  settingsDesc: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),

  toggleTrack: 'w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0',
  toggleTrackOn: colors.bg.yellow,
  toggleTrackOff: colors.bg.gray03,
  toggleKnob: 'w-5 h-5 rounded-full bg-white transition-transform shadow-sm',
  toggleKnobOn: 'translate-x-5',
  toggleKnobOff: 'translate-x-0',

  withdrawLink: 'mx-5 mt-5 flex items-center justify-center py-2 active:opacity-70 transition-opacity',
  withdrawLinkText: ['text-[#9898A8]', typography.xs, typography.medium].join(' '),

  // 하위 화면 공통 헤더 (프로필 편집 · 태그 편집 · 회원 탈퇴 · 친구/차단 관리)
  subHeader: 'px-5 pt-6 pb-4 flex items-center gap-3',
  subBackButton: 'w-8 h-8 -ml-1 rounded-full flex items-center justify-center active:bg-[#F7F7F9] transition-colors',
  subBackIcon: 'w-5 h-5',
  subHeaderTitle: ['text-black', typography.xl, typography.bold].join(' '),

  // 프로필 편집
  editForm: 'px-5 flex flex-col gap-6 pb-10',
  editAvatarRow: 'flex flex-col items-center gap-3',
  editAvatarWrapper: 'relative w-24 h-24',
  editAvatar: [colors.bg.gray04, 'w-24 h-24 rounded-full object-cover ring-1 ring-black/5'].join(' '),
  editAvatarButton: [
    colors.bg.gray04,
    'rounded-full px-4 py-2 text-black',
    typography.xs, typography.semibold,
    'active:opacity-70 transition-opacity',
  ].join(' '),
  editFieldWrapper: 'flex flex-col gap-2',
  editLabel: ['text-black', typography.sm, typography.semibold].join(' '),
  editInput: [
    colors.bg.gray04,
    'w-full rounded-xl border-2 border-transparent px-4 py-3',
    'text-black', typography.base, typography.regular,
    'placeholder:text-[#9898A8] outline-none focus:bg-white focus:border-[#FFD60A]',
  ].join(' '),
  editTextarea: [
    colors.bg.gray04,
    'w-full rounded-xl border-2 border-transparent px-4 py-3 min-h-28 resize-none',
    'text-black', typography.base, typography.regular,
    'placeholder:text-[#9898A8] outline-none focus:bg-white focus:border-[#FFD60A]',
  ].join(' '),
  editCounter: ['text-[#9898A8]', typography.xs, typography.regular, 'self-end'].join(' '),
  editFieldError: ['text-red-500', typography.xs, typography.medium].join(' '),
  editApiError: [
    'rounded-xl bg-red-50 px-4 py-3',
    'text-red-500', typography.xs, typography.medium,
  ].join(' '),
  editSaveButton: [
    'w-full rounded-2xl py-4', colors.bg.yellow,
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity disabled:opacity-40',
  ].join(' '),
  editSaveButtonText: ['text-black', typography.base, typography.bold].join(' '),

  // 태그 편집
  tagEditBody: 'px-5 flex flex-col gap-4 pb-10',
  tagEditCounter: ['text-[#9898A8]', typography.xs, typography.medium, 'text-right'].join(' '),
  categoryGroup: 'flex flex-col',
  categoryButton: [
    colors.bg.gray04,
    'w-full flex items-center justify-between rounded-2xl',
    'px-4 py-3.5 transition-colors',
  ].join(' '),
  categoryButtonOpen: [
    colors.bg.yellow01, 'border', colors.border.yellow, 'border-b-0',
    'w-full flex items-center justify-between rounded-2xl rounded-b-none',
    'px-4 py-3.5 transition-colors',
  ].join(' '),
  categoryButtonLeft: 'flex items-center gap-2',
  categoryLabel: ['text-[#666666]', typography.sm, typography.semibold].join(' '),
  categoryLabelOpen: ['text-black', typography.sm, typography.semibold].join(' '),
  categoryCount: [
    colors.bg.yellow, 'text-black min-w-[18px] h-[18px] px-1 rounded-full',
    'flex items-center justify-center', typography.xs, typography.bold,
  ].join(' '),
  chevronIcon: 'w-4 h-4 transition-transform duration-150',
  chevronIconOpen: 'w-4 h-4 transition-transform duration-150 rotate-90',
  tagPanel: [
    'flex flex-wrap gap-2 rounded-2xl rounded-t-none',
    'border border-t-0', colors.border.yellow, colors.bg.yellow01,
    'px-4 py-3.5',
  ].join(' '),
  tagChip: [colors.bg.white, 'border', colors.border.gray03, 'px-3 py-2 rounded-full text-[#666666]', typography.xs, typography.medium].join(' '),
  tagChipSelected: [colors.bg.yellow, 'px-3 py-2 rounded-full text-black', typography.xs, typography.semibold].join(' '),
  tagChipDisabled: [colors.bg.white, 'border', colors.border.gray03, 'px-3 py-2 rounded-full text-[#C7C7CC]', typography.xs, typography.medium].join(' '),

  // 회원 탈퇴
  withdrawBody: 'px-5 flex flex-col gap-6 pb-10',
  withdrawWarning: [
    'rounded-2xl bg-red-50 px-5 py-4',
    'text-red-500', typography.sm, typography.medium,
  ].join(' '),
  withdrawOptionGroup: 'flex flex-col gap-3',
  withdrawOption: [colors.bg.gray04, 'w-full flex items-start gap-3 rounded-2xl px-4 py-4 text-left active:opacity-80 transition-opacity'].join(' '),
  withdrawOptionSelected: [colors.bg.yellow01, 'border', colors.border.yellow, 'w-full flex items-start gap-3 rounded-2xl px-4 py-4 text-left active:opacity-80 transition-opacity'].join(' '),
  withdrawRadio: 'w-4 h-4 rounded-full border border-[#D6D6DC] mt-0.5 flex-shrink-0',
  withdrawRadioSelected: ['w-4 h-4 rounded-full border-[5px] mt-0.5 flex-shrink-0', colors.border.yellow].join(' '),
  withdrawOptionTextGroup: 'flex flex-col gap-0.5',
  withdrawOptionTitle: ['text-black', typography.sm, typography.semibold].join(' '),
  withdrawOptionDesc: ['text-[#9898A8]', typography.xs, typography.regular].join(' '),
  withdrawSubmitButton: [
    'w-full rounded-2xl py-4 bg-[#FF3B30]',
    'flex items-center justify-center',
    'active:opacity-80 transition-opacity disabled:opacity-40',
  ].join(' '),
  withdrawSubmitText: ['text-white', typography.base, typography.bold].join(' '),

  confirmOverlay: 'fixed inset-0 bg-black/40 z-40',
  confirmModal: 'fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl px-6 pt-6 pb-10 shadow-2xl',
  confirmText: ['text-black', typography.base, typography.bold, 'text-center'].join(' '),
  confirmButtons: 'flex items-center gap-3 mt-5',
  confirmNoButton: [
    'flex-1 py-4 rounded-2xl border', colors.border.gray03,
    'flex items-center justify-center',
    'text-black active:bg-[#F7F7F9] transition-colors',
    typography.base, typography.medium,
  ].join(' '),
  confirmYesButton: [
    'flex-1 py-4 rounded-2xl bg-[#FF3B30]',
    'flex items-center justify-center',
    'text-white active:opacity-80 transition-opacity disabled:opacity-40',
    typography.base, typography.bold,
  ].join(' '),

  // 친구 및 차단 사용자 관리
  contactsBody: 'px-5 flex flex-col gap-3 pb-10',
  contactsSectionTitle: ['text-black mt-3', typography.base, typography.bold].join(' '),
  contactsList: 'flex flex-col gap-2',
  contactsRow: [colors.bg.gray04, 'w-full flex items-center gap-3 rounded-2xl px-4 py-3'].join(' '),
  contactsAvatar: 'w-10 h-10 rounded-full object-cover flex-shrink-0',
  contactsNickname: ['flex-1 text-black', typography.sm, typography.semibold].join(' '),
  contactsActionButton: [
    'rounded-lg border px-3 py-2', colors.border.gray03,
    'text-[#666666]', typography.xs, typography.medium,
    'active:bg-white transition-colors',
  ].join(' '),
}

export default styles
