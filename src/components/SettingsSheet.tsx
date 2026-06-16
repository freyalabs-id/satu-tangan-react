import { useState, useRef } from 'react';
import { CONFIG } from '../lib/config';
import { api } from '../api/client';
import { STORAGE_KEY as ONBOARD_KEY } from './OnboardingGuide';
import LogoIcon from './LogoIcon';
import Sheet from './Sheet';
import type { Settings, DesignPreset } from '../types';

interface Props {
  settings?: Settings;
  onSave: (data: Partial<Settings>) => void;
  onClose: () => void;
  onLogout: () => void;
  onExport?: () => void;
}

const ICONS = [
  { id: 'balloon', label: 'Balon' },
  { id: 'gift', label: 'Kado' },
  { id: 'flower', label: 'Bunga' },
  { id: 'cup', label: 'Minuman' },
];

export default function SettingsSheet({ settings, onSave, onClose, onLogout, onExport }: Props) {
  const [capText, setCapText] = useState(String(settings?.cap ?? CONFIG.DEFAULT_CAP));
  const [leadText, setLeadText] = useState(String(settings?.lead ?? CONFIG.DEFAULT_LEAD));
  const [icon, setIcon] = useState(settings?.icon ?? CONFIG.DEFAULT_ICON);
  const [designs, setDesigns] = useState<DesignPreset[]>(settings?.designs ? [...settings.designs] : []);

  const [showChangePin, setShowChangePin] = useState(false);
  const [oldPin, setOldPin] = useState<string[]>(Array(6).fill(''));
  const [newPin, setNewPin] = useState<string[]>(Array(6).fill(''));
  const [confirmPin, setConfirmPin] = useState<string[]>(Array(6).fill(''));
  const [pinError, setPinError] = useState('');
  const [pinSaving, setPinSaving] = useState(false);
  const [pinSuccess, setPinSuccess] = useState(false);
  const oldPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const newPinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinRefs = useRef<(HTMLInputElement | null)[]>([]);

  function removeDesign(idx: number) {
    setDesigns(designs.filter((_, i) => i !== idx));
  }

  function capNum() { return Math.max(1, parseInt(capText, 10) || CONFIG.DEFAULT_CAP); }
  function leadNum() { return Math.max(1, parseInt(leadText, 10) || CONFIG.DEFAULT_LEAD); }

  function handleSave() {
    onSave({ cap: capNum(), lead: leadNum(), designs, icon });
    onClose();
  }

  async function handleChangePin() {
    const current = oldPin.join('');
    const next = newPin.join('');
    const confirm = confirmPin.join('');
    if (current.length !== 6 || next.length !== 6 || confirm.length !== 6) {
      setPinError('PIN harus 6 digit');
      return;
    }
    if (next !== confirm) {
      setPinError('PIN baru tidak cocok');
      return;
    }
    setPinError('');
    setPinSaving(true);
    try {
      await api.put('/api/auth', { currentPin: current, newPin: next });
      setPinSuccess(true);
      setTimeout(() => {
        setShowChangePin(false);
        setPinSuccess(false);
        setOldPin(Array(6).fill(''));
        setNewPin(Array(6).fill(''));
        setConfirmPin(Array(6).fill(''));
      }, 1500);
    } catch (e) {
      setPinError(e instanceof Error ? e.message : 'Gagal mengubah PIN');
    } finally {
      setPinSaving(false);
    }
  }

  return (
    <Sheet title="Pengaturan" onClose={onClose}>
      <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block label mb-1">Batas Beban</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-ink" value={capText} onChange={(e) => setCapText(e.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => { if (!capText || parseInt(capText) < 1) setCapText(String(CONFIG.DEFAULT_CAP)); }} />
              <p className="text-[11px] font-mono text-soft/60 mt-1">Total usaha per hari. Low=1, Med=2, High=3.</p>
            </div>
            <div>
              <label className="block label mb-1">Jeda Membuat</label>
              <input type="text" inputMode="numeric" pattern="[0-9]*" className="w-full bg-bg border border-line rounded-lg px-3 py-2.5 font-mono text-[14px] text-ink outline-none focus:border-ink" value={leadText} onChange={(e) => setLeadText(e.target.value.replace(/\D/g, '').slice(0, 2))} onBlur={() => { if (!leadText || parseInt(leadText) < 1) setLeadText(String(CONFIG.DEFAULT_LEAD)); }} />
              <p className="text-[11px] font-mono text-soft/60 mt-1">Jam yang dibutuhkan untuk membuat sebelum kirim. Misal: kirim jam 10, jeda 8 jam, mulai membuat jam 2.</p>
            </div>
          </div>

          <div>
            <label className="block label mb-2">Ikon Aplikasi</label>
            <div className="flex gap-2">
              {ICONS.map((ic) => (
                <button key={ic.id} className={`flex-none border rounded-xl px-3 py-2.5 cursor-pointer flex items-center gap-2 transition-all ${icon === ic.id ? 'border-pop bg-pop/10' : 'border-line2 bg-bg hover:border-line'}`} onClick={() => setIcon(ic.id)} aria-label={ic.label}>
                  <LogoIcon name={ic.id} />
                  <span className="font-mono text-[11px] text-ink">{ic.label}</span>
                </button>
              ))}
            </div>
          </div>

          {designs.length > 0 && (
            <div>
              <label className="block label mb-2">Desain Tersimpan</label>
              <div className="flex flex-col gap-1">
                {designs.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 bg-bg border border-line rounded-lg px-3 py-2">
                    <span className={`w-[6px] h-[6px] rounded-full shrink-0 ${d.eff === 'Low' ? 'bg-g1' : d.eff === 'Med' ? 'bg-g2' : 'bg-g3'}`} />
                    <span className="flex-1 font-body text-[13px] text-ink truncate">{d.name}</span>
                    {d.price ? <span className="font-mono text-[11px] text-soft shrink-0">Rp {d.price.toLocaleString('id-ID')}</span> : null}
                    <button className="w-[36px] h-[36px] rounded-md bg-transparent border-0 cursor-pointer text-soft hover:text-g3 hover:bg-g3/10 flex items-center justify-center text-[13px] shrink-0" onClick={() => removeDesign(i)} aria-label={`Hapus desain: ${d.name}`}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button className="w-full bg-pop text-[#1a0a12] border-0 rounded-xl py-3.5 font-display font-bold text-[15px] cursor-pointer tracking-[-0.01em] active:brightness-[0.94]" onClick={handleSave}>
            Simpan Pengaturan
          </button>

          {onExport && (
            <button className="w-full bg-bg border border-line rounded-xl py-3 font-mono text-[13px] text-soft cursor-pointer hover:border-ink transition-colors" onClick={onExport}>
              Salin Pesanan
            </button>
          )}

          <button
            className="w-full bg-bg border border-line rounded-xl py-3 font-mono text-[13px] text-soft cursor-pointer hover:border-ink transition-colors"
            onClick={() => { localStorage.removeItem(ONBOARD_KEY); onClose(); }}
          >
            Tampilkan panduan
          </button>

          {!showChangePin ? (
            <button className="w-full bg-bg border border-line rounded-xl py-3 font-mono text-[13px] text-ink cursor-pointer hover:border-ink transition-colors" onClick={() => setShowChangePin(true)}>
              Ubah PIN
            </button>
          ) : (
            <div className="bg-slip border border-line rounded-xl p-3 flex flex-col gap-3">
              <p className="font-mono text-[12px] text-ink m-0">PIN saat ini</p>
              <div className="flex gap-2 justify-between">
                {oldPin.map((d, i) => (
                  <input key={i} ref={(el) => { oldPinRefs.current[i] = el; }} type="password" inputMode="numeric" maxLength={1}
                    className={`w-full aspect-square max-w-[40px] bg-bg border rounded-lg text-center font-mono text-[16px] text-ink outline-none transition-all ${d ? 'border-ink/70' : 'border-line hover:border-line2'} focus:border-pop/60`}
                    value={d}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(-1);
                      const next = [...oldPin]; next[i] = v; setOldPin(next);
                      if (v && i < 5) oldPinRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) oldPinRefs.current[i - 1]?.focus(); }}
                    onClick={(e) => e.currentTarget.select()}
                    aria-label={`PIN saat ini digit ${i + 1}`}
                  />
                ))}
              </div>
              <p className="font-mono text-[12px] text-ink m-0">PIN baru</p>
              <div className="flex gap-2 justify-between">
                {newPin.map((d, i) => (
                  <input key={i} ref={(el) => { newPinRefs.current[i] = el; }} type="password" inputMode="numeric" maxLength={1}
                    className={`w-full aspect-square max-w-[40px] bg-bg border rounded-lg text-center font-mono text-[16px] text-ink outline-none transition-all ${d ? 'border-ink/70' : 'border-line hover:border-line2'} focus:border-pop/60`}
                    value={d}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(-1);
                      const next = [...newPin]; next[i] = v; setNewPin(next);
                      if (v && i < 5) newPinRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) newPinRefs.current[i - 1]?.focus(); }}
                    onClick={(e) => e.currentTarget.select()}
                    aria-label={`PIN baru digit ${i + 1}`}
                  />
                ))}
              </div>
              <p className="font-mono text-[12px] text-ink m-0">Ulangi PIN baru</p>
              <div className="flex gap-2 justify-between">
                {confirmPin.map((d, i) => (
                  <input key={i} ref={(el) => { confirmPinRefs.current[i] = el; }} type="password" inputMode="numeric" maxLength={1}
                    className={`w-full aspect-square max-w-[40px] bg-bg border rounded-lg text-center font-mono text-[16px] text-ink outline-none transition-all ${d ? 'border-ink/70' : 'border-line hover:border-line2'} focus:border-pop/60`}
                    value={d}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(-1);
                      const next = [...confirmPin]; next[i] = v; setConfirmPin(next);
                      if (v && i < 5) confirmPinRefs.current[i + 1]?.focus();
                    }}
                    onKeyDown={(e) => { if (e.key === 'Backspace' && !d && i > 0) confirmPinRefs.current[i - 1]?.focus(); }}
                    onClick={(e) => e.currentTarget.select()}
                    aria-label={`Konfirmasi PIN digit ${i + 1}`}
                  />
                ))}
              </div>
              {pinError && <p className="font-mono text-[11px] text-g3 m-0">{pinError}</p>}
              {pinSuccess && <p className="font-mono text-[11px] text-g1 m-0">PIN berhasil diubah</p>}
              <div className="flex gap-2">
                <button
                  className={`flex-1 bg-pop text-[#1a0a12] border-0 rounded-lg py-2.5 font-display font-semibold text-[13px] cursor-pointer ${pinSaving ? 'opacity-50 pointer-events-none' : ''}`}
                  disabled={pinSaving}
                  onClick={handleChangePin}
                >
                  {pinSaving ? 'Menyimpan...' : 'Simpan PIN'}
                </button>
                <button className="bg-transparent border border-line text-ink rounded-lg px-4 py-2.5 font-mono text-[12px] cursor-pointer shrink-0" onClick={() => { setShowChangePin(false); setPinError(''); setOldPin(Array(6).fill('')); setNewPin(Array(6).fill('')); setConfirmPin(Array(6).fill('')); }}>
                  Batal
                </button>
              </div>
            </div>
          )}

          <hr className="border-line my-2" />

          <div className="pt-3">
            <button className="w-full bg-transparent border border-g3/30 text-g3 rounded-xl py-3 font-mono text-[13px] cursor-pointer" onClick={onLogout}>
              Keluar
            </button>
          </div>
        </div>
    </Sheet>
  );
}
