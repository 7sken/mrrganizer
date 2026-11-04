// Ikonka karmy w SVG: puszka (mokra), worek (sucha), rybka (przysmak).
// Kolor etykiety wyliczany z nazwy marki – każda marka ma "swój" kolor.

const PALETTE = ['#ff8a65', '#ba68c8', '#4fc3f7', '#81c784', '#ffb74d', '#f06292', '#7986cb', '#4db6ac'];

export function brandColor(brand = '') {
  let h = 0;
  for (const ch of brand) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

export default function FoodIcon({ type, brand, size = 56, empty = false }) {
  const color = brandColor(brand);
  const common = { width: size, height: size, viewBox: '0 0 64 64', role: 'img', 'aria-label': `Karma ${type}` };
  const style = { opacity: empty ? 0.35 : 1, filter: empty ? 'grayscale(1)' : 'none', flexShrink: 0 };

  if (type === 'sucha') {
    return (
      <svg {...common} style={style}>
        <path d="M16 14 L48 14 L52 58 L12 58 Z" fill={color} stroke="#5d4037" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M16 14 L20 6 L44 6 L48 14" fill="#fff3e0" stroke="#5d4037" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="32" cy="36" r="10" fill="#fff" />
        <path d="M27 33 L28 27 L31 31 Z M37 33 L36 27 L33 31 Z" fill="#5d4037" />
        <circle cx="32" cy="37" r="5" fill="#5d4037" />
        <circle cx="26" cy="52" r="2.5" fill="#8d6e63" />
        <circle cx="38" cy="52" r="2.5" fill="#8d6e63" />
      </svg>
    );
  }

  if (type === 'przysmak') {
    return (
      <svg {...common} style={style}>
        <path d="M8 32 Q24 12 44 32 Q24 52 8 32 Z" fill={color} stroke="#5d4037" strokeWidth="2.5" />
        <path d="M44 32 L58 20 L56 32 L58 44 Z" fill={color} stroke="#5d4037" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="18" cy="29" r="3" fill="#5d4037" />
        <path d="M26 24 Q30 32 26 40 M32 24 Q36 32 32 40" stroke="#fff" strokeWidth="2" fill="none" opacity="0.7" />
      </svg>
    );
  }

  // puszka / saszetka – karma mokra
  return (
    <svg {...common} style={style}>
      <ellipse cx="32" cy="52" rx="22" ry="7" fill="#b0bec5" stroke="#546e7a" strokeWidth="2.5" />
      <rect x="10" y="20" width="44" height="32" fill={color} stroke="#546e7a" strokeWidth="2.5" />
      <ellipse cx="32" cy="20" rx="22" ry="7" fill="#eceff1" stroke="#546e7a" strokeWidth="2.5" />
      <ellipse cx="32" cy="20" rx="14" ry="3.5" fill="none" stroke="#90a4ae" strokeWidth="2" />
      <path d="M18 36 Q24 28 30 36 Q24 44 18 36 Z" fill="#fff" />
      <path d="M30 36 L36 31 L35 36 L36 41 Z" fill="#fff" />
      <circle cx="21.5" cy="35" r="1.5" fill={color} />
      <path d="M40 30 L48 30 M40 36 L48 36 M40 42 L46 42" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
