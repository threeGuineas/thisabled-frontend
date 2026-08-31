interface Props {
  message: string
}

export default function Toast({ message }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-8 flex flex-col items-center gap-4 rounded-3xl bg-white px-10 py-8 shadow-2xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FFD60A]">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
            <path d="M5 12L10 17L19 8" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <p className="text-center text-base font-bold text-[#000000]">{message}</p>
      </div>
    </div>
  )
}
