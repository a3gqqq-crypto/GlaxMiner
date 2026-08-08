import { useMiningContext } from "../context/MiningContext";

function MineButton() {
  const { mining, canClaim, startMining, claimReward } = useMiningContext();

  if (canClaim) {
    return (
      <button
        className="mine-button claim"
        onClick={claimReward}
      >
        🎁 Claim Reward
      </button>
    );
  }

  if (mining) {
    return (
      <button
        className="mine-button"
        disabled
      >
        ⛏️ Mining...
      </button>
    );
  }

  return (
    <button
      className="mine-button"
      onClick={startMining}
    >
      🚀 Start Mining
    </button>
  );
}

export default MineButton;