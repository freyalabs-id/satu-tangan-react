import { useState, useRef, useEffect } from 'react';
import LogoIcon from './LogoIcon';

interface Props {
  onLogin: (username: string, pin: string) => Promise<void>;
  onRegister: (username: string, pin: string) => Promise<void>;
}

const PIN_LENGTH = 6;
const COOLDOWN_SECS = 5;

export default function AuthPrompt({ onLogin, onRegister }: Props) {
  const [username, setUsername] = useState('');
  const [pinDigits, setPinDigits] = useState<string[]>(Array(PIN_LENGTH).fill(''));
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const pinRefs = useRef<(HTMLInputElement | null)[]>([]);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const locked = loading || cooldown > 0;

  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, []);

  async function handleSubmit() {
    const name = username.trim();
    const pin = getPin();
    if (!name) { setError('Masukkan nama Anda'); return; }
    if (pin.length !== PIN_LENGTH) { setError('PIN harus 6 digit'); return; }
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(name, pin);
      } else {
        await onLogin(name, pin);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal masuk');
      setCooldown(COOLDOWN_SECS);
      cooldownRef.current = setInterval(() => {
        setCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            cooldownRef.current = null;
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } finally {
      setLoading(false);
    }
  }

  function focusPin(idx: number) {
    const el = pinRefs.current[idx];
    if (el) setTimeout(() => el.focus(), 50);
  }

  function handlePinChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...pinDigits];
    next[idx] = digit;
    setPinDigits(next);
    if (digit && idx < PIN_LENGTH - 1) {
      focusPin(idx + 1);
    }
  }

  function handlePinKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
      focusPin(idx - 1);
    }
    if (e.key === 'Enter') {
      handleSubmit();
    }
  }

  function handlePinPaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, PIN_LENGTH);
    const next = Array(PIN_LENGTH).fill('');
    for (let i = 0; i < text.length; i++) {
      next[i] = text[i];
    }
    setPinDigits(next);
    const nextFocus = Math.min(text.length, PIN_LENGTH - 1);
    focusPin(nextFocus);
  }

  function getPin() {
    return pinDigits.join('');
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 select-none">
      <div className="flex flex-col items-center mb-10">
        <LogoIcon name="balloon" size={36} />
        <h1 className="font-display font-bold text-[22px] tracking-[-0.03em] mt-2 mb-0 text-ink">
          Satu Tangan
        </h1>
        <p className="text-[13px] text-soft mt-1.5 mb-0 text-center max-w-[260px] leading-relaxed">
          {isRegister
            ? 'Buat akun dengan nama dan PIN 6 digit.'
            : 'Masuk dengan nama dan PIN Anda.'}
        </p>
      </div>

      <div className="w-full max-w-[320px] flex flex-col">
        <label htmlFor="auth-username" className="label mb-1.5">
          Nama
        </label>
        <input
          id="auth-username"
          type="text"
          className="w-full bg-bg border border-line rounded-lg px-4 py-3 font-mono text-[15px] text-ink placeholder:text-soft/40 outline-none focus:border-ink/60 transition-colors mb-5"
          placeholder="cth. mekar"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && focusPin(0)}
          autoComplete="username"
          autoCapitalize="none"
          autoFocus
          disabled={locked}
        />

        <label className="label mb-1.5">
          PIN
        </label>
        <div
          className="flex gap-2 justify-between mb-5"
          onPaste={handlePinPaste}
        >
          {pinDigits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { pinRefs.current[i] = el; }}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handlePinChange(i, e.target.value)}
              onKeyDown={(e) => handlePinKeyDown(i, e)}
              onFocus={(e) => e.target.select()}
              className={`w-full aspect-square max-w-[44px] bg-bg border rounded-lg text-center font-mono text-[18px] text-ink outline-none transition-all ${
                d ? 'border-ink/70' : 'border-line hover:border-line2'
              } focus:border-pop/60 focus:ring-1 focus:ring-pop/20`}
              aria-label={`Digit PIN ke-${i + 1}`}
              autoComplete="off"
              disabled={locked}
            />
          ))}
        </div>

        {error && (
          <div className="bg-g3/10 border border-g3/20 rounded-lg px-3.5 py-2.5 mb-4 flex items-start gap-2">
            <span className="text-g3 text-[12px] font-mono leading-none mt-px">{'\u2717'}</span>
            <p className="text-g3 text-[12px] font-mono m-0 leading-snug">{error}</p>
          </div>
        )}

        <button
          className={`w-full bg-pop text-[#1a0a12] border-0 rounded-xl py-3.5 font-display font-semibold text-[15px] cursor-pointer tracking-[-0.01em] transition-all ${
            loading ? 'opacity-50 pointer-events-none' : 'hover:brightness-110'
          } ${locked ? 'opacity-50' : ''}`}
          disabled={locked}
          onClick={handleSubmit}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3.5 h-3.5 border-2 border-[#1a0a12]/30 border-t-[#1a0a12] rounded-full animate-spin" />
              {isRegister ? 'Mendaftar...' : 'Memeriksa...'}
            </span>
          ) : cooldown > 0 ? (
            `Coba lagi dalam ${cooldown}s`
          ) : (
            isRegister ? 'Buat Akun' : 'Masuk'
          )}
        </button>

        <button
          className={`mt-4 mx-auto bg-transparent border-0 font-mono text-[11px] text-soft/60 cursor-pointer transition-colors ${locked ? 'opacity-40' : 'hover:text-soft'}`}
          onClick={() => { setIsRegister(!isRegister); setError(''); }}
          disabled={locked}
        >
          {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
        </button>
      </div>
    </div>
  );
}
