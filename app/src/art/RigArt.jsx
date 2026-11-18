// Procedural rig illustration: the rig visibly gains hardware with each tier.
//   coils = tier, stabiliser fins from tier 3, side pods from tier 5,
//   antenna array from tier 7, halo from tier 9, singularity crown at 10.
const HUES = ["#8B5CF6", "#8B5CF6", "#9B74FF", "#7C8CFF", "#5BA8FF", "#3DD6F5", "#3DE0C8", "#B9A2FF", "#F5B544", "#FFD27A", "#FFFFFF"];

export default function RigArt({ tier = 1, size = 200, dim = false }) {
  const t = Math.max(1, Math.min(10, tier));
  const hue = HUES[t];
  const coils = t;
  const coilGap = 66 / Math.max(coils, 1);
  return (
    <svg
      className={`rig ${dim ? "rig--dim" : ""}`}
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label={`Rig tier ${t}`}
    >
      <defs>
        <radialGradient id={`rigglow${t}`} cx="50%" cy="58%" r="50%">
          <stop offset="0%" stopColor={hue} stopOpacity="0.28" />
          <stop offset="100%" stopColor={hue} stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="112" r="92" fill={`url(#rigglow${t})`} />

      {t >= 9 && (
        <ellipse className="rig__halo" cx="100" cy="64" rx="46" ry="11" fill="none" stroke={hue} strokeWidth="1.5" strokeOpacity="0.8" />
      )}

      {/* ground plate */}
      <polygon points="40,160 100,182 160,160 100,140" fill="#1C1C26" stroke="#2E2E3D" />
      <polygon points="40,160 100,182 100,190 40,168" fill="#14141B" />
      <polygon points="160,160 100,182 100,190 160,168" fill="#101016" />

      {/* side pods */}
      {t >= 5 && (
        <g>
          <rect x="52" y="128" width="18" height="26" rx="4" fill="#262633" stroke="#2E2E3D" />
          <rect x="130" y="128" width="18" height="26" rx="4" fill="#262633" stroke="#2E2E3D" />
          <rect x="56" y="134" width="10" height="3" rx="1.5" fill={hue} />
          <rect x="134" y="134" width="10" height="3" rx="1.5" fill={hue} />
        </g>
      )}

      {/* stabiliser fins */}
      {t >= 3 && (
        <g fill="#262633" stroke="#3A3A4C">
          <polygon points="78,150 66,160 84,158" />
          <polygon points="122,150 134,160 116,158" />
        </g>
      )}

      {/* mast */}
      <rect x="88" y="72" width="24" height="84" rx="5" fill="#1C1C26" stroke="#3A3A4C" />
      {Array.from({ length: coils }, (_, i) => (
        <rect
          key={i}
          className="rig__coil"
          style={{ animationDelay: `${i * 0.12}s` }}
          x="85"
          y={146 - i * coilGap - 4}
          width="30"
          height="4"
          rx="2"
          fill={hue}
          opacity={0.55 + (i / coils) * 0.45}
        />
      ))}

      {/* drill head crystal */}
      <polygon points="100,40 116,52 116,66 100,76 84,66 84,52" fill="#4B2EA3" />
      <polygon points="100,40 116,52 116,66 100,76" fill="#6A42D9" />
      <polygon points="84,52 100,40 116,52 100,58" fill="#FFFFFF" fillOpacity="0.2" />
      <polygon className="rig__tip" points="100,40 116,52 116,66 100,76 84,66 84,52" fill="none" stroke={hue} strokeWidth="1.25" />

      {/* antenna array */}
      {t >= 7 && (
        <g stroke={hue} strokeWidth="1.5" strokeLinecap="round">
          <line x1="92" y1="44" x2="84" y2="26" />
          <line x1="108" y1="44" x2="116" y2="26" />
          <circle cx="84" cy="25" r="2" fill={hue} />
          <circle cx="116" cy="25" r="2" fill={hue} />
        </g>
      )}

      {/* crown */}
      {t >= 10 && (
        <polygon points="86,22 92,30 100,16 108,30 114,22 112,34 88,34" fill="#F5B544" stroke="#FFE2A6" strokeWidth="0.75" />
      )}
    </svg>
  );
}
