import "../styles/ProgressBar.css";
import { useMiningContext } from "../context/MiningContext";

function ProgressBar() {
  const {
    mining,
    timeLeft,
    canClaim,
    miningDuration,
  } = useMiningContext();

  // Don't show before mining starts
  if (!mining || !miningDuration) {
    return null;
  }

  let progress = ((miningDuration - timeLeft) / miningDuration) * 100;
  progress = Math.max(0, Math.min(100, progress));

  if (canClaim) {
    progress = 100;
  }

  // One label per hour of the server's session length (5 h -> 0h..5h)
  const hours = Math.round(miningDuration / 3600);
  const labels = Array.from({ length: hours + 1 }, (_, i) => `${i}h`);

  return (
    <div className="progress-card">

      <div className="progress-header">
        <span>
          ⛏️ Mining Progress
        </span>

        <strong>
          {progress.toFixed(1)}%
        </strong>
      </div>

      <div className="progress-track">

        <div
          className={`progress-fill ${
            canClaim ? "is-finished" : "is-mining"
          }`}
          style={{
            width: `${progress}%`,
          }}
        >
          {!canClaim && (
            <div className="progress-shine" />
          )}
        </div>

      </div>

      <div className="progress-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>

    </div>
  );
}

export default ProgressBar;
