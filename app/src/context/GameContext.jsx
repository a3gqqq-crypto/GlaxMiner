import { createContext, useContext, useEffect, useState } from "react";
import { loadData, saveData } from "../utils/storage";
import { PICKAXE_LEVELS, MAX_PICKAXE_LEVEL } from "../data/config";

const GameContext = createContext();

export function GameProvider({ children }) {
  const [game, setGame] = useState(loadData());

  useEffect(() => {
    saveData(game);
  }, [game]);

  function addBalance(amount) {
    setGame(prev => ({
      ...prev,
      balance: prev.balance + amount,
    }));
  }

  function spendBalance(amount) {
    if (game.balance < amount) return false;

    setGame(prev => ({
      ...prev,
      balance: prev.balance - amount,
    }));

    return true;
  }

  function upgradePickaxe() {
  if (game.pickaxeLevel >= MAX_PICKAXE_LEVEL) {
    alert("Maximum Level Reached");
    return;
  }

  const cost = PICKAXE_LEVELS[game.pickaxeLevel + 1].upgradeCost;

  if (game.balance < cost) {
    alert("Not enough GLX");
    return;
  }

  setGame(prev => {
    const updated = {
      ...prev,
      balance: prev.balance - cost,
      pickaxeLevel: prev.pickaxeLevel + 1,
    };

    saveData(updated);

    return updated;
  });
}

  return (
    <GameContext.Provider
      value={{
        game,
        setGame,
        addBalance,
        spendBalance,
        upgradePickaxe,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}