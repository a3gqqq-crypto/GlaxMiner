import "../styles/StatsCards.css";
import { useMiningContext } from "../context/MiningContext";

// Values come from the server (/mine/status), not hard-coded numbers.
function StatsCards() {
  const {
    miningDuration,
    rewardPerCycle,
    pickaxeLevel,
  } = useMiningContext();

  const hours = miningDuration ? `${miningDuration / 3600}h` : "–";

  return (
    <div className="stats-grid">

      <div className="stat-card">
        <div className="stat-icon">⏱️</div>
        <h3>{hours}</h3>
        <p>Duration</p>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💎</div>
        <h3>{rewardPerCycle ?? "–"}</h3>
        <p>Rewards/Cycle</p>
      </div>

      <div className="stat-card">
        <div className="stat-icon">⛏️</div>
        <h3>{pickaxeLevel ? `Lv ${pickaxeLevel}` : "–"}</h3>
        <p>Pickaxe</p>
      </div>

    </div>
  );
}

export default StatsCards;
