// Interaktywna kocia mordka rysowana w SVG.
//  - oczy śledzą kursor, kot co jakiś czas mruga,
//  - kliknięcie = głaskanie: serduszka + "mrrr",
//  - nastrój (happy / meh / sad) zmienia minę i uszy,
//  - wygląd (futro, umaszczenie, oczy, dodatki) z obiektu `avatar`.
import { useEffect, useId, useRef, useState } from 'react';
import { Box } from '@mui/material';
import { keyframes } from '@emotion/react';
import { DEFAULT_AVATAR } from '../lib/utils.js';

const floatUp = keyframes`
  0%   { transform: translate(-50%, 0) scale(0.6); opacity: 0; }
  20%  { opacity: 1; }
  100% { transform: translate(-50%, -90px) scale(1.2); opacity: 0; }
`;
const purr = keyframes`
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.04) rotate(-2deg); }
  75% { transform: scale(1.04) rotate(2deg); }
`;
const bubbleIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  30% { transform: scale(1.1); opacity: 1; }
  80% { transform: scale(1); opacity: 1; }
  100% { transform: scale(1); opacity: 0; }
`;

const EYES = [
  { x: 70, y: 105 },
  { x: 130, y: 105 },
];

// Lekkie przyciemnienie koloru (np. obrys futra)
function shade(hex, amount = -40) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amount));
  const r = c(n >> 16), g = c((n >> 8) & 255), b = c(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function useEyeTracking(svgRef, enabled) {
  const [look, setLook] = useState({ x: 0, y: 0 });
  useEffect(() => {
    if (!enabled) return undefined;
    let frame = null;
    const onMove = (e) => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = null;
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || !rect.width) return;
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height * 0.52;
        const dx = e.clientX - cx;
        const dy = e.clientY - cy;
        const dist = Math.hypot(dx, dy) || 1;
        const max = 5;
        const k = Math.min(1, dist / 250);
        setLook({ x: (dx / dist) * max * k, y: (dy / dist) * max * k });
      });
    };
    window.addEventListener('mousemove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [enabled, svgRef]);
  return look;
}

function useBlink(enabled) {
  const [blink, setBlink] = useState(false);
  useEffect(() => {
    if (!enabled) return undefined;
    let t1, t2;
    const loop = () => {
      t1 = setTimeout(() => {
        setBlink(true);
        t2 = setTimeout(() => {
          setBlink(false);
          loop();
        }, 140);
      }, 2500 + Math.random() * 3500);
    };
    loop();
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [enabled]);
  return blink;
}

export default function CatFace({
  avatar,
  mood = 'happy',
  size = 160,
  interactive = true,
  coverEyes = false,
  name,
  onPet,
}) {
  const a = { ...DEFAULT_AVATAR, ...(avatar || {}) };
  const svgRef = useRef(null);
  const uid = useId().replace(/:/g, '');
  const [petted, setPetted] = useState(false);
  const [hearts, setHearts] = useState([]);
  const petTimer = useRef(null);
  useEffect(() => () => clearTimeout(petTimer.current), []);
  const look = useEyeTracking(svgRef, interactive && !coverEyes);
  const blink = useBlink(interactive);

  const outline = shade(a.fur, -55);
  const isLightFur = parseInt(a.fur.slice(1), 16) > 0xcccccc;
  const lineColor = isLightFur || a.fur === '#ffffff' ? '#5d4037' : '#2b2024';
  const earInner = '#f8bbd0';
  const effectiveMood = petted ? 'petted' : mood;

  const handlePet = () => {
    if (!interactive) return;
    setPetted(true);
    const batch = Array.from({ length: 4 }, (_, i) => ({
      id: Date.now() + i,
      left: 25 + Math.random() * 50,
      delay: i * 0.12,
      emoji: ['💗', '💕', '✨', '💖'][i % 4],
    }));
    setHearts((h) => [...h, ...batch]);
    setTimeout(() => setHearts((h) => h.filter((x) => !batch.includes(x))), 1600);
    clearTimeout(petTimer.current);
    petTimer.current = setTimeout(() => setPetted(false), 1600);
    onPet?.();
  };

  // Uszy opadają, gdy kot jest smutny
  const earTilt = effectiveMood === 'sad' ? 14 : 0;

  const renderEyes = () => {
    if (coverEyes) return null; // zasłonięte łapkami
    if (effectiveMood === 'petted') {
      return EYES.map((e) => (
        <path key={e.x} d={`M${e.x - 13} ${e.y + 3} Q${e.x} ${e.y - 12} ${e.x + 13} ${e.y + 3}`}
          stroke={lineColor} strokeWidth="5" fill="none" strokeLinecap="round" />
      ));
    }
    if (blink) {
      return EYES.map((e) => (
        <path key={e.x} d={`M${e.x - 14} ${e.y} Q${e.x} ${e.y + 6} ${e.x + 14} ${e.y}`}
          stroke={lineColor} strokeWidth="4.5" fill="none" strokeLinecap="round" />
      ));
    }
    const pupilRx = effectiveMood === 'sad' ? 7.5 : effectiveMood === 'happy' ? 6 : 4.5;
    return EYES.map((e) => (
      <g key={e.x}>
        <ellipse cx={e.x} cy={e.y} rx="15" ry="17" fill={a.eyes} stroke={lineColor} strokeWidth="3" />
        <ellipse cx={e.x + look.x} cy={e.y + look.y} rx={pupilRx} ry="12" fill="#1b1b1b" />
        <circle cx={e.x + look.x + 4} cy={e.y + look.y - 6} r="3.5" fill="#fff" />
        {effectiveMood === 'meh' && (
          // przymrużone powieki – "hmm, coś się kończy"
          <path d={`M${e.x - 17} ${e.y - 6} L${e.x + 17} ${e.y - 6} L${e.x + 17} ${e.y - 20} L${e.x - 17} ${e.y - 20} Z`}
            fill={a.fur} stroke="none" />
        )}
        {effectiveMood === 'sad' && (
          <path d={`M${e.x - 14} ${e.y - 18} L${e.x + 10} ${e.y - 26}`}
            stroke={lineColor} strokeWidth="4" strokeLinecap="round"
            transform={e.x > 100 ? `scale(-1,1) translate(${-2 * e.x},0)` : undefined} />
        )}
      </g>
    ));
  };

  const renderMouth = () => {
    const stroke = { stroke: lineColor, strokeWidth: 4, fill: 'none', strokeLinecap: 'round' };
    switch (effectiveMood) {
      case 'sad':
        return <path d="M86 150 Q100 138 114 150" {...stroke} />;
      case 'meh':
        return <path d="M100 133 L100 140 M89 142 L111 142" {...stroke} />;
      case 'petted':
        return (
          <g>
            <path d="M100 133 Q92 148 82 139 M100 133 Q108 148 118 139" {...stroke} />
            <path d="M92 143 Q100 156 108 143 Z" fill="#e57373" />
          </g>
        );
      default:
        return <path d="M100 133 Q92 146 84 138 M100 133 Q108 146 116 138" {...stroke} />;
    }
  };

  const renderPattern = () => {
    const pc = a.patternColor;
    switch (a.pattern) {
      case 'pregi':
        return (
          <g stroke={pc} strokeWidth="7" strokeLinecap="round" fill="none">
            <path d="M100 48 L100 74" />
            <path d="M82 52 L87 72" />
            <path d="M118 52 L113 72" />
            <path d="M28 100 L54 106" />
            <path d="M28 116 L50 117" />
            <path d="M172 100 L146 106" />
            <path d="M172 116 L150 117" />
          </g>
        );
      case 'laty':
        return (
          <g fill={pc}>
            <ellipse cx="62" cy="82" rx="36" ry="30" />
            <ellipse cx="146" cy="62" rx="20" ry="16" />
            <ellipse cx="150" cy="150" rx="18" ry="14" />
          </g>
        );
      case 'skarpetki':
        return (
          <g fill={pc}>
            <path d="M92 70 Q100 62 108 70 L118 120 L82 120 Z" />
            <ellipse cx="100" cy="146" rx="46" ry="34" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderAccessory = () => {
    switch (a.accessory) {
      case 'kokardka':
        return (
          <g transform="translate(150 40) rotate(20)">
            <path d="M0 0 L-20 -13 L-20 13 Z" fill="#ff6b9d" stroke="#d81b60" strokeWidth="2" strokeLinejoin="round" />
            <path d="M0 0 L20 -13 L20 13 Z" fill="#ff6b9d" stroke="#d81b60" strokeWidth="2" strokeLinejoin="round" />
            <circle r="6" fill="#ff8fb3" stroke="#d81b60" strokeWidth="2" />
          </g>
        );
      case 'obroza':
        return (
          <g>
            <path d="M46 156 Q100 196 154 156" stroke="#e53935" strokeWidth="10" fill="none" strokeLinecap="round" />
            <circle cx="100" cy="181" r="9" fill="#ffca28" stroke="#f9a825" strokeWidth="2" />
            <path d="M95 183 L105 183" stroke="#8d6e00" strokeWidth="2" strokeLinecap="round" />
          </g>
        );
      case 'czapka':
        return (
          <g transform="rotate(-12 100 40)">
            <path d="M100 -6 L78 46 L122 46 Z" fill="#7e57c2" stroke="#4527a0" strokeWidth="2.5" strokeLinejoin="round" />
            <path d="M89 20 L111 20 M84 33 L116 33" stroke="#ffd54f" strokeWidth="4" />
            <circle cx="100" cy="-6" r="7" fill="#ffd54f" stroke="#f9a825" strokeWidth="2" />
          </g>
        );
      case 'okulary':
        return (
          <g stroke="#37474f" strokeWidth="4" fill="rgba(144,202,249,0.25)">
            <circle cx="70" cy="105" r="22" />
            <circle cx="130" cy="105" r="22" />
            <path d="M92 103 Q100 96 108 103" fill="none" />
          </g>
        );
      default:
        return null;
    }
  };

  const renderPaws = () =>
    coverEyes &&
    EYES.map((e) => (
      <g key={e.x} transform={`translate(${e.x} ${e.y + 4})`}>
        <ellipse rx="24" ry="20" fill={a.fur} stroke={outline} strokeWidth="3" />
        <ellipse cy="5" rx="9" ry="7" fill="#f8bbd0" />
        <circle cx="-10" cy="-8" r="4" fill="#f8bbd0" />
        <circle cx="0" cy="-11" r="4" fill="#f8bbd0" />
        <circle cx="10" cy="-8" r="4" fill="#f8bbd0" />
      </g>
    ));

  return (
    <Box
      sx={{
        position: 'relative',
        width: size,
        height: size,
        cursor: interactive ? 'pointer' : 'default',
        userSelect: 'none',
        flexShrink: 0,
        '& .cat-head': {
          transformOrigin: '50% 60%',
          transition: 'transform .25s ease',
          animation: petted ? `${purr} .35s ease-in-out infinite` : 'none',
        },
        '&:hover .cat-head': interactive && !petted ? { transform: 'rotate(-4deg)' } : {},
        '&:hover .whiskers': interactive ? { transform: 'rotate(3deg)' } : {},
      }}
      onClick={handlePet}
      data-testid="cat-face"
      data-mood={effectiveMood}
    >
      <svg ref={svgRef} viewBox="-5 -15 210 215" width={size} height={size} role="img"
        aria-label={name ? `Kot ${name}` : 'Kocia mordka'} style={{ overflow: 'visible' }}>
        <defs>
          <clipPath id={`head-${uid}`}>
            <ellipse cx="100" cy="112" rx="72" ry="64" />
          </clipPath>
        </defs>
        <g className="cat-head">
          {/* uszy */}
          <g style={{ transition: 'transform .4s', transformOrigin: '65px 70px', transform: `rotate(${-earTilt}deg)` }}>
            <path d="M36 86 L46 18 L96 56 Z" fill={a.fur} stroke={outline} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M50 70 L54 36 L80 56 Z" fill={earInner} />
          </g>
          <g style={{ transition: 'transform .4s', transformOrigin: '135px 70px', transform: `rotate(${earTilt}deg)` }}>
            <path d="M164 86 L154 18 L104 56 Z" fill={a.fur} stroke={outline} strokeWidth="3.5" strokeLinejoin="round" />
            <path d="M150 70 L146 36 L120 56 Z" fill={earInner} />
          </g>

          {/* głowa + umaszczenie */}
          <ellipse cx="100" cy="112" rx="72" ry="64" fill={a.fur} />
          <g clipPath={`url(#head-${uid})`}>{renderPattern()}</g>
          <ellipse cx="100" cy="112" rx="72" ry="64" fill="none" stroke={outline} strokeWidth="3.5" />

          {/* rumieńce */}
          {(effectiveMood === 'happy' || effectiveMood === 'petted') && (
            <g fill="#ff8a80" opacity={effectiveMood === 'petted' ? 0.7 : 0.4}>
              <ellipse cx="52" cy="132" rx="12" ry="7" />
              <ellipse cx="148" cy="132" rx="12" ry="7" />
            </g>
          )}

          {renderEyes()}

          {/* łezka, gdy smutno */}
          {effectiveMood === 'sad' && !coverEyes && (
            <path d="M62 126 Q56 136 62 140 Q68 136 62 126 Z" fill="#64b5f6" />
          )}

          {/* nos */}
          <path d="M92 124 L108 124 L100 133 Z" fill="#f48fb1" stroke="#ec407a" strokeWidth="2" strokeLinejoin="round" />
          {renderMouth()}

          {/* wąsy */}
          <g className="whiskers" stroke={lineColor} strokeWidth="2.2" strokeLinecap="round" opacity="0.75"
            style={{ transition: 'transform .3s', transformOrigin: '100px 130px' }}>
            <path d="M74 128 L30 120" />
            <path d="M74 134 L28 136" />
            <path d="M126 128 L170 120" />
            <path d="M126 134 L172 136" />
          </g>

          {renderAccessory()}
          {renderPaws()}
        </g>
      </svg>

      {/* serduszka po pogłaskaniu */}
      {hearts.map((h) => (
        <Box key={h.id} component="span" sx={{
          position: 'absolute', top: '25%', left: `${h.left}%`, fontSize: size * 0.14,
          pointerEvents: 'none', animation: `${floatUp} 1.4s ease-out ${h.delay}s forwards`, opacity: 0,
        }}>
          {h.emoji}
        </Box>
      ))}
      {petted && size >= 90 && (
        <Box sx={{
          position: 'absolute', top: -8, right: -14, bgcolor: '#fff', borderRadius: '12px', px: 1.2, py: 0.3,
          fontWeight: 800, fontSize: Math.max(12, size * 0.09), color: 'secondary.dark',
          boxShadow: 2, animation: `${bubbleIn} 1.6s ease forwards`, pointerEvents: 'none',
        }}>
          mrrr…
        </Box>
      )}
    </Box>
  );
}
