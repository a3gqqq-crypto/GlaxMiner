import "../styles/StatsCards.css";

function StatsCards() {
  return (
    <div className="stats-grid">

      <div className="stat-card">
        <div className="stat-icon">⏱️</div>
        <h3>8h</h3>
        <p>Duration</p>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💎</div>
        <h3>5</h3>
        <p>Rewards/Cycle</p>
      </div>

      <div className="stat-card">
        <div className="stat-icon">💎</div>
        <h3>15</h3>
        <p>Daily Rewards</p>
      </div>

    </div>
  );
}

export default StatsCards;