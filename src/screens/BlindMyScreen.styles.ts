import typography from '../styles/typography'

const styles = {
  container: 'min-h-screen bg-black flex flex-col pb-24',

  header: 'px-6 pt-7 pb-4',
  headerTitle: ['text-white', typography['3xl'], typography.bold].join(' '),

  section: 'px-6 mt-4',

  profileCard: 'bg-[#1F1F1F] rounded-2xl px-5 py-6 flex flex-col gap-5',

  profileRow: 'flex items-center gap-4',
  avatar: 'w-16 h-16 rounded-2xl object-cover',
  nickname: ['text-white', typography.xl, typography.bold].join(' '),

  statsRow: 'flex items-center justify-around',
  statItem: 'flex flex-col items-center gap-1',
  statNumber: ['text-[#FFD60A]', typography['2xl'], typography.bold].join(' '),
  statLabel: ['text-white/60', typography.xs, typography.medium].join(' '),

  statDivider: 'w-px h-8 bg-white/10',

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
}

export default styles
