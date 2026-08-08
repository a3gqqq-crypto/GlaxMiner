import { useEffect, useState } from "react";

import { useGame } from "../context/GameContext";

import {
  startMining,
  syncMining,
} from "../api/miningApi";

import "./MiningCard.css";

function MiningCard() {

  // IMPORTANT:
  // user is separate from game in GameContext
  const {
    game,
    setGame,
    user,
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

  // ==========================================
  // KEEP BALANCE DISPLAY IN SYNC
  // ==========================================

  useEffect(() => {
    setDisplayBalance(Number(balance || 0));
  }, [balance]);

  // ==========================================
  // LOCAL COUNTDOWN
  // ==========================================

  useEffect(() => {

    if (!mining || !miningStart) {
      setTimeLeft(0);
      return;
    }

    const updateTimer = () => {

      const elapsed = Math.floor(
        (Date.now() - Number(miningStart)) / 1000
      );

      const duration = 8 * 60 * 60;

      const remaining = Math.max(
        0,
        duration - elapsed
      );

      setTimeLeft(remaining);

    };

    updateTimer();

    const interval = setInterval(
      updateTimer,
      1000
    );

    return () => {
      clearInterval(interval);
    };

  }, [
    mining,
    miningStart,
  ]);

  // ==========================================
  // SYNC WITH SERVER
  // ==========================================

  useEffect(() => {

    if (!mining) {
      return;
    }

    if (!user?.telegram_id) {
      console.log("Mining sync waiting for Telegram ID...");
      return;
    }

    const sync = async () => {

      try {

        const data = await syncMining(
          user.telegram_id
        );

        console.log("MINING SYNC:", data);

        if (!data.success) {
          console.error(
            "Mining sync failed:",
            data.message
          );
          return;
        }

        // ==========================================
        // UPDATE BALANCE
        // ==========================================

        if (data.balance !== undefined) {

          setGame((prev) => ({
            ...prev,

            balance: Number(
              data.balance
            ),

            mining:
              data.mining,

            miningStart:
              data.mining
                ? prev.miningStart
                : 0,

            canClaim: false,
          }));

          setDisplayBalance(
            Number(data.balance)
          );
        }

        // ==========================================
        // MINING FINISHED
        // ==========================================

        if (data.finished) {

          setGame((prev) => ({
            ...prev,

            mining: false,

            miningStart: 0,

            canClaim: false,

            balance: Number(
              data.balance
            ),
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

    // Sync immediately
    sync();

    // Then sync every 5 seconds
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

  // ==========================================
  // START MINING
  // ==========================================

  const handleStartMining = async () => {

    if (!user?.telegram_id) {

      console.error(
        "No Telegram ID found."
      );

      return;
    }

    try {

      console.log(
        "Starting mining for:",
        user.telegram_id
      );

      const data = await startMining(
        user.telegram_id
      );

      console.log(
        "START MINING RESPONSE:",
        data
      );

      if (!data.success) {

        console.error(
          data.message
        );

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
        data.duration || 8 * 60 * 60
      );

    } catch (err) {

      console.error(
        "Start mining error:",
        err
      );

    }

  };

  // ==========================================
  // FORMAT TIME
  // ==========================================

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

  // ==========================================
  // UI
  // ==========================================

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

      <div
        style={{
          marginTop: "10px",
          textAlign: "center",
          fontWeight: "800",
          fontSize: "14px",
          color: "#ffffff",
        }}
      >

        💎 Tokens Earned:{" "}

        {displayBalance.toFixed(6)}

      </div>

    </div>

  );

}

export default MiningCard;