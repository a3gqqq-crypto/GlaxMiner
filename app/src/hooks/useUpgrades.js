import { useState } from "react";
import { loadData, saveData } from "../utils/storage";
import { PICKAXE_LEVELS, MAX_PICKAXE_LEVEL } from "../data/config";

export default function useUpgrades() {
  const data = loadData();

  const [pickaxeLevel, setPickaxeLevel] = useState(
    data.pickaxeLevel || 1
  );

  const [balance, setBalance] = useState(
    data.balance || 0
  );

  function upgradePickaxe() {
    if (pickaxeLevel >= MAX_PICKAXE_LEVEL) {
      alert("Maximum Level Reached");
      return;
    }

    const cost = PICKAXE_LEVELS[pickaxeLevel + 1].upgradeCost;

    if (balance < cost) {
      alert("Not enough GLX");
      return;
    }

    const newBalance = balance - cost;
    const newLevel = pickaxeLevel + 1;

    const updated = {
      ...data,
      balance: newBalance,
      pickaxeLevel: newLevel,
    };

    saveData(updated);

    setBalance(newBalance);
    setPickaxeLevel(newLevel);
  }

  return {
    balance,
    pickaxeLevel,
    reward: PICKAXE_LEVELS[pickaxeLevel].reward,
    nextCost:
      pickaxeLevel < MAX_PICKAXE_LEVEL
        ? PICKAXE_LEVELS[pickaxeLevel + 1].upgradeCost
        : 0,
    upgradePickaxe,
  };
}