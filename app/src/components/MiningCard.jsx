import MineButton from "./MineButton";

function MiningCard() {
  return (
    <div className="mining-card">
      <h2>⛏️ Mining</h2>

      <div className="planet-orb">
        <span>🌌</span>
      </div>

      <MineButton />
    </div>
  );
}

export default MiningCard;