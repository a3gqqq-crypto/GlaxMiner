import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import {
  startMining as startMiningApi,
  syncMining,
} from "../api/miningApi";
import { loadUser } from "../api/userApi";

// ==========================================
// MINING SETTINGS
// ==========================================

const MINING_DURATION = 8 * 60 * 60;

// 5 GLX per 8 hours
const REWARD_PER_CYCLE = 5;

// 15 GLX maximum per 24 hours
const DAILY_LIMIT = 15;

export default function useMining() {
  const { user } = useAuth();
  const { game, setGame } = useGame();

  const [timeLeft, setTimeLeft] = useState(0);
  const [miningReward, setMiningReward] = useState(0);

  // ==========================================
  // MINING TIMER
  // ==========================================

  useEffect(() => {
    if (!game.mining || !game.miningStart) {
      setTimeLeft(0);
      setMiningReward(0);
      return;
    }

    let syncing = false;

    const updateMining = async () => {
      const elapsed = Math.floor(
        (Date.now() - Number(game.miningStart)) / 1000
      );

      const remaining = Math.max(
        0,
        MINING_DURATION - elapsed
      );

      setTimeLeft(remaining);

      if (!user || syncing) {
        return;
      }

      syncing = true;

      try {
        const data = await syncMining(
          user.telegram_id
        );

        if (data.success) {

          // Update balance immediately
          if (data.balance !== undefined) {
            setGame((prev) => ({
              ...prev,
              balance: Number(data.balance),
            }));
          }

          // Show how much was just earned
          if (data.totalEarned !== undefined) {
            setMiningReward(
              Number(data.totalEarned)
            );
          }

          // 8 hours finished
          if (data.finished) {
            const refreshed = await loadUser(
              user.telegram_id
            );

            if (refreshed.success) {
              setGame((prev) => ({
                ...prev,

                balance:
                  Number(refreshed.user.balance),

                pickaxeLevel:
                  refreshed.user.pickaxe_level,

                mining:
                  false,

                miningStart:
                  0,

                canClaim:
                  false,
              }));
            }

            setTimeLeft(0);
            setMiningReward(0);
          }
        }

      } catch (err) {
        console.error(
          "Mining sync error:",
          err
        );
      }

      syncing = false;
    };

    // Run immediately
    updateMining();

    // Then sync every second
    const interval = setInterval(
      updateMining,
      1000
    );

    return () => {
      clearInterval(interval);
    };

  }, [
    game.mining,
    game.miningStart,
    user,
    setGame,
  ]);

  // ==========================================
  // START MINING
  // ==========================================

  async function start() {
    if (!user) return;

    try {
      const data = await startMiningApi(
        user.telegram_id
      );

      if (!data.success) {
        alert(data.message);
        return;
      }

      setGame((prev) => ({
        ...prev,

        mining: true,

        miningStart:
          data.startTime,

        canClaim: false,
      }));

      setTimeLeft(
        MINING_DURATION
      );

      setMiningReward(0);

    } catch (err) {
      console.error(
        "Start mining error:",
        err
      );

      alert(
        "Could not start mining."
      );
    }
  }

  // ==========================================
  // RETURN
  // ==========================================

  return {
    balance:
      Number(game.balance ?? 0),

    mining:
      game.mining,

    timeLeft,

    // No claim anymore
    canClaim: false,

    miningReward,

    miningDuration:
      MINING_DURATION,

    rewardPerCycle:
      REWARD_PER_CYCLE,

    dailyLimit:
      DAILY_LIMIT,

    startMining:
      start,

    // Kept for compatibility
    claimReward: () => {},
  };
}