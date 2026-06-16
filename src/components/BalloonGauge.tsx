import { memo } from 'react';

interface Props {
  load?: number;
  cap?: number;
}

const BalloonGauge = memo(function BalloonGauge({ load = 0, cap = 5 }: Props) {
  const ratio = Math.min(load / Math.max(cap, 1), 1.5);
  const pct = Math.min(Math.round(ratio * 100), 100);
  const level = ratio <= 0.6 ? 'g1' : ratio <= 0.85 ? 'g2' : 'g3';
  const colors: Record<string, string> = { g1: '#5cba84', g2: '#e8a23c', g3: '#d95a45' };

  const statusLabel =
    level === 'g1' ? 'Aman' :
    level === 'g2' ? 'Hampir penuh' :
    'Melebihi batas';

  return (
    <div className="flex items-center gap-2" role="progressbar" aria-valuenow={load} aria-valuemin={0} aria-valuemax={cap} aria-label={`Beban hari ini: ${load} dari ${cap}. ${statusLabel}`}>
      <div className="flex-1 h-[6px] bg-line rounded-full overflow-hidden relative">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: colors[level] }} />
      </div>
      <div className="flex items-center gap-1 font-mono text-[11px]" aria-hidden="true">
        <span className="text-soft">{load}</span>
        <span className="text-soft/50">/</span>
        <span className="text-soft">{cap}</span>
        {load > cap && <span className="text-g3 ml-0.5">!</span>}
      </div>
    </div>
  );
});
export default BalloonGauge;
