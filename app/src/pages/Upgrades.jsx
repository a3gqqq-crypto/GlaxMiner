import BottomNav from "../components/BottomNav";
import { useGame } from "../context/GameContext";
import {
  PICKAXE_LEVELS,
  MAX_PICKAXE_LEVEL,
} from "../data/config";
import { saveData } from "../utils/storage";

function Upgrades({ page, setPage }) {
  const { game, setGame, upgradePickaxe } = useGame();

  const reward = PICKAXE_LEVELS[game.pickaxeLevel].reward;

  const nextCost =
    game.pickaxeLevel < MAX_PICKAXE_LEVEL
      ? PICKAXE_LEVELS[game.pickaxeLevel + 1].upgradeCost
      : 0;

  function addMoney() {
    const updated = {
      ...game,
      balance: game.balance + 10000,
    };

    saveData(updated);
    setGame(updated);
  }

  function resetProgress() {
    const updated = {
      ...game,
      balance: 0,
      pickaxeLevel: 1,
    };

    saveData(updated);
    setGame(updated);
  }

  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">🚀 Upgrades</h1>

        <button
          className="dev-button"
          onClick={addMoney}
        >
          💰 Add 10,000 GLX
        </button>

        <button
          className="dev-button"
          onClick={resetProgress}
        >
          🔄 Reset Progress
        </button>

        <div className="upgrade-card">
          <div>
            <h2>⛏️ Pickaxe</h2>

            <p>Level {game.pickaxeLevel}</p>

            <span>
              Reward: {reward} GLX
            </span>

            <br />

            {nextCost > 0 ? (
              <span>
                Upgrade Cost: {nextCost} GLX
              </span>
            ) : (
              <span>Maximum Level Reached</span>
            )}
          </div>

          <button
            onClick={upgradePickaxe}
            disabled={game.pickaxeLevel >= MAX_PICKAXE_LEVEL}
          >
            {game.pickaxeLevel >= MAX_PICKAXE_LEVEL
              ? "MAX"
              : "Upgrade"}
          </button>
        </div>

      </main>

      <BottomNav
        page={page}
        setPage={setPage}
      />
    </div>
  );
}

export default Upgrades;