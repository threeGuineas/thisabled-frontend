const styles = {
  nav: [
    'fixed bottom-0 left-0 right-0',
    'h-20 bg-black',
    'border-t-2 border-[#FFD60A]',
    'flex items-center',
  ].join(' '),

  tab: 'flex-1 flex flex-col items-center justify-center gap-1 py-3 cursor-pointer',

  iconWrapperActive: 'bg-[#FFD60A]/20 border-2 border-[#FFD60A] rounded-2xl px-4 py-1.5 flex items-center justify-center',
  iconWrapper: 'px-4 py-1.5 flex items-center justify-center',

  icon: 'w-6 h-6',
  iconDim: 'w-6 h-6 opacity-40',

  labelActive: 'text-xs font-bold text-[#FFD60A]',
  label: 'text-xs font-medium text-white/40',
}

export default styles
