import { useReducer } from 'react';

interface Props {
  onOpenSettings: () => void;
  onNewOrder: () => void;
}

export const STORAGE_KEY = 'st_onboarding_done';

export default function OnboardingGuide({ onOpenSettings, onNewOrder }: Props) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  if (localStorage.getItem(STORAGE_KEY)) return null;

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    rerender();
  }

  const steps = [
    {
      title: 'Atur batas beban',
      desc: 'Ketuk ikon \u2699 di kanan atas, lalu isi Batas Beban sesuai kemampuan harian.',
      action: onOpenSettings,
    },
    {
      title: 'Buat pesanan pertama',
      desc: 'Ketuk tombol + Pesanan baru di bawah untuk mencatat pesanan. Nama desain otomatis tersimpan.',
      action: onNewOrder,
    },
  ];

  return (
    <div className="bg-surface border border-line rounded-2xl p-4 my-4">
      <h2 className="font-display font-bold text-[17px] tracking-[-0.02em] m-0 mb-3">Mulai dari sini</h2>
      <div className="flex flex-col gap-2">
        {steps.map((step, i) => (
          <button
            key={i}
            className="w-full text-left bg-bg border border-line rounded-lg p-3 cursor-pointer hover:border-line2 transition-colors"
            onClick={step.action}
          >
            <div className="flex items-center gap-2.5">
              <span className="w-5 h-5 rounded-full border border-soft/40 flex items-center justify-center font-mono text-[11px] text-soft shrink-0">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="block font-mono text-[13px] text-ink">{step.title}</span>
                <span className="block font-mono text-[11px] text-soft/60 mt-0.5">{step.desc}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      <button
        className="block mx-auto mt-3 bg-bg border border-line rounded-lg px-4 py-1.5 font-mono text-[11px] text-soft/70 cursor-pointer hover:border-line2 hover:text-soft transition-colors"
        onClick={dismiss}
      >
        Lewati
      </button>
    </div>
  );
}
