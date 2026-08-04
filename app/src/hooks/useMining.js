import { useEffect, useState } from "react";
import { loadData, saveData } from "../utils/storage";
import { MINING_DURATION, PICKAXE_LEVELS } from "../data/config";

export default function useMining() {
  const [balance, setBalance] = useState(0);
  const [mining, setMining] = useState(false);
  const [startTime, setStartTime] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [canClaim, setCanClaim] = useState(false);

  useEffect(() => {
    const data = loadData();

    setBalance(data.balance);
    setMining(data.mining);
    setStartTime(data.startTime);
    setCanClaim(data.canClaim || false);
  }, []);

  useEffect(() => {
    if (!mining || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = MINING_DURATION - elapsed;

      if (remaining <= 0) {
        setMining(false);
        setCanClaim(true);
        setTimeLeft(0);

        saveData({
          balance,
          mining: false,
          startTime,
          canClaim: true,
        });

        clearInterval(interval);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [mining, startTime, balance]);

  async function startMining() {
    try {
      const response = await fetch("http://localhost:5000/mine/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: 1, // temporary user id
        }),
      });

      const data = await response.json();

      if (!data.success) {
        alert(data.message);
        return;
      }

      const now = Date.now();

      setMining(true);
      setCanClaim(false);
      setStartTime(now);

      saveData({
        balance,
        mining: true,
        startTime: now,
        canClaim: false,
      });

    } catch (err) {
      console.error(err);
      alert("Cannot connect to server.");
    }
  }

  function claimReward() {
    const newBalance = balance + PICKAXE_LEVELS[1].reward;

    setBalance(newBalance);
    setCanClaim(false);

    saveData({
      balance: newBalance,
      mining: false,
      startTime: null,
      canClaim: false,
    });
  }

  return {
    balance,
    mining,
    timeLeft,
    canClaim,
    startMining,
    claimReward,
  };
}