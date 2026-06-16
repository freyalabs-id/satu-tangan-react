interface Props {
  count: number;
  onAdvance: () => void;
  onCancel: () => void;
}

export default function BulkActionBar({ count, onAdvance, onCancel }: Props) {
  return (
    <div className="fixed left-0 right-0 bottom-0 z-30 bg-gradient-to-t from-bg via-bg to-transparent pt-3.5 pb-[max(16px,env(safe-area-inset-bottom))] max-w-[540px] mx-auto px-4">
      <div className="flex items-center gap-2">
        <span className="font-mono text-[12px] text-soft shrink-0">{count} dipilih</span>
        <button
          className="flex-1 bg-pop text-[#1a0a12] border-0 rounded-xl py-3.5 font-display font-bold text-[15px] cursor-pointer tracking-[-0.01em] active:brightness-[0.94]"
          onClick={onAdvance}
        >
          Lanjutkan
        </button>
        <button
          className="bg-transparent border border-line2 text-ink rounded-xl px-4 py-3.5 font-mono text-[13px] cursor-pointer shrink-0"
          onClick={onCancel}
        >
          Batal
        </button>
      </div>
    </div>
  );
}
