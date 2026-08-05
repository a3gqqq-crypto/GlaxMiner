import BottomNav from "../components/BottomNav";
import { useGame } from "../context/GameContext";
import {
  PICKAXE_LEVELS,
  MAX_PICKAXE_LEVEL,
} from "../data/config";

import { upgradePickaxe } from "../api/upgradeApi";
import { loadUser } from "../api/userApi";
import { useAuth } from "../context/AuthContext";

function Upgrades({ page, setPage }) {
  const { game, setGame } = useGame();
  const { user } = useAuth();

  const reward =
    PICKAXE_LEVELS[game.pickaxeLevel]?.reward || 100;

  const nextCost =
    game.pickaxeLevel < MAX_PICKAXE_LEVEL
      ? PICKAXE_LEVELS[game.pickaxeLevel + 1].upgradeCost
      : 0;

  async function handleUpgrade() {
    if (!user) return;

    const result = await upgradePickaxe(user.telegram_id);

    if (!result.success) {
      alert(result.message);
      return;
    }

    const refreshed = await loadUser(user.telegram_id);

    if (refreshed.success) {
      setGame(prev => ({
        ...prev,
        balance: refreshed.user.balance,
        pickaxeLevel: refreshed.user.pickaxe_level,
      }));
    }
  }

  return (
    <div className="app-container">
      <main className="main-content">

        <h1 className="page-title">
          🚀 Upgrades
        </h1>

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
              <span>
                Maximum Level Reached
              </span>
            )}

          </div>

          <button
            onClick={handleUpgrade}
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