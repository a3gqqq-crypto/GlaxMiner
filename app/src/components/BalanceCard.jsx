import { useGame } from "../context/GameContext";

function BalanceCard() {
  const { game } = useGame();

  return (
    <div className="balance-card">
      <p>Your Balance</p>

      <h1>{game.balance} GLX</h1>

      <span>
        Reward: {game.pickaxeLevel ? `${100 + (game.pickaxeLevel - 1) * 25} GLX` : "100 GLX"}
      </span>
    </div>
  );
}

export default BalanceCard;