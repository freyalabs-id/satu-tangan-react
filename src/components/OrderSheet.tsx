import { useState, useMemo, useRef, useEffect } from 'react';
import { CONFIG } from '../lib/config';
import { isOverBudget, projectedLoad, craftDateFor, stageLabel, payLabel } from '../lib/domain';
import CapacityWarning from './CapacityWarning';
import Sheet from './Sheet';
import type { Order, Settings, Effort, Payment, Stage } from '../types';

interface Props {
  order?: Order | null;
  settings?: Settings;
  orders?: Order[];
  onSave: (data: Partial<Order>, isEdit: boolean) => void;
  onClose: () => void;
  onDelete?: (id: string) => void;
  onReminder?: (order: Order) => void;
}

export default function OrderSheet({ order = null, settings, orders = [], onSave, onClose, onDelete, onReminder }: Props) {
  const editing = !!order;
  const designs = settings?.designs ?? [];
  const lead = settings?.lead ?? CONFIG.DEFAULT_LEAD;
  const cap = settings?.cap ?? CONFIG.DEFAULT_CAP;

  const tomorrow = useMemo(() => {
    const d = new Date(Date.now() + 86400000);
    return d.toISOString().slice(0, 10);
  }, []);

  const [name, setName] = useState(order?.name ?? '');
  const [phone, setPhone] = useState(order?.phone ?? '');
  const [design, setDesign] = useState(order?.design ?? '');
  const [eff, setEff] = useState<Effort>(order?.eff ?? 'Med');
  const [price, setPrice] = useState(order?.price ?? 0);
  const [date, setDate] = useState(order?.date ?? tomorrow);
  const [time, setTime] = useState(order?.time ?? '12:00');
  const [addr, setAddr] = useState(order?.addr ?? '');
  const [pay, setPay] = useState<Payment>(order?.pay ?? 'Unpaid');
  const [stage, setStage] = useState<Stage>(order?.stage ?? 'Confirmed');
  const [notes, setNotes] = useState(order?.notes ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [touched, setTouched] = useState(false);
  const [closeConfirm, setCloseConfirm] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => { if (closeTimerRef.current) clearTimeout(closeTimerRef.current); };
  }, []);

  const cd = useMemo(() => {
    if (!date || !time) return '';
    return craftDateFor({ date, time }, lead);
  }, [date, time, lead]);

  const overBudget = useMemo(() => {
    if (!cd || !date || !time) return false;
    return isOverBudget(cd, eff, 1, order?.id, orders, cap, lead);
  }, [cd, date, time, eff, order?.id, orders, cap, lead]);

  const canSave = name.trim().length > 0 && !!date && !!time;

  function handleClose() {
    if (touched && !saving && !closeConfirm) {
      setCloseConfirm(true);
      closeTimerRef.current = setTimeout(() => setCloseConfirm(false), 3000);
      return;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    onClose();
  }

  function pickDesign(d: { name: string; eff?: Effort; price?: number }) {
    setDesign(d.name);
    if (d.eff) setEff(d.eff);
    if (d.price) setPrice(d.price);
  }

  function handleSave() {
    if (!canSave || saving) return;
    setSaving(true);
    onSave(
      {
        name: name.trim().slice(0, 100),
        phone: phone.trim().replace(/\D/g, '').slice(0, 15),
        design: design.trim().slice(0, 100),
        eff,
        price: Math.min(parseInt(String(price)) || 0, 99999999),
        date,
        time,
        addr: addr.trim().slice(0, 200),
        pay,
        stage,
        notes: notes.trim().slice(0, 500),
      },
      editing,
    );
    onClose();
  }

  function handleDelete() {
    if (order) onDelete?.(order.id);
  }

  return (
    <Sheet title={editing ? 'Edit Pesanan' : 'Pesanan Baru'} onClose={handleClose}>
      {closeConfirm && (
        <div className="bg-g3/10 border border-g3/30 rounded-xl px-3 py-2 mb-3 text-[11px] font-mono text-g3 text-center">
          Ketuk lagi untuk tutup tanpa menyimpan
        </div>
      )}
      <div className="flex flex-col gap-3">
          <div>
            <label className="block label mb-2">Nama Pelanggan</label>
            <input type="text" className="w-full bg-bg border border-line rounded-xl px-4 py-3 font-body text-[16px] text-ink placeholder:text-soft/55 outline-none focus:border-ink" placeholder="Cth. Sari" maxLength={100} value={name} onChange={(e) => { setName(e.target.value); setTouched(true); }} />
          </div>

          <div>
            <label className="block label mb-2">Pilih Desain</label>
            {designs.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {designs.map((d, i) => (
                  <button key={i} className={`flex-none border border-line2 bg-bg rounded-xl px-3 py-2.5 font-body text-[13px] text-ink cursor-pointer flex items-center gap-2 whitespace-nowrap ${design === d.name ? 'border-ink bg-slip font-semibold' : 'hover:border-line'}`} onClick={() => pickDesign(d)}>
                    <span className={`w-[7px] h-[7px] rounded-full shrink-0 ${d.eff === 'Low' ? 'bg-g1' : d.eff === 'Med' ? 'bg-g2' : 'bg-g3'}`} />
                    <span className="truncate">{d.name}</span>
                    {d.price ? <span className="font-mono text-[11px] text-soft shrink-0">Rp{d.price.toLocaleString('id-ID')}</span> : null}
                  </button>
                ))}
              </div>
            )}
            <input type="text" className="w-full bg-bg border border-line rounded-xl px-4 py-3 font-body text-[16px] text-ink placeholder:text-soft/55 outline-none focus:border-ink mt-2" placeholder="Ketik nama desain baru..." maxLength={100} value={design} onChange={(e) => setDesign(e.target.value)} />
          </div>

          <div>
            <label className="block label mb-2">Harga (Rp)</label>
            <input type="text" inputMode="numeric" className="w-full bg-bg border border-line rounded-xl px-4 py-3 font-mono text-[16px] text-ink outline-none focus:border-ink" value={price > 0 ? price.toLocaleString('id-ID') : ''} onChange={(e) => setPrice(parseInt(e.target.value.replace(/\D/g, ''), 10) || 0)} />
          </div>

          <div>
            <label className="block label mb-2">Tanggal & Jam Kirim</label>
            <div className="flex gap-2 mb-2 overflow-x-auto">
              <button className={`flex-none border border-line2 bg-bg rounded-xl px-4 py-2.5 font-body text-[13px] text-ink cursor-pointer ${date === tomorrow ? 'border-ink bg-slip font-semibold' : 'hover:border-line'}`} onClick={() => setDate(tomorrow)}>
                Besok
              </button>
              <button className={`flex-none border border-line2 bg-bg rounded-xl px-4 py-2.5 font-body text-[13px] text-ink cursor-pointer ${date === new Date().toISOString().slice(0, 10) ? 'border-ink bg-slip font-semibold' : 'hover:border-line'}`} onClick={() => setDate(new Date().toISOString().slice(0, 10))}>
                Hari Ini
              </button>
            </div>
            <div className="flex gap-3">
              <input type="date" className="flex-1 bg-bg border border-line rounded-xl px-4 py-3 font-mono text-[16px] text-ink outline-none focus:border-ink [color-scheme:dark]" value={date} onChange={(e) => setDate(e.target.value)} />
              <input type="time" className="flex-[0_0_110px] bg-bg border border-line rounded-xl px-4 py-3 font-mono text-[16px] text-ink outline-none focus:border-ink [color-scheme:dark]" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
          </div>

          <button className="w-full bg-transparent border border-line rounded-xl py-2.5 font-mono text-[12px] text-soft cursor-pointer hover:border-ink transition-colors mt-1" onClick={() => setShowDetails(!showDetails)}>
            {showDetails ? 'Sembunyikan detail' : 'Lainnya (usaha, harga, alamat, dll)'}
          </button>

          {showDetails && (
            <div className="flex flex-col gap-3 mt-3">
              <div>
                <label className="block label mb-2">Usaha</label>
                <div className="flex border border-line2 rounded-xl overflow-hidden">
                  {(Object.keys(CONFIG.EFFORT) as Effort[]).map((e) => (
                    <button key={e} className={`flex-1 border-0 py-3 font-mono text-[12px] cursor-pointer transition-colors ${eff === e ? 'bg-ink text-bg font-semibold' : 'text-ink/65'} ${e !== 'High' ? 'border-r border-line2' : ''}`} onClick={() => setEff(e)}>
                      {e}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] font-mono text-ink/60 mt-1">Low = mudah & cepat, Med = sedang, High = rumit & lama</p>
              </div>

              <div>
                <label className="block label mb-2">WhatsApp <span className="text-soft/50 normal-case">(opsional)</span></label>
                <input type="tel" className="w-full bg-bg border border-line rounded-xl px-4 py-3 font-mono text-[16px] text-ink placeholder:text-soft/55 outline-none focus:border-ink" placeholder="0812..." maxLength={30} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>

              <div>
                <label className="block label mb-2">Alamat</label>
                <input type="text" className="w-full bg-bg border border-line rounded-xl px-4 py-3 font-body text-[16px] text-ink placeholder:text-soft/55 outline-none focus:border-ink" placeholder="Alamat lengkap atau 'Pickup'" maxLength={200} value={addr} onChange={(e) => setAddr(e.target.value)} />
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block label mb-2">Pembayaran</label>
                  <div className="flex border border-line2 rounded-xl overflow-hidden">
                    {CONFIG.PAYMENTS.map((p) => (
                      <button key={p} className={`flex-1 border-0 py-3 font-mono text-[12px] cursor-pointer ${pay === p ? 'bg-ink text-bg font-semibold' : 'text-ink/65'} ${p !== 'Lunas' ? 'border-r border-line2' : ''}`} onClick={() => setPay(p)}>
                        {payLabel(p)}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1">
                  <label className="block label mb-2">Tahap</label>
                  <div className="flex border border-line2 rounded-xl overflow-hidden">
                    {CONFIG.STAGES.map((s) => (
                      <button key={s} className={`flex-1 border-0 py-3 font-mono text-[11px] cursor-pointer ${stage === s ? 'bg-ink text-bg font-semibold' : 'text-ink/65'} ${s !== 'Done' ? 'border-r border-line2' : ''}`} onClick={() => setStage(s)}>
                        {stageLabel(s)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block label mb-2">Catatan</label>
                <textarea className="w-full bg-bg border border-line rounded-xl px-4 py-3 font-body text-[16px] text-ink placeholder:text-soft/55 outline-none focus:border-ink resize-none min-h-[54px]" placeholder="Warna, pita, pesan kartu..." maxLength={500} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </div>
          )}

          {overBudget && cd && (
            <CapacityWarning load={projectedLoad(cd, eff, 1, order?.id, orders, lead)} cap={cap} />
          )}
        </div>

        <button className={`w-full bg-pop text-[#1a0a12] border-0 rounded-xl py-4 font-display font-bold text-[16px] cursor-pointer tracking-[-0.01em] mt-4 ${!canSave ? 'opacity-50 pointer-events-none' : ''}`} disabled={!canSave} onClick={handleSave}>
          {saving ? 'Tersimpan \u2713' : editing ? 'Simpan' : 'Tambah Pesanan'}
        </button>

        {editing && order && (
          <>
            <button className="w-full bg-bg border border-line2 rounded-xl py-3 font-mono text-[12px] text-ink cursor-pointer mt-2 hover:border-ink transition-colors" onClick={() => onReminder?.(order)}>
              + Tambah Pengingat ke Kalender
            </button>
            <div className="mt-2">
              {showDeleteConfirm ? (
                <div className="bg-g3/10 border border-g3/30 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-[12px] font-mono text-g3">Hapus pesanan ini?</span>
                  <div className="flex gap-2">
                    <button className="bg-g3 text-white border-0 rounded-lg px-3 py-1.5 font-mono text-[11px] cursor-pointer" onClick={handleDelete}>Hapus</button>
                    <button className="bg-transparent border border-line text-ink rounded-lg px-3 py-1.5 font-mono text-[11px] cursor-pointer" onClick={() => setShowDeleteConfirm(false)}>Batal</button>
                  </div>
                </div>
              ) : (
                <button className="w-full bg-transparent border border-g3/30 text-g3 rounded-xl py-3 font-mono text-[12px] cursor-pointer" onClick={() => setShowDeleteConfirm(true)}>
                  Hapus Pesanan
                </button>
              )}
            </div>
          </>
        )}
    </Sheet>
  );
}
