import { useEffect, useState } from "react";

import { useAuth } from "../context/AuthContext";
import { useGame } from "../context/GameContext";

import {
  startMining,
  syncMining,
} from "../api/miningApi";

import "./MiningCard.css";

function MiningCard() {
  const { user } = useAuth();

  const {
    game,
    setGame,
  } = useGame();

  const {
    mining,
    miningStart,
    balance,
  } = game;

  const [timeLeft, setTimeLeft] = useState(0);

  const [displayBalance, setDisplayBalance] = useState(
    Number(balance || 0)
  );

  // =====================================================
  // KEEP DISPLAY BALANCE IN SYNC
  // =====================================================

  useEffect(() => {
    setDisplayBalance(Number(balance || 0));
  }, [balance]);

  // =====================================================
  // COUNTDOWN + LIVE BALANCE
  // =====================================================

  useEffect(() => {
    if (!mining || !miningStart) {
      setTimeLeft(0);
      return;
    }

    const update = () => {
      const now = Date.now();

      const elapsed = Math.floor(
        (now - Number(miningStart)) / 1000
      );

      const duration = 8 * 60 * 60;

      const remaining = Math.max(
        0,
        duration - elapsed
      );

      setTimeLeft(remaining);

      // Live mining reward
      const rate = 5 / duration;

      const liveEarned =
        Math.min(elapsed, duration) * rate;

      setDisplayBalance(
        Number(balance || 0) + liveEarned
      );
    };

    update();

    const interval = setInterval(
      update,
      1000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    mining,
    miningStart,
    balance,
  ]);

  // =====================================================
  // SYNC WITH SERVER
  // =====================================================

  useEffect(() => {
    if (!mining || !user?.telegram_id) {
      return;
    }

    const sync = async () => {
      try {
        const data = await syncMining(
          user.telegram_id
        );

        if (!data.success) {
          console.error(
            "Mining sync failed:",
            data.message
          );
          return;
        }

        if (data.balance !== undefined) {
          setGame((prev) => ({
            ...prev,

            balance: Number(data.balance),

            mining: data.mining,

            miningStart:
              data.miningStart ||
              prev.miningStart,

            canClaim: false,
          }));

          setDisplayBalance(
            Number(data.balance)
          );
        }

        // =================================================
        // 8 HOURS FINISHED
        // =================================================

        if (data.finished) {
          setGame((prev) => ({
            ...prev,

            mining: false,

            miningStart: 0,

            canClaim: false,
          }));

          setTimeLeft(0);
        }
      } catch (err) {
        console.error(
          "Mining sync error:",
          err
        );
      }
    };

    sync();

    const interval = setInterval(
      sync,
      5000
    );

    return () => {
      clearInterval(interval);
    };
  }, [
    mining,
    user,
    setGame,
  ]);

  // =====================================================
  // START MINING
  // =====================================================

  const handleStartMining = async () => {
    try {
      if (!user?.telegram_id) {
        console.error(
          "No Telegram ID found:",
          user
        );

        alert(
          "User account not loaded. Please reopen the app."
        );

        return;
      }

      console.log(
        "Starting mining for Telegram ID:",
        user.telegram_id
      );

      const data = await startMining(
        user.telegram_id
      );

      console.log(
        "Start mining response:",
        data
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
        8 * 60 * 60
      );

      setDisplayBalance(
        Number(balance || 0)
      );
    } catch (err) {
      console.error(
        "Start mining error:",
        err
      );

      alert(
        "Could not start mining. Check the console."
      );
    }
  };

  // =====================================================
  // FORMAT TIMER
  // =====================================================

  function formatTime(seconds) {
    const hours =
      Math.floor(seconds / 3600);

    const minutes =
      Math.floor(
        (seconds % 3600) / 60
      );

    const secs =
      seconds % 60;

    return `${String(hours).padStart(
      2,
      "0"
    )}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(secs).padStart(
      2,
      "0"
    )}`;
  }

  return (
    <div className="mining-card">

      <div className="mining-image-box">

        <img
          src="/miner.png"
          alt="Mining"
          className="mining-image"
        />

        <div className="mining-bottom">

          <div className="mining-timer">
            {mining
              ? formatTime(timeLeft)
              : "08:00:00"}
          </div>

          {mining && (
            <div className="mining-progress-text">
              ⚡ Mining in progress...
            </div>
          )}

        </div>

      </div>

      {!mining && (
        <button
          className="mine-button"
          onClick={handleStartMining}
        >
          ⛏️ Start Mining
        </button>
      )}

    </div>
  );
}

export default MiningCard;