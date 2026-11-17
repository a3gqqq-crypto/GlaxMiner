import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";
import {
  startMining as startMiningApi,
  getMiningStatus,
  claimMining,
} from "../api/miningApi";

// The server owns the session: duration, reward and whether a claim is
// allowed all come from /mine/status. The countdown below is display only.

const STATUS_REFRESH_MS = 30_000;

export default function useMining() {
  const { user } = useAuth();
  const { game, setGame } = useGame();

  const [status, setStatus] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  // server clock minus device clock, so a wrong phone clock can't skew the timer
  const clockOffset = useRef(0);

  const applyStatus = useCallback(
    (data) => {
      if (!data?.success) return;

      clockOffset.current = Number(data.serverTime) - Date.now();
      setStatus(data);

      setGame((prev) => ({
        ...prev,
        balance: Number(data.balance),
        pickaxeLevel: data.pickaxeLevel,
        mining: data.mining,
        miningStart: data.mining ? data.startTime : 0,
        canClaim: data.canClaim,
      }));
    },
    [setGame]
  );

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      applyStatus(await getMiningStatus());
    } catch (err) {
      console.error("Mining status error:", err);
    }
  }, [user, applyStatus]);

  // Load status on login, then refresh occasionally while mining
  useEffect(() => {
    if (!user) return;
    refresh();
  }, [user, refresh]);

  useEffect(() => {
    if (!user || !game.mining) return;
    const id = setInterval(refresh, STATUS_REFRESH_MS);
    return () => clearInterval(id);
  }, [user, game.mining, refresh]);

  // Local countdown (display only)
  const duration = status?.duration ?? 0;

  useEffect(() => {
    if (!game.mining || !game.miningStart || !duration) {
      setTimeLeft(0);
      return;
    }

    const tick = () => {
      const now = Date.now() + clockOffset.current;
      const elapsed = Math.floor((now - Number(game.miningStart)) / 1000);
      setTimeLeft(Math.max(0, duration - elapsed));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [game.mining, game.miningStart, duration]);

  async function start() {
    if (!user || busy) return;
    setBusy(true);

    try {
      const data = await startMiningApi();

      if (!data.success) {
        alert(data.message);
      }

      await refresh();
    } catch (err) {
      console.error("Start mining error:", err);
      alert("Could not start mining.");
    } finally {
      setBusy(false);
    }
  }

  async function claim() {
    if (!user || busy) return;
    setBusy(true);

    try {
      const data = await claimMining();

      if (!data.success) {
        alert(data.message);
      }

      await refresh();
    } catch (err) {
      console.error("Claim error:", err);
      alert("Could not claim the reward.");
    } finally {
      setBusy(false);
    }
  }

  const finished = game.mining && duration > 0 && timeLeft === 0;

  return {
    balance: Number(game.balance ?? 0),
    mining: game.mining,
    timeLeft,
    canClaim: finished || Boolean(status?.canClaim && game.mining),
    busy,
    miningDuration: duration,
    rewardPerCycle: status?.reward ?? null,
    pickaxeLevel: game.pickaxeLevel,
    startMining: start,
    claimReward: claim,
    refreshStatus: refresh,
  };
}
