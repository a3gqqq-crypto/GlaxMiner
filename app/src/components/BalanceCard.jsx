import "../styles/BalanceCard.css";

function BalanceCard() {
  // Temporary values
  // We will connect these to the backend later.
  const tokensEarned = 0;
  const poolEarned = 0;
  const poolLimit = 150000;
  const tokensPerMinute = 0;

  return (
    <div className="token-card">

      {/* Tokens Earned */}
      <div className="token-title">
        <span className="token-dot"></span>
        Tokens Earned
      </div>

      <div className="token-earned">
        💎 {tokensEarned.toFixed(6)}
      </div>

      {/* Pool + Mining Rate */}
      <div className="token-info">

        <div className="pool-info">
          <span>Total Pool Limit</span>

          <strong>
            {poolEarned.toLocaleString()} /{" "}
            {poolLimit.toLocaleString()}
          </strong>
        </div>

        <div className="rate-info">
          <span>Tokens/min</span>

          <strong>
            {tokensPerMinute.toFixed(4)}
          </strong>
        </div>

      </div>

    </div>
  );
}

export default BalanceCard;