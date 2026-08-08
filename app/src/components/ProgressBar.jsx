import "../styles/ProgressBar.css";
import { useMiningContext } from "../context/MiningContext";

const MINING_DURATION = 8 * 60 * 60;

function ProgressBar() {
  const {
    mining,
    timeLeft,
    canClaim,
  } = useMiningContext();

  // Don't show before mining starts
  if (!mining && !canClaim) {
    return null;
  }

  let progress = 0;

  // Mining is running
  if (mining) {
    const elapsed = MINING_DURATION - timeLeft;

    progress = (elapsed / MINING_DURATION) * 100;

    progress = Math.max(0, Math.min(100, progress));
  }

  // Finished
  if (!mining && canClaim) {
    progress = 100;
  }

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
            mining ? "is-mining" : "is-finished"
          }`}
          style={{
            width: `${progress}%`,
          }}
        >
          {mining && (
            <div className="progress-shine" />
          )}
        </div>

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