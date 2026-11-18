// Ambient backdrop: a faint field of drifting Glaxite shards and dust.
// Pure decoration (aria-hidden), frozen under reduced motion.
const SHARDS = [
  [8, 14, 9, 0.18], [86, 9, 6, 0.14], [92, 38, 11, 0.12], [4, 52, 7, 0.1], [76, 66, 5, 0.16],
  [18, 82, 10, 0.1], [60, 90, 6, 0.12], [40, 24, 4, 0.12], [64, 46, 3, 0.1], [28, 64, 4, 0.12],
];

export default function Belt() {
  return (
    <div className="belt" aria-hidden="true">
      <div className="belt__dust" />
      {SHARDS.map(([x, y, s, o], i) => (
        <svg
          key={i}
          className="belt__shard"
          style={{ left: `${x}%`, top: `${y}%`, width: s * 4, height: s * 4, opacity: o, animationDelay: `${-i * 3.7}s`, animationDuration: `${26 + (i % 4) * 7}s` }}
          viewBox="0 0 20 20"
        >
          <polygon points="10,1 17,6 15,16 7,19 3,10" fill="#8B5CF6" />
          <polygon points="10,1 17,6 10,9" fill="#B9A2FF" />
        </svg>
      ))}
    </div>
  );
}
