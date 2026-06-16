import { memo } from 'react';

interface Props {
  todayLoad?: number;
  queueCount?: number;
  unpaidCount?: number;
}

const StatsBar = memo(function StatsBar({ todayLoad = 0, queueCount = 0, unpaidCount = 0 }: Props) {
  return (
    <div className="flex items-stretch gap-0 py-3">
      <div className="flex-1 text-center border-r border-line">
        <b className="font-mono font-semibold text-[20px] block leading-none">{todayLoad}</b>
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-soft block mt-[5px]">hari ini</span>
      </div>
      <div className="flex-1 text-center border-r border-line">
        <b className="font-mono font-semibold text-[20px] block leading-none">{queueCount}</b>
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-soft block mt-[5px]">selanjutnya</span>
      </div>
      <div className="flex-1 text-center">
        <b className="font-mono font-semibold text-[20px] block leading-none">{unpaidCount}</b>
        <span className="font-mono text-[11px] tracking-[0.12em] uppercase text-soft block mt-[5px]">belum bayar</span>
      </div>
    </div>
  );
});
export default StatsBar;
