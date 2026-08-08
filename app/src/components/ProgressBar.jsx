import "../styles/ProgressBar.css";
import { useMiningContext } from "../context/MiningContext";

const MINING_DURATION = 8 * 60 * 60;

function ProgressBar() {
  const {
    mining,
    timeLeft,
    canClaim
  } = useMiningContext();

  // Don't show the progress card before mining starts
  if (!mining && !canClaim) {
    return null;
  }

  let progress = 0;

  // If mining is currently running, calculate ONLY from the timer.
  if (mining) {
    const elapsed = MINING_DURATION - timeLeft;

    progress = (elapsed / MINING_DURATION) * 100;

    // Keep between 0 and 100
    progress = Math.max(0, Math.min(100, progress));
  }

  // Only show 100% when the actual mining cycle is finished.
  if (!mining && canClaim) {
    progress = 100;
  }

  return (
    <div className="progress-card">

      <div className="progress-header">
        <span>⛏️ Mining Progress</span>
        <strong>{progress.toFixed(1)}%</strong>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${progress}%`
          }}
        />
      </div>

      <div className="progress-labels">
        <span>0h</span>
        <span>2h</span>
        <span>4h</span>
        <span>6h</span>
        <span>8h</span>
      </div>

    </div>
  );
}

export default ProgressBar;