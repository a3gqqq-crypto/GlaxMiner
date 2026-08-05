import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import { startMining, claimMining } from "../api/miningApi";
import { loadUser } from "../api/userApi";

const MINING_DURATION = 5 * 60 * 60;

export default function useMining() {
  const { user } = useAuth();
  const { game, setGame } = useGame();

  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!game.mining) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - game.miningStart) / 1000
      );

      const remaining = MINING_DURATION - elapsed;

      if (remaining <= 0) {
        setTimeLeft(0);

        setGame(prev => ({
          ...prev,
          mining: false,
          canClaim: true,
        }));

        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [game.mining, game.miningStart, setGame]);

  async function start() {
    if (!user) return;

    const data = await startMining(user.telegram_id);

    if (!data.success) {
      alert(data.message);
      return;
    }

    setGame(prev => ({
      ...prev,
      mining: true,
      miningStart: data.startTime,
      canClaim: false,
    }));
  }

  async function claim() {
    if (!user) return;

    const data = await claimMining(user.telegram_id);

    if (!data.success) {
      alert(data.message);
      return;
    }

    const refreshed = await loadUser(user.telegram_id);

    if (refreshed.success) {
      setGame(prev => ({
        ...prev,
        balance: refreshed.user.balance,
        pickaxeLevel: refreshed.user.pickaxe_level,
        mining: refreshed.user.mining,
        miningStart: refreshed.user.mining_start,
        canClaim: refreshed.user.can_claim,
      }));
    }
  }

  return {
    balance: game.balance ?? 0,
    mining: game.mining,
    timeLeft,
    canClaim: game.canClaim,
    startMining: start,
    claimReward: claim,
  };
}