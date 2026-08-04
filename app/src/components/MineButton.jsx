import { useMiningContext } from "../context/MiningContext";

function formatTime(seconds) {
  const h = String(Math.floor(seconds / 3600)).padStart(2, "0");
  const m = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");

  return `${h}:${m}:${s}`;
}

function MineButton() {
  const {
    mining,
    timeLeft,
    canClaim,
    startMining,
    claimReward,
  } = useMiningContext();

  if (canClaim) {
    return (
      <button className="mine-button" onClick={claimReward}>
        🎁 Claim 100 GLX
      </button>
    );
  }

  if (mining) {
    return (
      <button className="mine-button" disabled>
        ⏳ {formatTime(timeLeft)}
      </button>
    );
  }

  return (
    <button className="mine-button" onClick={startMining}>
      ⛏️ Start Mining
    </button>
  );
}

export default MineButton;