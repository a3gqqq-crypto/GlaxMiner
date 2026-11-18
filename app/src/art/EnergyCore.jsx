import { useId } from "react";

// The outpost's energy core. A cut Glaxite crystal inside an instrument ring.
//   idle    - dim, slow breathing, ring empty
//   mining  - cyan ring fills with the session, the crystal charges from the
//             bottom up, orbit shards circle
//   ready   - amber: the charge is complete and can be claimed
const TICKS = 72;
const R = 104; // progress ring radius
const C = 2 * Math.PI * R;

export default function EnergyCore({ state = "idle", progress = 0, level = 1 }) {
  const uid = useId().replace(/:/g, "");
  const p = Math.max(0, Math.min(1, progress));
  const live = state === "mining";
  const ready = state === "ready";
  const accent = ready ? "#F5B544" : live ? "#3DD6F5" : "#8B5CF6";
  const lit = Math.round(p * TICKS);
  // crystal spans y 52..188 in the 240 box; charge rises from the bottom
  const fillTop = 188 - 136 * (ready ? 1 : p);
  const shards = Math.min(3 + level, 12);

  return (
    <svg
      className={`core core--${state}`}
      viewBox="0 0 240 240"
      role="img"
      aria-label={
        ready
          ? "Energy core fully charged, ready to claim"
          : live
            ? `Energy core charging, ${Math.floor(p * 100)} percent of the session complete`
            : "Energy core idle"
      }
    >
      <defs>
        <radialGradient id={`glow${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={accent} stopOpacity={ready ? 0.42 : live ? 0.32 : 0.22} />
          <stop offset="62%" stopColor={accent} stopOpacity="0.05" />
          <stop offset="100%" stopColor={accent} stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`charge${uid}`} x1="0" y1="1" x2="0" y2="0">
          <stop offset="0%" stopColor={ready ? "#F5B544" : "#3DD6F5"} stopOpacity="0.95" />
          <stop offset="100%" stopColor={ready ? "#FFE2A6" : "#B9A2FF"} stopOpacity="0.85" />
        </linearGradient>
        <clipPath id={`crystal${uid}`}>
          <polygon points="120,52 158,74 158,98 134,98 134,142 158,142 158,166 120,188 82,166 82,74" />
        </clipPath>
      </defs>

      <circle className="core__glow" cx="120" cy="120" r="118" fill={`url(#glow${uid})`} />

      {/* outer instrument ticks */}
      <g className="core__ticks">
        {Array.from({ length: TICKS }, (_, i) => {
          const a = (i / TICKS) * Math.PI * 2 - Math.PI / 2;
          const long = i % 6 === 0;
          const r1 = long ? 114 : 116;
          const r2 = 120;
          const on = (live || ready) && i < lit;
          return (
            <line
              key={i}
              x1={120 + r1 * Math.cos(a)}
              y1={120 + r1 * Math.sin(a)}
              x2={120 + r2 * Math.cos(a)}
              y2={120 + r2 * Math.sin(a)}
              stroke={on ? accent : "#2E2E3D"}
              strokeOpacity={on ? 0.9 : 1}
              strokeWidth={long ? 1.6 : 1}
            />
          );
        })}
      </g>

      {/* progress ring */}
      <circle cx="120" cy="120" r={R} fill="none" stroke="#22222D" strokeWidth="3" />
      <circle
        className="core__ring"
        cx="120"
        cy="120"
        r={R}
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray={`${C * (live || ready ? Math.max(p, 0.002) : 0)} ${C}`}
        transform="rotate(-90 120 120)"
      />

      {/* orbit lanes */}
      <circle className="core__lane" cx="120" cy="120" r="90" fill="none" stroke="#2E2E3D" strokeWidth="1" strokeDasharray="2 7" />
      <g className="core__orbit">
        {Array.from({ length: shards }, (_, i) => {
          const a = (i / shards) * Math.PI * 2;
          const r = i % 2 ? 90 : 78;
          const x = 120 + r * Math.cos(a);
          const y = 120 + r * Math.sin(a);
          const s = i % 3 === 0 ? 3.2 : 2.2;
          return (
            <polygon
              key={i}
              points={`${x},${y - s} ${x + s * 0.8},${y} ${x},${y + s} ${x - s * 0.8},${y}`}
              fill={i % 2 ? "#B9A2FF" : accent}
              opacity={live || ready ? 0.85 : 0.35}
            />
          );
        })}
      </g>

      {/* the crystal */}
      <g className="core__crystal">
        <polygon points="120,52 120,188 82,166 82,74" fill="#4B2EA3" />
        <polygon points="120,52 158,74 158,98 134,98 134,142 158,142 158,166 120,188" fill="#6A42D9" />
        <g clipPath={`url(#crystal${uid})`}>
          <rect
            className="core__charge"
            x="70"
            y={fillTop}
            width="100"
            height={200}
            fill={`url(#charge${uid})`}
            opacity={live || ready ? 0.9 : 0}
          />
          {(live || ready) && <rect className="core__scan" x="70" y={fillTop - 1} width="100" height="2" fill="#FFFFFF" opacity="0.8" />}
        </g>
        <polygon points="82,74 120,52 158,74 120,91" fill="#FFFFFF" fillOpacity="0.16" />
        <line x1="120" y1="52" x2="120" y2="188" stroke="#E9E1FF" strokeOpacity="0.45" strokeWidth="1" />
        <polygon
          points="120,52 158,74 158,98 134,98 134,142 158,142 158,166 120,188 82,166 82,74"
          fill="none"
          stroke={live || ready ? accent : "#9B74FF"}
          strokeOpacity={live || ready ? 0.9 : 0.5}
          strokeWidth="1.25"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}
