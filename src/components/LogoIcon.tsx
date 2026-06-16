interface Props {
  name?: string;
  size?: number;
}

export default function LogoIcon({ name = 'balloon', size = 20 }: Props) {
  const cls = size > 20 ? 'mb-5' : '';
  const h = Math.round(size * 26 / 20);

  if (name === 'balloon') {
    return (
      <svg width={size} height={h} viewBox="0 0 20 26" fill="none" aria-hidden="true" className={cls}>
        <ellipse cx="10" cy="9" rx="8" ry="9" stroke="#d9705a" strokeWidth="1.5" fill="rgba(217,112,90,0.12)"/>
        <path d="M7 17 L10 21 L13 17 Z" fill="rgba(217,112,90,0.12)" stroke="#d9705a" strokeWidth="1.2"/>
        <path d="M10 21 C10 23, 12 24, 11 26" stroke="#48402f" strokeWidth="1.2" fill="none"/>
      </svg>
    );
  }

  if (name === 'gift') {
    return (
      <svg width={size} height={h} viewBox="0 0 20 26" fill="none" aria-hidden="true" className={cls}>
        <rect x="2" y="11" width="16" height="13" rx="2" stroke="#d9705a" strokeWidth="1.5" fill="rgba(217,112,90,0.10)"/>
        <path d="M10 4 C10 4, 2 2, 2 8 S6 11 10 11" stroke="#d9705a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M10 4 C10 4, 18 2, 18 8 S14 11 10 11" stroke="#d9705a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <line x1="10" y1="11" x2="10" y2="24" stroke="#d9705a" strokeWidth="1.5"/>
        <line x1="2" y1="16" x2="18" y2="16" stroke="#d9705a" strokeWidth="1.2"/>
      </svg>
    );
  }

  if (name === 'flower') {
    return (
      <svg width={size} height={h} viewBox="0 0 20 26" fill="none" aria-hidden="true" className={cls}>
        <circle cx="10" cy="8" r="3" stroke="#d9705a" strokeWidth="1.3" fill="rgba(217,112,90,0.12)"/>
        <ellipse cx="7" cy="6" rx="2.2" ry="3.5" stroke="#d9705a" strokeWidth="1.2" fill="rgba(217,112,90,0.08)" transform="rotate(-30 7 6)"/>
        <ellipse cx="13" cy="6" rx="2.2" ry="3.5" stroke="#d9705a" strokeWidth="1.2" fill="rgba(217,112,90,0.08)" transform="rotate(30 13 6)"/>
        <ellipse cx="7" cy="10" rx="2.2" ry="3.5" stroke="#d9705a" strokeWidth="1.2" fill="rgba(217,112,90,0.08)" transform="rotate(30 7 10)"/>
        <ellipse cx="13" cy="10" rx="2.2" ry="3.5" stroke="#d9705a" strokeWidth="1.2" fill="rgba(217,112,90,0.08)" transform="rotate(-30 13 10)"/>
        <path d="M10 11 Q10 18 9 24" stroke="#48402f" strokeWidth="1.2" fill="none" strokeLinecap="round"/>
      </svg>
    );
  }

  if (name === 'cup') {
    return (
      <svg width={size} height={h} viewBox="0 0 20 26" fill="none" aria-hidden="true" className={cls}>
        <rect x="3" y="3" width="14" height="16" rx="2" stroke="#d9705a" strokeWidth="1.5" fill="rgba(217,112,90,0.10)"/>
        <path d="M15 8 C18 8, 18 14, 15 14" stroke="#d9705a" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
        <path d="M5 20 Q4 24 10 24 Q16 24 15 20" stroke="#d9705a" strokeWidth="1.3" fill="none" strokeLinecap="round"/>
        <line x1="5" y1="8" x2="5" y2="14" stroke="#d9705a" strokeWidth="1" strokeLinecap="round"/>
        <line x1="15" y1="8" x2="15" y2="14" stroke="#d9705a" strokeWidth="1" strokeLinecap="round"/>
      </svg>
    );
  }

  return null;
}
