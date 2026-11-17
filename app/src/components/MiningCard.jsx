import { useMiningContext } from "../context/MiningContext";

import "./MiningCard.css";

// Session state, duration and reward come from the server (useMining).
// This component only displays them and sends start / claim requests.

function formatTime(seconds) {
  const s = Math.max(0, Math.floor(seconds || 0));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const secs = s % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}:${String(secs).padStart(2, "0")}`;
}

function MiningCard() {
  const {
    mining,
    timeLeft,
    canClaim,
    busy,
    balance,
    miningDuration,
    rewardPerCycle,
    startMining,
    claimReward,
  } = useMiningContext();

  return (
    <div className="mining-card">
      <div className="mining-image-box">
        <img src="/miner.png" alt="Mining" className="mining-image" />

        <div className="mining-bottom">
          <div className="mining-timer">
            {mining ? formatTime(timeLeft) : formatTime(miningDuration)}
          </div>

          {mining && !canClaim && (
            <div className="mining-progress-text">⚡ Mining in progress...</div>
          )}

          {canClaim && (
            <div className="mining-progress-text">✅ Session complete</div>
          )}
        </div>
      </div>

      {!mining && (
        <button
          className="mine-button"
          onClick={startMining}
          disabled={busy}
        >
          ⛏️ Start Mining
        </button>
      )}

      {canClaim && (
        <button
          className="mine-button"
          onClick={claimReward}
          disabled={busy}
        >
          💎 Claim {rewardPerCycle ?? ""} GLX
        </button>
      )}

      <div
        style={{
          marginTop: "10px",
          textAlign: "center",
          fontWeight: "800",
          fontSize: "14px",
          color: "#ffffff",
        }}
      >
        💎 Balance: {Number(balance || 0).toLocaleString()} GLX
      </div>
    </div>
  );
}

export default MiningCard;
