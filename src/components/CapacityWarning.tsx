import { memo } from 'react';

interface Props {
  load?: number;
  cap?: number;
}

const CapacityWarning = memo(function CapacityWarning({ load = 0, cap = 0 }: Props) {
  return (
    <div className="bg-g2/10 border border-g2/30 rounded-xl p-3" role="alert">
      <p className="text-[12px] font-mono text-g2 m-0">
        &#x26A0; <span className="font-semibold">Peringatan:</span> Beban melebihi batas harian ({load}/{cap}).
      </p>
      <p className="text-[11px] font-mono text-soft/70 mt-1 m-0">
        Pesanan tetap bisa disimpan. Sesuaikan batas di Pengaturan jika perlu.
      </p>
    </div>
  );
});
export default CapacityWarning;
